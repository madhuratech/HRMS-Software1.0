const db = require('../../config/database');
const CareerPagePublisher = require('./careerPagePublisher');
const LinkedInPublisher = require('./linkedInPublisher');
const IndeedPublisher = require('./indeedPublisher');

class JobPublisher {
  static getPublisher(channel) {
    switch (channel) {
      case 'CAREER_PAGE':
        return CareerPagePublisher;
      case 'LINKEDIN':
        return LinkedInPublisher;
      case 'INDEED':
        return IndeedPublisher;
      default:
        throw new Error(`Unsupported publishing channel: ${channel}`);
    }
  }

  static async recordPublishStatus(jobId, channel, res) {
    return new Promise((resolve) => {
      const sql = `
        INSERT INTO job_publishings (
          job_id, channel, external_job_id, status, external_url,
          published_at, last_synced_at, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
        ON DUPLICATE KEY UPDATE
          external_job_id = COALESCE(VALUES(external_job_id), external_job_id),
          status = VALUES(status),
          external_url = COALESCE(VALUES(external_url), external_url),
          published_at = COALESCE(VALUES(published_at), published_at),
          last_synced_at = NOW(),
          error_message = VALUES(error_message)
      `;

      const normalizedStatus = String(res.status || 'FAILED').toUpperCase();
      const isLive = normalizedStatus === 'PUBLISHED';
      const params = [
        jobId,
        channel,
        res.externalJobId || null,
        normalizedStatus,
        res.externalUrl || null,
        isLive ? new Date() : null,
        res.errorMessage || null
      ];

      db.query(sql, params, (err) => {
        if (err) console.error(`[JobPublisher] DB Error saving status for ${channel}:`, err);
        resolve();
      });
    });
  }

  static async publishAll(job) {
    const results = {};

    // 1. Publish to Career Page
    try {
      const cpRes = await CareerPagePublisher.publish(job);
      results['CAREER_PAGE'] = cpRes;
      await this.recordPublishStatus(job.id, 'CAREER_PAGE', cpRes);
    } catch (err) {
      const failRes = { success: false, status: 'FAILED', errorMessage: err.message };
      results['CAREER_PAGE'] = failRes;
      await this.recordPublishStatus(job.id, 'CAREER_PAGE', failRes);
    }

    // 2. Set LinkedIn to PUBLISHING temporarily if token is configured
    const hasLinkedInToken = !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ACCESS_TOKEN.trim().length > 20);
    if (hasLinkedInToken) {
      await this.recordPublishStatus(job.id, 'LINKEDIN', { status: 'PUBLISHING' });
    }

    // 3. Publish to LinkedIn Company Page via Posts API
    try {
      const liRes = await LinkedInPublisher.publish(job);
      results['LINKEDIN'] = liRes;
      await this.recordPublishStatus(job.id, 'LINKEDIN', liRes);
    } catch (err) {
      const failRes = { success: false, status: 'FAILED', errorMessage: err.message };
      results['LINKEDIN'] = failRes;
      await this.recordPublishStatus(job.id, 'LINKEDIN', failRes);
    }

    // 4. Handle Indeed Channel
    try {
      const indRes = await IndeedPublisher.publish(job);
      results['INDEED'] = indRes;
      await this.recordPublishStatus(job.id, 'INDEED', indRes);
    } catch (err) {
      const failRes = { success: false, status: 'FAILED', errorMessage: err.message };
      results['INDEED'] = failRes;
      await this.recordPublishStatus(job.id, 'INDEED', failRes);
    }

    return results;
  }

  static async closeAll(job) {
    return this.closeSelected(job, ['CAREER_PAGE', 'LINKEDIN', 'INDEED']);
  }

  static async closeSelected(job, channels = []) {
    const results = {};
    for (const ch of channels) {
      try {
        const publisher = this.getPublisher(ch);
        const res = await publisher.close(job);
        results[ch] = res;
        await this.recordPublishStatus(job.id, ch, res);
      } catch (err) {
        const failRes = { success: false, status: 'FAILED', errorMessage: err.message };
        results[ch] = failRes;
        await this.recordPublishStatus(job.id, ch, failRes);
      }
    }
    return results;
  }

  static async publishSelected(job, channels = []) {
    const results = {};
    for (const ch of channels) {
      try {
        const publisher = this.getPublisher(ch);
        const res = await publisher.publish(job);
        results[ch] = res;
        await this.recordPublishStatus(job.id, ch, res);
      } catch (err) {
        const failRes = { success: false, status: 'FAILED', errorMessage: err.message };
        results[ch] = failRes;
        await this.recordPublishStatus(job.id, ch, failRes);
      }
    }
    return results;
  }

  static async deleteAll(job) {
    const channels = ['CAREER_PAGE', 'LINKEDIN', 'INDEED'];
    const results = {};

    for (const ch of channels) {
      try {
        const publisher = this.getPublisher(ch);
        const res = await publisher.delete(job);
        results[ch] = res;
        await this.recordPublishStatus(job.id, ch, res);
      } catch (err) {
        const failRes = { success: false, status: 'FAILED', errorMessage: err.message };
        results[ch] = failRes;
        await this.recordPublishStatus(job.id, ch, failRes);
      }
    }

    return results;
  }

  static async retryChannel(job, channel) {
    const publisher = this.getPublisher(channel);
    const res = await publisher.publish(job);
    await this.recordPublishStatus(job.id, channel, res);
    return res;
  }

  static async getChannelsForJob(jobId) {
    return new Promise((resolve) => {
      db.query(
        'SELECT * FROM job_publishings WHERE job_id = ? ORDER BY id ASC',
        [jobId],
        (err, rows) => {
          if (err || !rows) return resolve([]);
          return resolve(rows);
        }
      );
    });
  }
}

module.exports = JobPublisher;
