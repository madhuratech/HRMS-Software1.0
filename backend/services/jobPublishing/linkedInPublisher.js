const LinkedInJobService = require('../linkedinJobService');

class LinkedInPublisher {
  static async publish(job) {
    const res = await LinkedInJobService.publishJob(job);
    return {
      success: !!res.success,
      status: (res.status || 'FAILED').toUpperCase(),
      externalJobId: res.externalJobId || null,
      externalUrl: res.externalUrl || null,
      alreadyPublished: !!res.alreadyPublished,
      errorMessage: res.errorMessage || null,
      lastSyncedAt: res.lastSyncedAt || new Date()
    };
  }

  static async update(job) {
    return this.publish(job);
  }

  static async close(job) {
    await LinkedInJobService.closeJob(job);
    return {
      success: true,
      status: 'CLOSED',
      lastSyncedAt: new Date()
    };
  }

  static async delete(job) {
    await LinkedInJobService.deleteJob(job);
    return {
      success: true,
      status: 'DELETED',
      lastSyncedAt: new Date()
    };
  }
}

module.exports = LinkedInPublisher;
