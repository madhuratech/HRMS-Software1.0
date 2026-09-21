const OfferLetter = require('../models/OfferLetter');

class OfferLetterService {
  static async create(data, userId) {
    const sql = `
      INSERT INTO offer_letters (
        candidate_name, job_position, department_id, salary_offered, joining_date,
        reporting_manager, employment_type, offer_expiry_date, notes, status,
        candidate_id, template_id, template_snapshot, offer_date,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.candidate_name, data.job_position, data.department_id, data.salary_offered, data.joining_date,
      data.reporting_manager, data.employment_type || 'Full-time', data.offer_expiry_date, data.notes || null, data.status || 'Pending',
      data.candidate_id || null, data.template_id || null, data.template_snapshot || null, data.offer_date || new Date().toISOString().slice(0, 10),
      userId, userId
    ];

    await OfferLetter.beginTransaction();
    try {
      const result = await OfferLetter.query(sql, params);
      await OfferLetter.commit();
      return { id: result.insertId };
    } catch (error) {
      await OfferLetter.rollback();
      throw error;
    }
  }

  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Offer letter not found');

    const sql = `
      UPDATE offer_letters SET
        candidate_name = ?, job_position = ?, department_id = ?, salary_offered = ?, joining_date = ?,
        reporting_manager = ?, employment_type = ?, offer_expiry_date = ?, notes = ?, status = ?,
        candidate_id = ?, template_id = ?, template_snapshot = ?, offer_date = ?,
        updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.candidate_name !== undefined ? data.candidate_name : existing.candidate_name,
      data.job_position !== undefined ? data.job_position : existing.job_position,
      data.department_id !== undefined ? data.department_id : existing.department_id,
      data.salary_offered !== undefined ? data.salary_offered : existing.salary_offered,
      data.joining_date !== undefined ? data.joining_date : existing.joining_date,
      data.reporting_manager !== undefined ? data.reporting_manager : existing.reporting_manager,
      data.employment_type !== undefined ? data.employment_type : existing.employment_type,
      data.offer_expiry_date !== undefined ? data.offer_expiry_date : existing.offer_expiry_date,
      data.notes !== undefined ? data.notes : existing.notes,
      data.status !== undefined ? data.status : existing.status,
      data.candidate_id !== undefined ? data.candidate_id : existing.candidate_id,
      data.template_id !== undefined ? data.template_id : existing.template_id,
      data.template_snapshot !== undefined ? data.template_snapshot : existing.template_snapshot,
      data.offer_date !== undefined ? data.offer_date : existing.offer_date,
      userId, id
    ];

    await OfferLetter.beginTransaction();
    try {
      await OfferLetter.query(sql, params);
      await OfferLetter.commit();
      return true;
    } catch (error) {
      await OfferLetter.rollback();
      throw error;
    }
  }

  static async delete(id) {
    await OfferLetter.beginTransaction();
    try {
      await OfferLetter.query('DELETE FROM offer_letters WHERE id = ?', [id]);
      await OfferLetter.commit();
      return true;
    } catch (error) {
      await OfferLetter.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await OfferLetter.query(
      `SELECT o.*, d.dept_name as department_name,
              c.email as candidate_email, c.mobile_number as candidate_phone,
              t.template_name, t.category as template_category, t.file_path as template_file_path
       FROM offer_letters o
       LEFT JOIN departments d ON o.department_id = d.id
       LEFT JOIN candidates c ON o.candidate_id = c.id
       LEFT JOIN document_templates t ON o.template_id = t.id
       WHERE o.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT o.*, d.dept_name as department_name,
             c.email as candidate_email, c.mobile_number as candidate_phone,
             t.template_name
      FROM offer_letters o
      LEFT JOIN departments d ON o.department_id = d.id
      LEFT JOIN candidates c ON o.candidate_id = c.id
      LEFT JOIN document_templates t ON o.template_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let term = '';

    if (filters.search) {
      sql += ` AND (o.candidate_name LIKE ? OR o.job_position LIKE ? OR o.reporting_manager LIKE ? OR o.status LIKE ? OR c.email LIKE ?)`;
      term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    if (filters.department_id) {
      sql += ` AND o.department_id = ?`;
      params.push(filters.department_id);
    }
    if (filters.status) {
      sql += ` AND o.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY o.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await OfferLetter.query(sql, params);

    let countSql = `
      SELECT COUNT(*) as count
      FROM offer_letters o
      LEFT JOIN departments d ON o.department_id = d.id
      LEFT JOIN candidates c ON o.candidate_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (o.candidate_name LIKE ? OR o.job_position LIKE ? OR o.reporting_manager LIKE ? OR o.status LIKE ? OR c.email LIKE ?)`;
      countParams.push(term, term, term, term, term);
    }
    if (filters.department_id) {
      countSql += ` AND o.department_id = ?`;
      countParams.push(filters.department_id);
    }
    if (filters.status) {
      countSql += ` AND o.status = ?`;
      countParams.push(filters.status);
    }

    const totalResult = await OfferLetter.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async buildPdfBuffer(offer) {
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fillColor('#1E3A8A').fontSize(22).font('Helvetica-Bold').text('Madhura Technologies', 50, 50);
        doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('Corporate Human Resources | Official Employment Offer', 50, 78);
        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, 95).lineTo(545, 95).stroke();

        // Meta Box
        const offerDateStr = offer.offer_date ? new Date(offer.offer_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`Date: `, 50, 110, { continued: true })
           .font('Helvetica').text(offerDateStr);
        doc.font('Helvetica-Bold').text(`Candidate: `, 50, 125, { continued: true })
           .font('Helvetica').text(offer.candidate_name || 'N/A');
        doc.font('Helvetica-Bold').text(`Designation: `, 50, 140, { continued: true })
           .font('Helvetica').text(offer.job_position || 'N/A');
        doc.font('Helvetica-Bold').text(`Department: `, 50, 155, { continued: true })
           .font('Helvetica').text(offer.department_name || 'Technology');

        doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(50, 175).lineTo(545, 175).stroke();

        // Body Content
        const salaryStr = String(offer.salary_offered || '');
        const formattedSalary = salaryStr.startsWith('₹') ? salaryStr : `₹${salaryStr}`;
        const content = offer.template_snapshot || `Dear ${offer.candidate_name},\n\nWe are pleased to offer you employment with Madhura Technologies in the position of ${offer.job_position}.\n\nYour annual compensation (CTC) will be ${formattedSalary}.\nYour joining date is scheduled for ${offer.joining_date ? new Date(offer.joining_date).toLocaleDateString() : 'immediate'}.\nYou will report to ${offer.reporting_manager}.\n\nPlease sign and return this offer before ${offer.offer_expiry_date ? new Date(offer.offer_expiry_date).toLocaleDateString() : 'expiry'}.\n\nSincerely,\nHuman Resources\nMadhura Technologies`;

        doc.fillColor('#1E293B').fontSize(11).font('Helvetica').text(content, 50, 195, {
          width: 495,
          align: 'left',
          lineGap: 5
        });

        // Signatures area near bottom
        const bottomY = Math.max(doc.y + 40, 680);
        if (bottomY < 750) {
          doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(50, bottomY).lineTo(200, bottomY).stroke();
          doc.fontSize(9).fillColor('#64748B').text('Authorized Signatory', 50, bottomY + 5);
          doc.text('Madhura Technologies', 50, bottomY + 18);

          doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(395, bottomY).lineTo(545, bottomY).stroke();
          doc.fontSize(9).fillColor('#64748B').text("Candidate's Signature", 395, bottomY + 5);
          doc.text(`Name: ${offer.candidate_name}`, 395, bottomY + 18);
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = OfferLetterService;
