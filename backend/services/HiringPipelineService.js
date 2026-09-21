const RecruitmentSource = require('../models/RecruitmentSource');

class HiringPipelineService {
  // Recruitment Sources CRUD
  static async createSource(data, userId) {
    const sql = `
      INSERT INTO recruitment_sources (
        source_name, description, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.source_name, data.description || null, data.status || 'Active', userId, userId
    ];

    await RecruitmentSource.beginTransaction();
    try {
      const result = await RecruitmentSource.query(sql, params);
      await RecruitmentSource.commit();
      return { id: result.insertId };
    } catch (error) {
      await RecruitmentSource.rollback();
      throw error;
    }
  }

  static async listSources() {
    return await RecruitmentSource.query('SELECT * FROM recruitment_sources ORDER BY created_at DESC');
  }

  // Pipeline Statistics & Aggregations
  static async getPipelineStats() {
    // 1. Group-level candidate status totals
    const horizontalQuery = `
      SELECT 
        SUM(CASE WHEN status IN ('Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected', 'On Hold', 'Hired') THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status IN ('Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Hired') THEN 1 ELSE 0 END) as screening,
        SUM(CASE WHEN status IN ('Interview Scheduled', 'Interview Completed', 'Selected', 'Hired') THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status IN ('Selected', 'Hired') THEN 1 ELSE 0 END) as offer,
        SUM(CASE WHEN status = 'Hired' THEN 1 ELSE 0 END) as hired
      FROM candidates
    `;
    const horizontalResult = await RecruitmentSource.query(horizontalQuery);
    const totals = horizontalResult[0] || { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0 };

    // 2. Job position breakdown list
    const breakdownQuery = `
      SELECT 
        job_position as job,
        SUM(CASE WHEN status IN ('Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected', 'On Hold', 'Hired') THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status IN ('Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Hired') THEN 1 ELSE 0 END) as screening,
        SUM(CASE WHEN status IN ('Interview Scheduled', 'Interview Completed', 'Selected', 'Hired') THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status IN ('Selected', 'Hired') THEN 1 ELSE 0 END) as offer,
        SUM(CASE WHEN status = 'Hired' THEN 1 ELSE 0 END) as hired
      FROM candidates
      GROUP BY job_position
    `;
    const breakdownResult = await RecruitmentSource.query(breakdownQuery);

    const formattedBreakdown = breakdownResult.map((row, idx) => {
      const appliedCount = parseInt(row.applied) || 0;
      const hiredCount = parseInt(row.hired) || 0;
      const convRate = appliedCount > 0 ? parseFloat(((hiredCount / appliedCount) * 100).toFixed(1)) : 0;
      return {
        id: idx + 1,
        job: row.job,
        applied: appliedCount,
        screening: parseInt(row.screening) || 0,
        interview: parseInt(row.interview) || 0,
        offer: parseInt(row.offer) || 0,
        hired: hiredCount,
        conv: convRate
      };
    });

    // 3. Dynamic Insights Calculations
    const appliedVal = parseInt(totals.applied) || 0;
    const interviewVal = parseInt(totals.interview) || 0;
    const offerVal = parseInt(totals.offer) || 0;
    const hiredVal = parseInt(totals.hired) || 0;

    const interviewConv = appliedVal > 0 ? ((interviewVal / appliedVal) * 100).toFixed(1) : "0.0";
    const offerAcceptance = offerVal > 0 ? ((hiredVal / offerVal) * 100).toFixed(1) : "0.0";
    const overallConv = appliedVal > 0 ? ((hiredVal / appliedVal) * 100).toFixed(1) : "0.0";

    return {
      totals: {
        applied: appliedVal,
        screening: parseInt(totals.screening) || 0,
        interview: interviewVal,
        offer: offerVal,
        hired: hiredVal
      },
      breakdown: formattedBreakdown,
      insights: {
        avgTimeToHire: '28 Days', // Static/Mock placeholder for duration metrics
        interviewConversion: `${interviewConv}%`,
        offerAcceptanceRate: `${offerAcceptance}%`,
        overallConversion: `${overallConv}%`
      }
    };
  }
}

module.exports = HiringPipelineService;
