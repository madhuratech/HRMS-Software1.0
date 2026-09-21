const db = require('../../config/database');

function getSlug(title, id) {
  const cleanTitle = String(title || 'job-opening')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${cleanTitle}-${id}`;
}

class CareerPagePublisher {
  /**
   * Publish job to public career page
   */
  static async publish(job) {
    return new Promise((resolve) => {
      if (!job || !job.id) {
        return resolve({
          success: false,
          status: 'FAILED',
          errorMessage: 'Job ID is required'
        });
      }

      const jobTitle = job.job_title || job.title || 'job-opening';
      const externalUrl = 'https://madhuratech.com/career';

      const sql = `
        UPDATE requirements
        SET
          status = 'Published',
          opening_date = COALESCE(opening_date, CURRENT_DATE()),
          closing_date = COALESCE(closing_date, DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)),
          deleted_at = NULL
        WHERE id = ?
      `;

      db.query(sql, [job.id], (err, result) => {
        if (err) {
          console.error('[CareerPagePublisher.publish] DB Error:', err);
          return resolve({
            success: false,
            status: 'FAILED',
            errorMessage: err.message,
            externalJobId: String(job.id)
          });
        }

        if (!result || result.affectedRows === 0) {
          return resolve({
            success: false,
            status: 'FAILED',
            errorMessage: `Job ${job.id} was not found`,
            externalJobId: String(job.id)
          });
        }

        console.log(`[CareerPagePublisher] Job ${job.id} PUBLISHED successfully`);

        return resolve({
          success: true,
          status: 'PUBLISHED',
          externalUrl,
          externalJobId: String(job.id),
          lastSyncedAt: new Date()
        });
      });
    });
  }

  /**
   * Update job on public career page
   */
  static async update(job) {
    return this.publish(job);
  }

  /**
   * Close job on public career page
   */
  static async close(job) {
    return new Promise((resolve) => {
      if (!job || !job.id) {
        return resolve({
          success: false,
          status: 'FAILED',
          errorMessage: 'Job ID is required'
        });
      }

      const sql = `
        UPDATE requirements
        SET
          status = 'Closed',
          closing_date = COALESCE(closing_date, CURRENT_DATE())
        WHERE id = ?
      `;

      db.query(sql, [job.id], (err, result) => {
        if (err) {
          console.error('[CareerPagePublisher.close] DB Error:', err);
          return resolve({
            success: false,
            status: 'FAILED',
            errorMessage: err.message,
            externalJobId: String(job.id)
          });
        }

        if (!result || result.affectedRows === 0) {
          return resolve({
            success: false,
            status: 'FAILED',
            errorMessage: `Job ${job.id} was not found`,
            externalJobId: String(job.id)
          });
        }

        console.log(`[CareerPagePublisher] Job ${job.id} CLOSED successfully`);

        return resolve({
          success: true,
          status: 'CLOSED',
          externalJobId: String(job.id),
          lastSyncedAt: new Date()
        });
      });
    });
  }

  /**
   * Delete job from public career page (Soft Delete)
   */
  static async delete(job) {
    return new Promise((resolve) => {
      if (!job || !job.id) {
        return resolve({
          success: false,
          status: 'FAILED',
          errorMessage: 'Job ID is required'
        });
      }

      const sql = `
        UPDATE requirements
        SET
          status = 'Closed',
          deleted_at = NOW(),
          closing_date = COALESCE(closing_date, CURRENT_DATE())
        WHERE id = ?
      `;

      db.query(sql, [job.id], (err, result) => {
        if (err) {
          console.error('[CareerPagePublisher.delete] DB Error:', err);
          return resolve({
            success: false,
            status: 'FAILED',
            errorMessage: err.message,
            externalJobId: String(job.id)
          });
        }

        if (!result || result.affectedRows === 0) {
          return resolve({
            success: false,
            status: 'FAILED',
            errorMessage: `Job ${job.id} was not found`,
            externalJobId: String(job.id)
          });
        }

        console.log(`[CareerPagePublisher] Job ${job.id} DELETED from public careers`);

        return resolve({
          success: true,
          status: 'DELETED',
          externalJobId: String(job.id),
          lastSyncedAt: new Date()
        });
      });
    });
  }
}

module.exports = CareerPagePublisher;