const Candidate = require('../models/Candidate');
const AtsScoringService = require('./AtsScoringService');
const ResumeParserService = require('./ResumeParserService');

class CandidateService {
  /**
   * Helper: Resolve requirement by ID or job position
   */
  static async resolveRequirement(requirementId, jobPosition) {
    if (requirementId) {
      const rows = await Candidate.query('SELECT * FROM requirements WHERE id = ?', [requirementId]);
      if (rows.length > 0) return rows[0];
    }
    if (jobPosition) {
      const rows = await Candidate.query(
        'SELECT * FROM requirements WHERE LOWER(job_title) = LOWER(?) ORDER BY id DESC LIMIT 1',
        [jobPosition]
      );
      if (rows.length > 0) return rows[0];
    }
    return null;
  }

  static async create(data, userId) {
    // Extract resume text & skills if resume file is present
    let extractedResumeData = { skills: [], education: null, experience: null };
    if (data.resume || data.original_resume) {
      try {
        extractedResumeData = await ResumeParserService.parseResume(data.original_resume || data.resume);
      } catch (e) {
        console.warn('[CandidateService.create] Resume extraction notice:', e.message);
      }
    }

    // Merge skills with priority
    const mergedSkillsList = ResumeParserService.mergeSkills({
      resumeSkills: extractedResumeData.skills || [],
      formSkills: data.skills || ''
    });
    const finalSkills = mergedSkillsList.length > 0 ? mergedSkillsList.join(', ') : (data.skills || null);
    const finalExperience = data.experience || extractedResumeData.experience || null;

    // Resolve matching job requirement for deterministic ATS scoring
    const requirement = await this.resolveRequirement(data.requirement_id, data.job_position);
    const requirementId = requirement ? requirement.id : (data.requirement_id || null);

    // Automatic ATS scoring
    const candidateDataForAts = {
      ...data,
      skills: mergedSkillsList,
      extracted_resume_skills: extractedResumeData.skills || [],
      extracted_education: extractedResumeData.education,
      extracted_experience: extractedResumeData.experience,
      experience: finalExperience
    };

    const atsResult = AtsScoringService.calculateAtsScore(candidateDataForAts, requirement, data.screening_answers);
    const atsScore = atsResult.totalAtsScore;
    const atsBreakdown = JSON.stringify(atsResult.breakdown);
    const screeningScore = data.screening_score != null ? data.screening_score : atsResult.screeningScore;
    const screeningAnswers = typeof data.screening_answers === 'object' ? JSON.stringify(data.screening_answers) : (data.screening_answers || null);

    const emailToUse = (data.email || '').trim().toLowerCase();
    const existing = await Candidate.query('SELECT id, resume, original_resume, original_resume_name FROM candidates WHERE LOWER(email) = ?', [emailToUse]);

    await Candidate.beginTransaction();
    try {
      let candidateId;

      if (existing.length > 0) {
        // Candidate already exists — update profile with new application info
        candidateId = existing[0].id;
        const finalResume = data.original_resume || data.resume || existing[0].original_resume || existing[0].resume;
        const finalOrigName = data.original_resume_name || existing[0].original_resume_name;

        await Candidate.query(`
          UPDATE candidates SET
            candidate_name = ?, mobile_number = COALESCE(?, mobile_number), gender = COALESCE(?, gender),
            department_id = COALESCE(?, department_id), job_position = COALESCE(?, job_position),
            date_of_birth = COALESCE(?, date_of_birth), resume = ?, original_resume = ?, original_resume_name = ?,
            experience = COALESCE(?, experience), current_company = COALESCE(?, current_company),
            current_salary = COALESCE(?, current_salary), expected_salary = COALESCE(?, expected_salary),
            notice_period = COALESCE(?, notice_period), skills = COALESCE(?, skills), address = COALESCE(?, address),
            status = 'Applied', requirement_id = COALESCE(?, requirement_id), ats_score = ?, ats_breakdown = ?,
            screening_score = ?, screening_answers = COALESCE(?, screening_answers), updated_by = ?, updated_at = NOW()
          WHERE id = ?
        `, [
          data.candidate_name, data.mobile_number, data.gender, data.department_id,
          data.job_position || (requirement ? requirement.job_title : null), data.date_of_birth || null,
          finalResume, finalResume, finalOrigName, finalExperience, data.current_company,
          data.current_salary, data.expected_salary, data.notice_period, finalSkills, data.address,
          requirementId, atsScore, atsBreakdown, screeningScore, screeningAnswers, userId, candidateId
        ]);
      } else {
        // New unique candidate
        const sql = `
          INSERT INTO candidates (
            candidate_name, email, mobile_number, gender, department_id, job_position,
            date_of_birth, resume, original_resume, original_resume_name, experience, current_company, current_salary, expected_salary,
            notice_period, skills, address, status, requirement_id, ats_score, ats_breakdown,
            screening_score, screening_answers, created_by, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          data.candidate_name, emailToUse, data.mobile_number, data.gender || 'Male', data.department_id, data.job_position || (requirement ? requirement.job_title : null),
          data.date_of_birth || null, data.resume || null, data.original_resume || data.resume || null, data.original_resume_name || null, finalExperience, data.current_company || null,
          data.current_salary || null, data.expected_salary || null, data.notice_period || null, finalSkills,
          data.address || null, data.status || 'Applied', requirementId, atsScore, atsBreakdown,
          screeningScore, screeningAnswers, userId, userId
        ];

        const result = await Candidate.query(sql, params);
        candidateId = result.insertId;
      }

      // Track in candidate_applications for job-specific ATS scores
      if (requirementId) {
        const finalResume = data.original_resume || data.resume || null;
        const finalOrigName = data.original_resume_name || null;

        await Candidate.query(`
          INSERT INTO candidate_applications (
            candidate_id, requirement_id, job_position, status, ats_score, ats_breakdown,
            screening_score, screening_answers, evaluation_status, resume, original_resume, original_resume_name, skills
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = 'Applied', ats_score = VALUES(ats_score), ats_breakdown = VALUES(ats_breakdown),
            resume = VALUES(resume), original_resume = VALUES(original_resume), original_resume_name = VALUES(original_resume_name),
            skills = VALUES(skills), updated_at = NOW()
        `, [
          candidateId, requirementId, data.job_position || (requirement ? requirement.job_title : 'Mobile App Developer'),
          data.status || 'Applied', atsScore, atsBreakdown, screeningScore, screeningAnswers,
          finalResume, finalResume, finalOrigName, finalSkills
        ]);
      }

      await Candidate.commit();
      return { id: candidateId, ats_score: atsScore, ats_breakdown: atsResult.breakdown };
    } catch (error) {
      await Candidate.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Candidate not found');

    // Check if email is being updated and already exists elsewhere
    if (data.email && data.email !== existing.email) {
      const other = await Candidate.query('SELECT id FROM candidates WHERE email = ? AND id != ?', [data.email, id]);
      if (other.length > 0) {
        throw new Error('Email address already registered');
      }
    }

    const candidate_name = data.candidate_name !== undefined ? data.candidate_name : existing.candidate_name;
    const email = data.email !== undefined ? data.email : existing.email;
    const mobile_number = data.mobile_number !== undefined ? data.mobile_number : existing.mobile_number;
    const gender = data.gender !== undefined ? data.gender : existing.gender;
    const department_id = data.department_id !== undefined ? data.department_id : existing.department_id;
    const job_position = data.job_position !== undefined ? data.job_position : existing.job_position;
    const date_of_birth = data.date_of_birth !== undefined ? data.date_of_birth : existing.date_of_birth;
    const resume = data.resume !== undefined ? data.resume : existing.resume;
    const original_resume_name = data.original_resume_name !== undefined ? data.original_resume_name : existing.original_resume_name;
    const experience = data.experience !== undefined ? data.experience : existing.experience;
    const current_company = data.current_company !== undefined ? data.current_company : existing.current_company;
    const current_salary = data.current_salary !== undefined ? data.current_salary : existing.current_salary;
    const expected_salary = data.expected_salary !== undefined ? data.expected_salary : existing.expected_salary;
    const notice_period = data.notice_period !== undefined ? data.notice_period : existing.notice_period;
    const skills = data.skills !== undefined ? data.skills : existing.skills;
    const address = data.address !== undefined ? data.address : existing.address;
    const status = data.status !== undefined ? data.status : existing.status;
    const requirement_id = data.requirement_id !== undefined ? data.requirement_id : existing.requirement_id;

    // Recalculate ATS score automatically if relevant candidate details changed
    const requirement = await this.resolveRequirement(requirement_id, job_position);
    const screeningAnswers = data.screening_answers !== undefined
      ? (typeof data.screening_answers === 'object' ? JSON.stringify(data.screening_answers) : data.screening_answers)
      : existing.screening_answers;

    const mergedCandidate = {
      skills, experience, notice_period, expected_salary, job_position,
      screening_score: existing.screening_score
    };
    const atsResult = AtsScoringService.calculateAtsScore(mergedCandidate, requirement, screeningAnswers);
    const ats_score = atsResult.totalAtsScore;
    const ats_breakdown = JSON.stringify(atsResult.breakdown);

    const sql = `
      UPDATE candidates SET
        candidate_name = ?, email = ?, mobile_number = ?, gender = ?, department_id = ?, job_position = ?,
        date_of_birth = ?, resume = ?, original_resume_name = ?, experience = ?, current_company = ?,
        current_salary = ?, expected_salary = ?, notice_period = ?, skills = ?, address = ?,
        status = ?, requirement_id = ?, ats_score = ?, ats_breakdown = ?, updated_by = ?
      WHERE id = ?
    `;

    const params = [
      candidate_name, email, mobile_number, gender, department_id, job_position,
      date_of_birth, resume, original_resume_name, experience, current_company,
      current_salary, expected_salary, notice_period, skills, address,
      status, requirement ? requirement.id : requirement_id, ats_score, ats_breakdown, userId, id
    ];

    await Candidate.beginTransaction();
    try {
      await Candidate.query(sql, params);

      // Also update matching candidate_applications if present
      if (requirement) {
        const appExists = await Candidate.query(
          'SELECT id FROM candidate_applications WHERE candidate_id = ? AND requirement_id = ?',
          [id, requirement.id]
        );
        if (appExists.length > 0) {
          await Candidate.query(`
            UPDATE candidate_applications SET
              job_position = ?, status = ?, ats_score = ?, ats_breakdown = ?, resume = ?, original_resume_name = ?
            WHERE id = ?
          `, [job_position, status, ats_score, ats_breakdown, resume, original_resume_name, appExists[0].id]);
        } else {
          await Candidate.query(`
            INSERT INTO candidate_applications (
              candidate_id, requirement_id, job_position, status, ats_score, ats_breakdown, resume, original_resume_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [id, requirement.id, job_position, status, ats_score, ats_breakdown, resume, original_resume_name]);
        }
      }

      await Candidate.commit();
      return true;
    } catch (error) {
      await Candidate.rollback();
      throw error;
    }
  }

  static async delete(id) {
    await Candidate.beginTransaction();
    try {
      await Candidate.query('DELETE FROM candidate_applications WHERE candidate_id = ?', [id]);
      await Candidate.query('DELETE FROM candidates WHERE id = ?', [id]);
      await Candidate.commit();
      return true;
    } catch (error) {
      await Candidate.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await Candidate.query(
      `SELECT c.*, d.dept_name as department_name, r.job_title as requirement_job_title
       FROM candidates c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN requirements r ON c.requirement_id = r.id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows[0]) return null;

    const candidate = rows[0];

    // Parse ats_breakdown if present or generate deterministic breakdown
    if (candidate.ats_breakdown && typeof candidate.ats_breakdown === 'string') {
      try {
        candidate.ats_breakdown = JSON.parse(candidate.ats_breakdown);
      } catch (e) {
        candidate.ats_breakdown = null;
      }
    }

    if (!candidate.ats_breakdown || candidate.ats_score == null) {
      const requirement = await this.resolveRequirement(candidate.requirement_id, candidate.job_position);
      const computed = AtsScoringService.calculateAtsScore(candidate, requirement, candidate.screening_answers);
      candidate.ats_score = candidate.ats_score || computed.totalAtsScore;
      candidate.ats_breakdown = computed.breakdown;
    }

    // Attach all job-specific applications for candidate
    const applications = await Candidate.query(`
      SELECT ca.*, r.job_title as requirement_title, r.requirement_code
      FROM candidate_applications ca
      LEFT JOIN requirements r ON ca.requirement_id = r.id
      WHERE ca.candidate_id = ?
      ORDER BY ca.created_at DESC
    `, [id]);

    candidate.applications = applications.map(app => {
      let b = app.ats_breakdown;
      if (typeof b === 'string') {
        try { b = JSON.parse(b); } catch (e) { b = null; }
      }
      return { ...app, ats_breakdown: b };
    });

    return candidate;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT 
        c.*, 
        COALESCE(ca.id, c.id) as application_id,
        COALESCE(ca.resume, c.resume) as application_resume,
        COALESCE(ca.original_resume_name, c.original_resume_name) as application_original_resume_name,
        COALESCE(ca.ats_score, c.ats_score) as application_ats_score,
        COALESCE(ca.ats_breakdown, c.ats_breakdown) as application_ats_breakdown,
        d.dept_name as department_name, 
        r.job_title as requirement_job_title
      FROM candidates c
      LEFT JOIN candidate_applications ca ON ca.id = (
        SELECT id FROM candidate_applications WHERE candidate_id = c.id ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN requirements r ON COALESCE(ca.requirement_id, c.requirement_id) = r.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (c.candidate_name LIKE ? OR c.email LIKE ? OR c.mobile_number LIKE ? OR c.job_position LIKE ? OR d.dept_name LIKE ? OR c.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term, term);
    }

    // Filters
    if (filters.department_id) {
      sql += ` AND c.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.status) {
      sql += ` AND c.status = ?`;
      params.push(filters.status);
    }
    if (filters.gender) {
      sql += ` AND c.gender = ?`;
      params.push(filters.gender);
    }
    if (filters.experience) {
      sql += ` AND c.experience = ?`;
      params.push(filters.experience);
    }
    if (filters.has_resume !== undefined) {
      if (filters.has_resume === 'true' || filters.has_resume === true) {
        sql += ` AND c.resume IS NOT NULL AND c.resume != ''`;
      } else {
        sql += ` AND (c.resume IS NULL OR c.resume = '')`;
      }
    }

    // Sorting
    sql += ` ORDER BY c.created_at DESC`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);

    const rows = await Candidate.query(sql, params);

    // Format and calculate breakdown for any legacy records missing ATS score
    const formattedRows = await Promise.all(rows.map(async (row) => {
      let breakdown = row.application_ats_breakdown || row.ats_breakdown;
      if (typeof breakdown === 'string') {
        try {
          breakdown = JSON.parse(breakdown);
        } catch (e) {
          breakdown = null;
        }
      }

      let score = row.application_ats_score != null ? row.application_ats_score : row.ats_score;
      if (score == null || !breakdown) {
        const requirement = await this.resolveRequirement(row.requirement_id, row.job_position);
        const computed = AtsScoringService.calculateAtsScore(row, requirement, row.screening_answers);
        score = score || computed.totalAtsScore;
        breakdown = breakdown || computed.breakdown;
      }

      return {
        ...row,
        application_id: row.application_id || row.id,
        candidate_id: row.id,
        resume: row.application_resume || row.resume,
        original_resume_name: row.application_original_resume_name || row.original_resume_name,
        ats_score: Number(score) || 0,
        ats_breakdown: breakdown
      };
    }));

    // Count query
    let countSql = `
      SELECT COUNT(*) as count
      FROM candidates c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      countSql += ` AND (c.candidate_name LIKE ? OR c.email LIKE ? OR c.mobile_number LIKE ? OR c.job_position LIKE ? OR d.dept_name LIKE ? OR c.status LIKE ?)`;
      countParams.push(term, term, term, term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND c.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.status) {
      countSql += ` AND c.status = ?`;
      countParams.push(filters.status);
    }
    if (filters.gender) {
      countSql += ` AND c.gender = ?`;
      countParams.push(filters.gender);
    }
    if (filters.experience) {
      countSql += ` AND c.experience = ?`;
      countParams.push(filters.experience);
    }
    if (filters.has_resume !== undefined) {
      if (filters.has_resume === 'true' || filters.has_resume === true) {
        countSql += ` AND c.resume IS NOT NULL AND c.resume != ''`;
      } else {
        countSql += ` AND (c.resume IS NULL OR c.resume = '')`;
      }
    }

    const totalResult = await Candidate.query(countSql, countParams);
    return {
      rows: formattedRows,
      total: totalResult[0].count
    };
  }

  static async dropdown() {
    const rows = await Candidate.query('SELECT id, candidate_name as name, email, job_position, status, ats_score FROM candidates ORDER BY candidate_name ASC');
    return rows;
  }

  /**
   * Evaluate Candidate (Shortlist or Reject)
   * Enforces strict backend validation against already finalized candidates.
   */
  static async evaluateCandidate(candidateId, evaluationPayload, userId) {
    const candidate = await this.getById(candidateId);
    if (!candidate) {
      const err = new Error('Candidate not found');
      err.statusCode = 404;
      throw err;
    }

    // Backend validation: Check if candidate already has a final decision
    const finalizedStatuses = [
      'shortlisted',
      'rejected',
      'interview scheduled',
      'interview completed',
      'selected',
      'hired',
      'withdrawn'
    ];
    const currentStatusNormalized = String(candidate.status || '').trim().toLowerCase();

    if (finalizedStatuses.includes(currentStatusNormalized)) {
      const err = new Error('This candidate has already received a final evaluation.');
      err.statusCode = 400;
      err.status = candidate.status;
      throw err;
    }

    // Action validation
    const action = String(evaluationPayload.action || evaluationPayload.status || '').toUpperCase();
    let newStatus = '';
    let evalStatus = '';

    if (action === 'SHORTLIST' || action === 'SHORTLISTED') {
      newStatus = 'Shortlisted';
      evalStatus = 'SHORTLISTED';
    } else if (action === 'REJECT' || action === 'REJECTED') {
      newStatus = 'Rejected';
      evalStatus = 'REJECTED';
    } else {
      const err = new Error('Invalid evaluation action. Must be Shortlist or Reject.');
      err.statusCode = 400;
      throw err;
    }

    const notes = evaluationPayload.remarks || evaluationPayload.recruiterNotes || evaluationPayload.rejectionReason || `Evaluated as ${newStatus}`;

    await Candidate.beginTransaction();
    try {
      // 1. Update candidates table
      await Candidate.query(`
        UPDATE candidates SET
          status = ?,
          evaluation_status = ?,
          evaluated_at = NOW(),
          evaluated_by = ?,
          evaluation_notes = ?,
          updated_by = ?
        WHERE id = ?
      `, [newStatus, evalStatus, userId, notes, userId, candidateId]);

      // 2. Update candidate_applications table if job-specific application exists
      await Candidate.query(`
        UPDATE candidate_applications SET
          status = ?,
          evaluation_status = ?,
          evaluated_at = NOW(),
          evaluated_by = ?,
          evaluation_notes = ?
        WHERE candidate_id = ?
      `, [newStatus, evalStatus, userId, notes, candidateId]);

      await Candidate.commit();

      return {
        id: candidateId,
        status: newStatus,
        evaluation_status: evalStatus,
        evaluation_notes: notes,
        evaluated_at: new Date()
      };
    } catch (error) {
      await Candidate.rollback();
      throw error;
    }
  }

  /**
   * Get Live ATS Evaluation for a Candidate
   * Parses candidate resume, compares with linked job requirements, computes 100% dynamic score breakdown,
   * and saves updated scores and skills to database.
   */
  static async getAtsEvaluation(candidateId) {
    const candidate = await this.getById(candidateId);
    if (!candidate) {
      const err = new Error('Candidate not found');
      err.statusCode = 404;
      throw err;
    }

    // Resolve matching job requirement
    const requirement = await this.resolveRequirement(candidate.requirement_id, candidate.job_position);

    // Extract resume text and skills if candidate has resume
    let extractedResumeData = { skills: [], education: null, experience: null };
    if (candidate.resume) {
      try {
        extractedResumeData = await ResumeParserService.parseResume(candidate.resume);
      } catch (e) {
        console.warn('[CandidateService.getAtsEvaluation] Resume extraction notice:', e.message);
      }
    }

    // Merge skills priority: 1. Resume skills, 2. Form/candidate skills, 3. Profile
    const mergedSkills = ResumeParserService.mergeSkills({
      resumeSkills: extractedResumeData.skills || [],
      formSkills: candidate.skills || '',
      profileSkills: candidate.skills || ''
    });

    const candidateDataForAts = {
      ...candidate,
      skills: mergedSkills,
      extracted_resume_skills: extractedResumeData.skills || [],
      extracted_education: extractedResumeData.education,
      extracted_experience: extractedResumeData.experience,
      experience: candidate.experience || extractedResumeData.experience || '0-1 Years'
    };

    // Calculate real-time ATS score
    const atsResult = AtsScoringService.calculateAtsScore(candidateDataForAts, requirement, candidate.screening_answers);
    const atsScore = atsResult.totalAtsScore;
    const atsBreakdown = JSON.stringify(atsResult.breakdown);

    // Persist updated skills & ATS evaluation in database
    const mergedSkillsStr = mergedSkills.join(', ');
    if (mergedSkillsStr && mergedSkillsStr !== candidate.skills) {
      await Candidate.query(
        'UPDATE candidates SET skills = ?, ats_score = ?, ats_breakdown = ? WHERE id = ?',
        [mergedSkillsStr, atsScore, atsBreakdown, candidateId]
      );
    } else {
      await Candidate.query(
        'UPDATE candidates SET ats_score = ?, ats_breakdown = ? WHERE id = ?',
        [atsScore, atsBreakdown, candidateId]
      );
    }

    return {
      success: true,
      application: {
        id: candidate.id,
        candidateId: candidate.id,
        jobId: requirement ? requirement.id : candidate.requirement_id,
        candidateName: candidate.candidate_name,
        email: candidate.email,
        phone: candidate.mobile_number,
        resumeUrl: candidate.resume,
        originalResumeName: candidate.original_resume_name,
        status: candidate.status,
        evaluationStatus: candidate.evaluation_status,
        evaluationNotes: candidate.evaluation_notes,
        appliedAt: candidate.created_at
      },
      candidate: {
        id: candidate.id,
        name: candidate.candidate_name,
        email: candidate.email,
        phone: candidate.mobile_number,
        resume: candidate.resume,
        originalResumeName: candidate.original_resume_name,
        skills: mergedSkills,
        resumeSkills: extractedResumeData.skills || [],
        experience: candidate.experience || extractedResumeData.experience || '0-1 Years',
        education: candidate.education || extractedResumeData.education || 'Graduate',
        currentCompany: candidate.current_company,
        currentSalary: candidate.current_salary,
        expectedSalary: candidate.expected_salary,
        noticePeriod: candidate.notice_period || 'Immediate'
      },
      job: requirement ? {
        id: requirement.id,
        title: requirement.job_title,
        requirementCode: requirement.requirement_code,
        skills: requirement.skills ? ResumeParserService.extractSkillsFromText(requirement.skills) : [],
        requiredSkills: atsResult.breakdown?.skills?.matchedSkills?.concat(atsResult.breakdown?.skills?.missingSkills || []) || [],
        experienceRequired: `${requirement.experience_from || 0} - ${requirement.experience_to || 0} Years`,
        salaryRange: requirement.salary_to ? `₹${Number(requirement.salary_from || 0).toLocaleString()} - ₹${Number(requirement.salary_to).toLocaleString()}` : 'N/A'
      } : {
        title: candidate.job_position,
        requiredSkills: [],
        experienceRequired: 'N/A'
      },
      atsScore: {
        total: atsScore,
        maximum: 100,
        matchLevel: atsResult.matchLevel,
        breakdown: atsResult.breakdown
      }
    };
  }

  /**
   * Get candidate previous experience records
   */
  static async getCandidateExperiences(candidateId) {
    return Candidate.query(
      'SELECT * FROM candidate_experiences WHERE candidate_id = ? ORDER BY start_date DESC, id DESC',
      [candidateId]
    );
  }

  /**
   * Add a candidate experience record
   */
  static async addCandidateExperience(candidateId, data) {
    const sql = `
      INSERT INTO candidate_experiences (
        candidate_id, company_name, designation, department,
        employment_type, start_date, end_date, is_currently_working, duration_months,
        company_location, reason_for_leaving, job_description, last_drawn_ctc,
        reporting_manager, reference_name, reference_designation, reference_contact, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      candidateId,
      data.company_name,
      data.designation,
      data.department || null,
      data.employment_type || 'Full Time',
      data.start_date,
      data.is_currently_working ? null : (data.end_date || null),
      data.is_currently_working ? 1 : 0,
      data.duration_months || 0,
      data.company_location || null,
      data.reason_for_leaving || null,
      data.job_description || null,
      data.last_drawn_ctc || null,
      data.reporting_manager || null,
      data.reference_name || null,
      data.reference_designation || null,
      data.reference_contact || null
    ];
    const res = await Candidate.query(sql, params);
    return res.insertId;
  }

  /**
   * CANDIDATE TO EMPLOYEE CONVERSION
   * Preserves candidate's original experiences, recruitment history, and resume,
   * while copying previous employment history into employee profile as reference history.
   * Atomic, idempotent, and wrapped in a database transaction.
   */
  static async convertToEmployee(candidateId, options = {}, userId = 1) {
    const candidate = await this.getById(candidateId);
    if (!candidate) {
      const err = new Error('Candidate not found');
      err.statusCode = 404;
      throw err;
    }

    const EmployeeExperienceService = require('./EmployeeExperienceService');

    return Candidate.withTransaction(async (conn) => {
      const exec = (sql, params = []) => conn.query(sql, params).then(([rows]) => rows);

      // 1. Check if employee already linked to this candidate
      let employeeId = null;
      let isExistingEmployee = false;
      const linkedEmp = await exec(
        'SELECT id, name, email, employee_id FROM employees WHERE candidate_id = ?',
        [candidateId]
      );

      if (linkedEmp.length > 0) {
        employeeId = linkedEmp[0].id;
        isExistingEmployee = true;
      } else {
        // Also check by email to prevent duplicate employee records
        const emailToMatch = (candidate.email || '').trim().toLowerCase();
        const empByEmail = await exec(
          'SELECT id, name, email, employee_id, candidate_id FROM employees WHERE LOWER(email) = ?',
          [emailToMatch]
        );

        if (empByEmail.length > 0) {
          employeeId = empByEmail[0].id;
          isExistingEmployee = true;
          // Link candidate_id if missing
          if (!empByEmail[0].candidate_id) {
            await exec('UPDATE employees SET candidate_id = ? WHERE id = ?', [candidateId, employeeId]);
          }
        }
      }

      // 2. Parse Experience Summary
      const expSummary = EmployeeExperienceService.parseExperienceString(candidate.experience);
      const experienceType = options.experience_type || expSummary.type;
      const totalYears = options.total_experience_years != null ? parseInt(options.total_experience_years, 10) : expSummary.totalYears;
      const totalMonths = options.total_experience_months != null ? parseInt(options.total_experience_months, 10) : expSummary.totalMonths;
      const relevantYears = options.relevant_experience_years != null ? parseInt(options.relevant_experience_years, 10) : expSummary.relevantYears;
      const relevantMonths = options.relevant_experience_months != null ? parseInt(options.relevant_experience_months, 10) : expSummary.relevantMonths;
      const expText = totalMonths > 0 ? `${totalYears} Yrs ${totalMonths} Mos` : `${totalYears} Yrs`;

      // 3. Create employee if doesn't exist
      if (!isExistingEmployee) {
        let designationId = null;
        if (candidate.job_position) {
          const desgRows = await exec(
            'SELECT id FROM designations WHERE LOWER(role_name) = LOWER(?) OR LOWER(role_code) = LOWER(?) LIMIT 1',
            [candidate.job_position, candidate.job_position]
          );
          if (desgRows.length > 0) {
            designationId = desgRows[0].id;
          }
        }

        const empSalary = candidate.expected_salary || candidate.current_salary || 0;
        const joinDate = options.joining_date || new Date().toISOString().split('T')[0];

        const insertEmpSql = `
          INSERT INTO employees (
            name, email, phone, gender, dob, department_id, designation_id,
            join_date, status, candidate_id, salary, experience, shift_type,
            experience_type, total_experience_years, total_experience_months,
            relevant_experience_years, relevant_experience_months, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, 'General Shift', ?, ?, ?, ?, ?, NOW())
        `;

        const empParams = [
          candidate.candidate_name,
          candidate.email,
          candidate.mobile_number || null,
          candidate.gender || 'Male',
          candidate.date_of_birth || null,
          candidate.department_id || null,
          designationId,
          joinDate,
          candidate.id,
          empSalary,
          expText,
          experienceType,
          totalYears,
          totalMonths,
          relevantYears,
          relevantMonths
        ];

        const empResult = await exec(insertEmpSql, empParams);
        employeeId = empResult.insertId;

        // Assign employee_id string like EMP0015
        const empCode = `EMP${String(employeeId).padStart(4, '0')}`;
        await exec('UPDATE employees SET employee_id = ? WHERE id = ?', [empCode, employeeId]);
      } else {
        // Update experience summary on existing employee if not already set
        await exec(`
          UPDATE employees SET
            experience_type = COALESCE(experience_type, ?),
            total_experience_years = COALESCE(total_experience_years, ?),
            total_experience_months = COALESCE(total_experience_months, ?),
            relevant_experience_years = COALESCE(relevant_experience_years, ?),
            relevant_experience_months = COALESCE(relevant_experience_months, ?),
            experience = COALESCE(experience, ?)
          WHERE id = ?
        `, [experienceType, totalYears, totalMonths, relevantYears, relevantMonths, expText, employeeId]);
      }

      // 4. Retrieve candidate's previous experience records from candidate_experiences
      let candExperiences = await exec(
        'SELECT * FROM candidate_experiences WHERE candidate_id = ?',
        [candidateId]
      );

      // If no itemized experiences exist in candidate_experiences but candidate has current_company,
      // create the initial candidate_experiences record so candidate record has persistent traceability.
      if (candExperiences.length === 0 && candidate.current_company) {
        const defaultStartDate = new Date(new Date().setFullYear(new Date().getFullYear() - (totalYears || 1))).toISOString().split('T')[0];
        const defaultEndDate = new Date().toISOString().split('T')[0];
        await exec(`
          INSERT INTO candidate_experiences (
            candidate_id, company_name, designation, employment_type,
            start_date, end_date, is_currently_working, duration_months,
            last_drawn_ctc, created_at
          ) VALUES (?, ?, ?, 'Full Time', ?, ?, 0, ?, ?, NOW())
        `, [
          candidateId,
          candidate.current_company,
          candidate.job_position || 'Previous Role',
          defaultStartDate,
          defaultEndDate,
          (totalYears * 12 + totalMonths) || 12,
          candidate.current_salary || null
        ]);

        candExperiences = await exec(
          'SELECT * FROM candidate_experiences WHERE candidate_id = ?',
          [candidateId]
        );
      }

      // 5. Copy Candidate Experiences into employee_previous_experiences (IDEMPOTENT)
      let copiedCount = 0;
      for (const exp of candExperiences) {
        // Check if this experience was already copied to this employee
        const existingCopy = await exec(
          'SELECT id FROM employee_previous_experiences WHERE employee_id = ? AND (candidate_experience_id = ? OR (company_name = ? AND start_date = ?))',
          [employeeId, exp.id, exp.company_name, exp.start_date]
        );

        if (existingCopy.length === 0) {
          await exec(`
            INSERT INTO employee_previous_experiences (
              employee_id, candidate_experience_id, company_name, designation, department,
              employment_type, start_date, end_date, is_currently_working, duration_months,
              company_location, reason_for_leaving, job_description, last_drawn_ctc,
              reporting_manager, reference_name, reference_designation, reference_contact,
              verification_status, verification_notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, NOW())
          `, [
            employeeId,
            exp.id,
            exp.company_name,
            exp.designation,
            exp.department || null,
            exp.employment_type || 'Full Time',
            exp.start_date,
            exp.end_date || null,
            exp.is_currently_working || 0,
            exp.duration_months || 0,
            exp.company_location || null,
            exp.reason_for_leaving || null,
            exp.job_description || null,
            exp.last_drawn_ctc || null,
            exp.reporting_manager || null,
            exp.reference_name || null,
            exp.reference_designation || null,
            exp.reference_contact || null
          ]);
          copiedCount++;
        }
      }

      // 6. Copy candidate resume to employee_documents (reference copy without modifying original resume)
      const candResume = candidate.original_resume || candidate.resume;
      if (candResume) {
        const existingDoc = await exec(
          'SELECT id FROM employee_documents WHERE employee_id = ? AND (document_type = "Resume" OR file = ?)',
          [employeeId, candResume]
        );
        if (existingDoc.length === 0) {
          await exec(`
            INSERT INTO employee_documents (
              employee_id, document_type, document_name, file, status, created_by, updated_by, created_at
            ) VALUES (?, 'Resume', ?, ?, 'Active', ?, ?, NOW())
          `, [
            employeeId,
            candidate.original_resume_name || `${(candidate.candidate_name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`,
            candResume,
            userId,
            userId
          ]);
        }
      }

      // 7. Update candidate status to Hired
      await exec(
        'UPDATE candidates SET status = "Hired", updated_by = ?, updated_at = NOW() WHERE id = ?',
        [userId, candidateId]
      );

      // Also update candidate_applications if present
      await exec(
        'UPDATE candidate_applications SET status = "Hired", updated_at = NOW() WHERE candidate_id = ?',
        [candidateId]
      );

      return {
        success: true,
        candidate_id: candidateId,
        employee_id: employeeId,
        is_new_employee: !isExistingEmployee,
        copied_experiences_count: copiedCount,
        experience_summary: {
          experience_type: experienceType,
          total_experience_years: totalYears,
          total_experience_months: totalMonths,
          relevant_experience_years: relevantYears,
          relevant_experience_months: relevantMonths
        }
      };
    });
  }
}

module.exports = CandidateService;
