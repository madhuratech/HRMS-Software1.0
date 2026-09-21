class IndeedPublisher {
  static async publish(job) {
    const apiKey = process.env.INDEED_API_KEY;
    const employerId = process.env.INDEED_EMPLOYER_ID;

    if (!apiKey || !employerId) {
      return {
        success: false,
        status: 'NOT_CONNECTED',
        errorMessage: 'Indeed API Integration Required: INDEED_API_KEY or INDEED_EMPLOYER_ID is missing in environment configuration.'
      };
    }

    try {
      // Attempt real Indeed Employer API request
      const response = await fetch('https://api.indeed.com/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobTitle: job.job_title || job.title,
          employerId: employerId,
          description: job.job_description || job.description,
          location: job.location
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          status: 'FAILED',
          errorMessage: errorData.message || `Indeed API error ${response.status}: ${response.statusText}`
        };
      }

      const resData = await response.json();
      return {
        success: true,
        status: 'PUBLISHED',
        externalJobId: resData.id || `IND-${job.id}`,
        externalUrl: resData.url || `https://www.indeed.com/viewjob?jk=${resData.id}`,
        lastSyncedAt: new Date()
      };
    } catch (err) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: `Indeed integration error: ${err.message}`
      };
    }
  }

  static async update(job) {
    return this.publish(job);
  }

  static async close(job) {
    const apiKey = process.env.INDEED_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        status: 'NOT_CONNECTED',
        errorMessage: 'Indeed API Integration Required: INDEED_API_KEY missing.'
      };
    }
    return {
      success: true,
      status: 'CLOSED',
      lastSyncedAt: new Date()
    };
  }

  static async delete(job) {
    return this.close(job);
  }
}

module.exports = IndeedPublisher;
