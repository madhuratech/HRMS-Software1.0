const InterviewSchedule = require('../models/InterviewSchedule');

class InterviewScheduleService {
  static async create(data, userId) {
    // Prevent duplicate interview schedules for the same candidate at the same date and time
    const duplicate = await InterviewSchedule.query(
      'SELECT id FROM interview_schedules WHERE candidate_id = ? AND interview_date = ? AND interview_time = ?',
      [data.candidate_id, data.interview_date, data.interview_time]
    );
    if (duplicate.length > 0) {
      throw new Error('This candidate already has an interview scheduled at this exact date and time');
    }

    const sql = `
      INSERT INTO interview_schedules (
        candidate_id, interviewer_id, interview_round, interview_mode,
        interview_date, interview_time, location, meeting_link,
        status, remarks, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.candidate_id, data.interviewer_id, data.interview_round, data.interview_mode,
      data.interview_date, data.interview_time, data.location || null, data.meeting_link || null,
      data.status || 'Scheduled', data.remarks || null, userId, userId
    ];

    await InterviewSchedule.beginTransaction();
    try {
      const result = await InterviewSchedule.query(sql, params);

      // Auto-sync candidate status to 'Interview Scheduled'
      if (data.candidate_id) {
        await InterviewSchedule.query(
          "UPDATE candidates SET status = 'Interview Scheduled', updated_by = ? WHERE id = ?",
          [userId, data.candidate_id]
        );
      }

      await InterviewSchedule.commit();
      return { id: result.insertId };
    } catch (error) {
      await InterviewSchedule.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Interview schedule not found');

    // Prevent duplicate check if candidate, date, or time is modified
    const checkCandidate = data.candidate_id || existing.candidate_id;
    const checkDate = data.interview_date || existing.interview_date;
    const checkTime = data.interview_time || existing.interview_time;

    if (
      checkCandidate !== existing.candidate_id ||
      checkDate !== existing.interview_date ||
      checkTime !== existing.interview_time
    ) {
      const duplicate = await InterviewSchedule.query(
        'SELECT id FROM interview_schedules WHERE candidate_id = ? AND interview_date = ? AND interview_time = ? AND id != ?',
        [checkCandidate, checkDate, checkTime, id]
      );
      if (duplicate.length > 0) {
        throw new Error('This candidate already has an interview scheduled at this exact date and time');
      }
    }

    const sql = `
      UPDATE interview_schedules SET
        candidate_id = ?, interviewer_id = ?, interview_round = ?, interview_mode = ?,
        interview_date = ?, interview_time = ?, location = ?, meeting_link = ?,
        status = ?, remarks = ?, updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.candidate_id, data.interviewer_id, data.interview_round, data.interview_mode,
      data.interview_date, data.interview_time, data.location || null, data.meeting_link || null,
      data.status, data.remarks || null, userId, id
    ];

    await InterviewSchedule.beginTransaction();
    try {
      await InterviewSchedule.query(sql, params);
      await InterviewSchedule.commit();
      return true;
    } catch (error) {
      await InterviewSchedule.rollback();
      throw error;
    }
  }

  static async delete(id) {
    await InterviewSchedule.beginTransaction();
    try {
      await InterviewSchedule.query('DELETE FROM interview_schedules WHERE id = ?', [id]);
      await InterviewSchedule.commit();
      return true;
    } catch (error) {
      await InterviewSchedule.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await InterviewSchedule.query(
      `SELECT i.*, 
              c.candidate_name, c.email as candidate_email, c.job_position as candidate_job,
              e.name as interviewer_name
       FROM interview_schedules i
       LEFT JOIN candidates c ON i.candidate_id = c.id
       LEFT JOIN employees e ON i.interviewer_id = e.id
       WHERE i.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT i.*, 
             c.candidate_name, c.email as candidate_email, c.job_position as candidate_job,
             e.name as interviewer_name
      FROM interview_schedules i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN employees e ON i.interviewer_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (c.candidate_name LIKE ? OR e.name LIKE ? OR i.interview_round LIKE ? OR i.interview_mode LIKE ? OR i.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    // Filters
    if (filters.candidate_id) {
      sql += ` AND i.candidate_id = ?`;
      params.push(filters.candidate_id);
    }
    if (filters.interviewer_id) {
      sql += ` AND i.interviewer_id = ?`;
      params.push(filters.interviewer_id);
    }
    if (filters.date) {
      sql += ` AND i.interview_date = ?`;
      params.push(filters.date);
    }
    if (filters.status) {
      sql += ` AND i.status = ?`;
      params.push(filters.status);
    }
    if (filters.interview_mode) {
      sql += ` AND i.interview_mode = ?`;
      params.push(filters.interview_mode);
    }
    if (filters.interview_round) {
      sql += ` AND i.interview_round = ?`;
      params.push(filters.interview_round);
    }

    // Sort by Date & Time
    sql += ` ORDER BY i.interview_date ASC, i.interview_time ASC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await InterviewSchedule.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as count
      FROM interview_schedules i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN employees e ON i.interviewer_id = e.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (c.candidate_name LIKE ? OR e.name LIKE ? OR i.interview_round LIKE ? OR i.interview_mode LIKE ? OR i.status LIKE ?)`;
      countParams.push(term, term, term, term, term);
    }
    if (filters.candidate_id) {
      countSql += ` AND i.candidate_id = ?`;
      countParams.push(filters.candidate_id);
    }
    if (filters.interviewer_id) {
      countSql += ` AND i.interviewer_id = ?`;
      countParams.push(filters.interviewer_id);
    }
    if (filters.date) {
      countSql += ` AND i.interview_date = ?`;
      countParams.push(filters.date);
    }
    if (filters.status) {
      countSql += ` AND i.status = ?`;
      countParams.push(filters.status);
    }
    if (filters.interview_mode) {
      countSql += ` AND i.interview_mode = ?`;
      countParams.push(filters.interview_mode);
    }
    if (filters.interview_round) {
      countSql += ` AND i.interview_round = ?`;
      countParams.push(filters.interview_round);
    }

    const totalResult = await InterviewSchedule.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async updateStatus(id, status, remarks, userId) {
    await InterviewSchedule.beginTransaction();
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Interview schedule not found');

      const sql = `UPDATE interview_schedules SET status = ?, remarks = COALESCE(?, remarks), updated_by = ? WHERE id = ?`;
      await InterviewSchedule.query(sql, [status, remarks || null, userId, id]);

      // Sync candidate status based on interview status
      if (existing.candidate_id) {
        let candStatus = 'Interview Scheduled';
        if (status === 'Completed') candStatus = 'Interview Completed';
        else if (status === 'Cancelled') candStatus = 'On Hold';
        else if (status === 'Selected') candStatus = 'Selected';
        else if (status === 'Rejected') candStatus = 'Rejected';

        await InterviewSchedule.query(
          'UPDATE candidates SET status = ?, updated_by = ? WHERE id = ?',
          [candStatus, userId, existing.candidate_id]
        );
      }

      await InterviewSchedule.commit();
      return true;
    } catch (error) {
      await InterviewSchedule.rollback();
      throw error;
    }
  }

  static async getDashboardStats() {
    const totalQuery = `SELECT COUNT(*) as count FROM interview_schedules`;
    const todayQuery = `SELECT COUNT(*) as count FROM interview_schedules WHERE interview_date = CURDATE()`;
    const upcomingQuery = `SELECT COUNT(*) as count FROM interview_schedules WHERE interview_date > CURDATE() AND status IN ('Scheduled', 'Rescheduled')`;
    const completedQuery = `SELECT COUNT(*) as count FROM interview_schedules WHERE status = 'Completed'`;
    const cancelledQuery = `SELECT COUNT(*) as count FROM interview_schedules WHERE status = 'Cancelled'`;
    const rescheduledQuery = `SELECT COUNT(*) as count FROM interview_schedules WHERE status = 'Rescheduled'`;
    const pendingQuery = `SELECT COUNT(*) as count FROM interview_schedules WHERE status IN ('Scheduled', 'Rescheduled')`;

    const total = await InterviewSchedule.query(totalQuery);
    const today = await InterviewSchedule.query(todayQuery);
    const upcoming = await InterviewSchedule.query(upcomingQuery);
    const completed = await InterviewSchedule.query(completedQuery);
    const cancelled = await InterviewSchedule.query(cancelledQuery);
    const rescheduled = await InterviewSchedule.query(rescheduledQuery);
    const pending = await InterviewSchedule.query(pendingQuery);

    return {
      total: total[0].count,
      today: today[0].count,
      upcoming: upcoming[0].count,
      completed: completed[0].count,
      cancelled: cancelled[0].count,
      rescheduled: rescheduled[0].count,
      pending: pending[0].count
    };
  }
}

module.exports = InterviewScheduleService;
