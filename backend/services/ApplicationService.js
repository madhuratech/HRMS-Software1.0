const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const ResumeParserService = require('./ResumeParserService');
const AtsScoringService = require('./AtsScoringService');

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

class ApplicationService {
  /**
   * Fetch complete application record by application ID (or candidate ID fallback)
   */
  static async getById(applicationId) {
    if (!applicationId) return null;

    const sqlByAppId = `
      SELECT 
        ca.id as application_id,
        ca.id as id,
        ca.candidate_id,
        ca.requirement_id,
        ca.job_position,
        ca.status,
        ca.ats_score,
        ca.ats_breakdown,
        ca.screening_score,
        ca.screening_answers,
        ca.evaluation_status,
        ca.evaluated_at,
        ca.evaluated_by,
        ca.evaluation_notes,
        ca.created_at,
        ca.updated_at,
        ca.original_resume as application_original_resume,
        ca.original_resume_name as application_original_resume_name,
        ca.resume as application_resume,
        ca.generated_resume as application_generated_resume,
        ca.skills as application_skills,
        ca.extracted_skills,
        ca.resume_text,
        c.candidate_name,
        c.email,
        c.mobile_number,
        c.gender,
        c.date_of_birth,
        c.original_resume as candidate_original_resume,
        c.original_resume_name as candidate_original_resume_name,
        c.resume as candidate_resume,
        c.generated_resume as candidate_generated_resume,
        c.experience,
        c.current_company,
        c.current_salary,
        c.expected_salary,
        c.notice_period,
        c.skills as candidate_skills,
        c.address,
        r.id as job_id,
        r.job_title,
        r.requirement_code,
        r.department_id,
        r.skills as job_skills,
        r.job_description,
        r.experience_from,
        r.experience_to,
        r.salary_from,
        r.salary_to,
        r.location as job_location
      FROM candidate_applications ca
      INNER JOIN candidates c ON ca.candidate_id = c.id
      LEFT JOIN requirements r ON ca.requirement_id = r.id
      WHERE ca.id = ?
      LIMIT 1
    `;

    const appRows = await queryAsync(sqlByAppId, [applicationId]);
    if (appRows && appRows.length > 0) {
      return appRows[0];
    }

    // Fallback: search by candidate_id in candidate_applications
    const sqlByCandId = `
      SELECT 
        ca.id as application_id,
        ca.id as id,
        ca.candidate_id,
        ca.requirement_id,
        ca.job_position,
        ca.status,
        ca.ats_score,
        ca.ats_breakdown,
        ca.screening_score,
        ca.screening_answers,
        ca.evaluation_status,
        ca.evaluated_at,
        ca.evaluated_by,
        ca.evaluation_notes,
        ca.created_at,
        ca.updated_at,
        ca.original_resume as application_original_resume,
        ca.original_resume_name as application_original_resume_name,
        ca.resume as application_resume,
        ca.generated_resume as application_generated_resume,
        ca.skills as application_skills,
        ca.extracted_skills,
        ca.resume_text,
        c.candidate_name,
        c.email,
        c.mobile_number,
        c.gender,
        c.date_of_birth,
        c.original_resume as candidate_original_resume,
        c.original_resume_name as candidate_original_resume_name,
        c.resume as candidate_resume,
        c.generated_resume as candidate_generated_resume,
        c.experience,
        c.current_company,
        c.current_salary,
        c.expected_salary,
        c.notice_period,
        c.skills as candidate_skills,
        c.address,
        r.id as job_id,
        r.job_title,
        r.requirement_code,
        r.department_id,
        r.skills as job_skills,
        r.job_description,
        r.experience_from,
        r.experience_to,
        r.salary_from,
        r.salary_to,
        r.location as job_location
      FROM candidate_applications ca
      INNER JOIN candidates c ON ca.candidate_id = c.id
      LEFT JOIN requirements r ON ca.requirement_id = r.id
      WHERE ca.candidate_id = ?
      ORDER BY ca.id DESC
      LIMIT 1
    `;

    const candAppRows = await queryAsync(sqlByCandId, [applicationId]);
    if (candAppRows && candAppRows.length > 0) {
      return candAppRows[0];
    }

    // Tier 3: Direct fallback in candidates table
    const candDirectRows = await queryAsync(`
      SELECT 
        c.id as application_id,
        c.id as id,
        c.id as candidate_id,
        c.requirement_id,
        c.job_position,
        c.status,
        c.ats_score,
        c.ats_breakdown,
        c.screening_score,
        c.screening_answers,
        c.evaluation_status,
        c.evaluated_at,
        c.evaluated_by,
        c.evaluation_notes,
        c.created_at,
        c.updated_at,
        c.original_resume as application_original_resume,
        c.original_resume_name as application_original_resume_name,
        c.resume as application_resume,
        c.generated_resume as application_generated_resume,
        c.skills as application_skills,
        c.skills as extracted_skills,
        c.candidate_name,
        c.email,
        c.mobile_number,
        c.gender,
        c.date_of_birth,
        c.original_resume as candidate_original_resume,
        c.original_resume_name as candidate_original_resume_name,
        c.resume as candidate_resume,
        c.generated_resume as candidate_generated_resume,
        c.experience,
        c.current_company,
        c.current_salary,
        c.expected_salary,
        c.notice_period,
        c.skills as candidate_skills,
        c.address,
        r.id as job_id,
        r.job_title,
        r.requirement_code,
        r.department_id,
        r.skills as job_skills,
        r.job_description,
        r.experience_from,
        r.experience_to,
        r.salary_from,
        r.salary_to,
        r.location as job_location
      FROM candidates c
      LEFT JOIN requirements r ON c.requirement_id = r.id
      WHERE c.id = ?
      LIMIT 1
    `, [applicationId]);

    if (candDirectRows && candDirectRows.length > 0) {
      return candDirectRows[0];
    }

    return null;
  }

  /**
   * Fetch and resolve the exact uploaded PDF resume using strict priority order:
   * 1. application.original_resume
   * 2. application.resume (backward compatibility)
   * 3. application.generated_resume
   * 4. candidate.original_resume / candidate.resume
   *
   * STRICT: NEVER automatically generates a resume when viewing.
   */
  static async getResumeFile(applicationId) {
    const app = await this.getById(applicationId);
    if (!app) {
      const err = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }

    const originalResume = app.application_original_resume || app.candidate_original_resume || null;
    const resume = app.application_resume || app.candidate_resume || null;
    const generatedResume = app.application_generated_resume || app.candidate_generated_resume || null;

    let selectedResumePath = null;
    let resumeType = 'none';

    // Priority Selection:
    if (originalResume) {
      selectedResumePath = originalResume;
      resumeType = 'original_resume';
    } else if (resume) {
      selectedResumePath = resume;
      resumeType = 'resume';
    } else if (generatedResume) {
      selectedResumePath = generatedResume;
      resumeType = 'generated_resume';
    }

    const originalResumeName = app.application_original_resume_name || app.candidate_original_resume_name || 'Dina App Dev Resume.pdf';

    console.log("Application ID:", app.application_id || applicationId);
    console.log("Original Resume:", originalResume);
    console.log("Resume:", resume);
    console.log("Generated Resume:", generatedResume);
    console.log("Selected Resume URL:", selectedResumePath);

    if (!selectedResumePath) {
      const err = new Error('Original resume not available');
      err.statusCode = 404;
      throw err;
    }

    const resolvedPath = ResumeParserService.resolveFilePath(
      selectedResumePath,
      app.candidate_name,
      originalResumeName
    );
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      const err = new Error('Original resume not available');
      err.statusCode = 404;
      throw err;
    }

    return {
      filePath: resolvedPath,
      originalResumeName,
      contentType: 'application/pdf',
      resumeType
    };
  }

  /**
   * Perform live ATS evaluation on the exact application record.
   * Reads the real uploaded PDF, extracts skills, and scores against the specific job requirement.
   */
  static async getAtsEvaluation(applicationId) {
    const app = await this.getById(applicationId);
    if (!app) {
      const err = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }

    const originalResume = app.application_original_resume || app.candidate_original_resume;
    const resume = app.application_resume || app.candidate_resume;
    const generatedResume = app.application_generated_resume || app.candidate_generated_resume || null;
    const selectedResumePath = originalResume || resume || generatedResume || null;
    const originalResumeName = app.application_original_resume_name || app.candidate_original_resume_name || 'Dina App Dev Resume.pdf';

    console.log('[ApplicationService.getAtsEvaluation]', {
      applicationId: app.application_id,
      candidateId: app.candidate_id,
      jobId: app.requirement_id,
      selectedResumePath,
      originalResumeName
    });

    // 1. Extract text and skills from the actual uploaded resume PDF
    let extractedResumeData = { skills: [], education: null, experience: null, rawText: '' };
    if (selectedResumePath) {
      try {
        extractedResumeData = await ResumeParserService.parseResume(selectedResumePath);
      } catch (e) {
        console.warn('[ApplicationService.getAtsEvaluation] Resume parser note:', e.message);
      }
    }

    // 2. Parse candidate's submitted application skills safely into an array
    const rawAppSkills = app.application_skills || app.candidate_skills || '';
    const submittedSkillsList = (Array.isArray(rawAppSkills) ? rawAppSkills : String(rawAppSkills).split(/[,|•\n]/))
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.toLowerCase() !== String(app.job_position || '').toLowerCase());

    // 3. Priority merge skills: (1) Extracted from real PDF text, (2) Submitted application skills
    const mergedSkills = ResumeParserService.mergeSkills({
      resumeSkills: extractedResumeData.skills || [],
      formSkills: submittedSkillsList.join(', '),
      profileSkills: app.candidate_skills || ''
    });

    const candidateDataForAts = {
      candidate_name: app.candidate_name,
      email: app.email,
      mobile_number: app.mobile_number,
      job_position: app.job_position || app.job_title,
      skills: mergedSkills,
      extracted_resume_skills: extractedResumeData.skills || [],
      extracted_education: extractedResumeData.education,
      extracted_experience: extractedResumeData.experience,
      experience: app.experience || extractedResumeData.experience || '0-1 Years',
      notice_period: app.notice_period || 'Immediate',
      expected_salary: app.expected_salary ? parseFloat(app.expected_salary) : null
    };

    // 4. Load target job requirement
    let targetJob = null;
    if (app.requirement_id) {
      const jobRows = await queryAsync('SELECT * FROM requirements WHERE id = ?', [app.requirement_id]);
      if (jobRows.length > 0) targetJob = jobRows[0];
    }
    if (!targetJob && app.job_position) {
      const jobRows = await queryAsync('SELECT * FROM requirements WHERE LOWER(job_title) = LOWER(?) ORDER BY id DESC LIMIT 1', [app.job_position]);
      if (jobRows.length > 0) targetJob = jobRows[0];
    }

    // 5. Calculate dynamic ATS score using real application data
    const screeningAnswers = app.screening_answers;
    const atsResult = AtsScoringService.calculateAtsScore(candidateDataForAts, targetJob, screeningAnswers);
    const atsScore = atsResult.totalAtsScore;
    const atsBreakdown = JSON.stringify(atsResult.breakdown);
    const extractedSkillsStr = JSON.stringify(extractedResumeData.skills || []);

    // 6. Save ATS result strictly into this candidate_applications record
    await queryAsync(`
      UPDATE candidate_applications SET
        ats_score = ?,
        ats_breakdown = ?,
        extracted_skills = ?,
        resume_text = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [atsScore, atsBreakdown, extractedSkillsStr, extractedResumeData.rawText || '', app.application_id]);

    // Also sync candidate profile
    const mergedSkillsStr = mergedSkills.join(', ');
    if (mergedSkillsStr) {
      await queryAsync('UPDATE candidates SET skills = ?, ats_score = ?, ats_breakdown = ? WHERE id = ?', [
        mergedSkillsStr, atsScore, atsBreakdown, app.candidate_id
      ]);
    }

    return {
      success: true,
      applicationId: app.application_id,
      application: {
        id: app.application_id,
        applicationId: app.application_id,
        candidateId: app.candidate_id,
        jobId: targetJob ? targetJob.id : app.requirement_id,
        jobTitle: targetJob ? targetJob.job_title : app.job_position,
        candidateName: app.candidate_name,
        email: app.email,
        phone: app.mobile_number,
        resumeUrl: selectedResumePath,
        original_resume: originalResume,
        resume: resume,
        generated_resume: generatedResume,
        originalResumeName,
        skills: mergedSkills,
        submittedSkills: submittedSkillsList,
        status: app.status,
        evaluationStatus: app.evaluation_status,
        evaluationNotes: app.evaluation_notes,
        appliedAt: app.created_at
      },
      candidate: {
        id: app.candidate_id,
        name: app.candidate_name,
        email: app.email,
        phone: app.mobile_number,
        resume: selectedResumePath,
        original_resume: originalResume,
        originalResumeName,
        skills: mergedSkills,
        submittedSkills: submittedSkillsList,
        resumeSkills: extractedResumeData.skills || [],
        experience: app.experience || extractedResumeData.experience || '0-1 Years',
        education: extractedResumeData.education || 'Graduate',
        currentCompany: app.current_company,
        currentSalary: app.current_salary,
        expectedSalary: app.expected_salary,
        noticePeriod: app.notice_period || 'Immediate'
      },
      job: targetJob ? {
        id: targetJob.id,
        title: targetJob.job_title,
        requirementCode: targetJob.requirement_code,
        skills: targetJob.skills ? ResumeParserService.extractSkillsFromText(targetJob.skills) : [],
        requiredSkills: atsResult.breakdown?.skills?.matchedSkills?.concat(atsResult.breakdown?.skills?.missingSkills || []) || [],
        experienceRequired: `${targetJob.experience_from || 0} - ${targetJob.experience_to || 0} Years`,
        salaryRange: targetJob.salary_to ? `₹${Number(targetJob.salary_from || 0).toLocaleString()} - ₹${Number(targetJob.salary_to).toLocaleString()}` : 'N/A'
      } : {
        title: app.job_position,
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
   * Record recruiter decision (Shortlist / Reject) for this specific application
   */
  static async evaluate(applicationId, payload, userId) {
    const app = await this.getById(applicationId);
    if (!app) {
      const err = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }

    const { action, notes, remarks } = payload || {};
    const notesToUse = notes || remarks || null;

    let targetStatus = 'Shortlisted';
    if (action === 'REJECT') {
      targetStatus = 'Rejected';
      if (!notesToUse) {
        const err = new Error('Rejection reason is required');
        err.statusCode = 400;
        throw err;
      }
    } else if (action === 'SHORTLIST') {
      targetStatus = 'Shortlisted';
    }

    await queryAsync(`
      UPDATE candidate_applications SET
        status = ?,
        evaluation_status = 'EVALUATED',
        evaluated_at = NOW(),
        evaluated_by = ?,
        evaluation_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [targetStatus, userId, notesToUse, app.application_id]);

    // Also sync candidate status
    await queryAsync(`
      UPDATE candidates SET
        status = ?,
        evaluation_status = 'EVALUATED',
        evaluated_at = NOW(),
        evaluated_by = ?,
        evaluation_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [targetStatus, userId, notesToUse, app.candidate_id]);

    return {
      applicationId: app.application_id,
      candidateId: app.candidate_id,
      status: targetStatus,
      evaluationNotes: notesToUse
    };
  }
}

module.exports = ApplicationService;
