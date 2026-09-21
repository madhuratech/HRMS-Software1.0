/**
 * ATS Scoring Service
 * Purely deterministic, live-calculated ATS scoring engine based on:
 * 1. Skills Match (Max: 40 points) -> Matched Skills + Missing Skills
 * 2. Experience Match (Max: 20 points) -> Actual Candidate vs. Job Requirement
 * 3. Education Match (Max: 10 points) -> Degree / Qualification Alignment
 * 4. Screening Score (Max: 20 points) -> Real Screening Questions / Answers
 * 5. Other Criteria (Max: 10 points) -> Notice Period + Salary Compatibility
 */

const ResumeParserService = require('./ResumeParserService');

class AtsScoringService {
  /**
   * Helper: Parse numeric years of experience from string/number
   */
  static parseExperienceYears(exp) {
    if (typeof exp === 'number') return exp;
    if (!exp) return 0;
    const str = String(exp).toLowerCase();
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Helper: Normalize string list into array of clean lowercase keywords & canonical names
   */
  static extractKeywords(text) {
    if (!text) return [];
    if (Array.isArray(text)) {
      return text.map(t => String(t).trim()).filter(Boolean);
    }
    return String(text)
      .split(/[,;\n/|+]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1);
  }

  /**
   * Calculate 100% dynamic, live ATS score
   * @param {Object} candidate - Candidate details & extracted resume metadata
   * @param {Object} requirement - Job requirement details
   * @param {Array|Object} screeningAnswers - Submitted screening questions & answers
   * @returns {Object} Comprehensive evaluation result
   */
  static calculateAtsScore(candidate = {}, requirement = null, screeningAnswers = null) {
    // -------------------------------------------------------------
    // 1. SKILLS MATCH (Max: 40 Points)
    // -------------------------------------------------------------
    let skillsScore = 0;
    const matchedSkills = [];
    const missingSkills = [];

    // Candidate skills (Priority: Resume -> Form -> Profile)
    let candidateSkillsList = [];
    if (Array.isArray(candidate.skills)) {
      candidateSkillsList = candidate.skills;
    } else if (typeof candidate.skills === 'string' && candidate.skills.trim()) {
      candidateSkillsList = ResumeParserService.mergeSkills({
        formSkills: candidate.skills,
        profileSkills: candidate.skills
      });
    }

    if (candidate.extracted_resume_skills && Array.isArray(candidate.extracted_resume_skills)) {
      candidateSkillsList = ResumeParserService.mergeSkills({
        resumeSkills: candidate.extracted_resume_skills,
        formSkills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : (candidate.skills || '')
      });
    }

    // Required job skills
    let reqSkills = [];
    if (requirement) {
      if (Array.isArray(requirement.skills)) {
        reqSkills = requirement.skills;
      } else if (typeof requirement.skills === 'string' && requirement.skills.trim()) {
        reqSkills = ResumeParserService.extractSkillsFromText(requirement.skills);
        if (reqSkills.length === 0) {
          reqSkills = this.extractKeywords(requirement.skills);
        }
      }
      // Also inspect job_description for any technical keywords if skills column was sparse
      if (reqSkills.length === 0 && requirement.job_description) {
        reqSkills = ResumeParserService.extractSkillsFromText(requirement.job_description);
      }
    }

    if (reqSkills.length > 0) {
      reqSkills.forEach(reqSkill => {
        const reqLower = String(reqSkill).toLowerCase().trim();
        const isMatched = candidateSkillsList.some(candSkill => {
          const candLower = String(candSkill).toLowerCase().trim();
          return candLower === reqLower ||
                 candLower.includes(reqLower) ||
                 reqLower.includes(candLower);
        });

        if (isMatched) {
          matchedSkills.push(reqSkill);
        } else {
          missingSkills.push(reqSkill);
        }
      });

      const matchRatio = reqSkills.length > 0 ? (matchedSkills.length / reqSkills.length) : 0;
      skillsScore = Math.round(matchRatio * 40);

      // Job title bonus: if candidate position matches job title (+3 pts up to max 40)
      const jobTitle = String(requirement?.job_title || '').toLowerCase();
      const candTitle = String(candidate.job_position || '').toLowerCase();
      if (jobTitle && candTitle && (jobTitle.includes(candTitle) || candTitle.includes(jobTitle))) {
        skillsScore = Math.min(40, skillsScore + 3);
      }
    } else if (candidateSkillsList.length > 0) {
      // If job has no skills configured, award based on candidate's rich skill set
      skillsScore = Math.min(40, 20 + Math.min(candidateSkillsList.length * 3, 20));
      candidateSkillsList.forEach(s => matchedSkills.push(s));
    } else {
      skillsScore = 0;
    }

    // -------------------------------------------------------------
    // 2. EXPERIENCE MATCH (Max: 20 Points)
    // -------------------------------------------------------------
    let experienceScore = 0;
    const candExpYears = this.parseExperienceYears(candidate.experience || candidate.extracted_experience);
    const expFrom = requirement && requirement.experience_from != null ? parseFloat(requirement.experience_from) : null;
    const expTo = requirement && requirement.experience_to != null ? parseFloat(requirement.experience_to) : null;

    if (expFrom != null || expTo != null) {
      const minRequired = expFrom != null ? expFrom : 0;
      const maxRequired = expTo != null ? expTo : minRequired + 3;

      if (candExpYears >= minRequired && candExpYears <= maxRequired + 2) {
        experienceScore = 20;
      } else if (candExpYears > maxRequired + 2) {
        // Slightly overqualified
        experienceScore = 17;
      } else if (candExpYears < minRequired) {
        if (minRequired === 0) {
          experienceScore = 20;
        } else {
          const ratio = Math.max(0, candExpYears / minRequired);
          experienceScore = Math.round(ratio * 20);
        }
      }
    } else {
      // Default experience grading if job didn't specify min/max
      if (candExpYears >= 3) experienceScore = 20;
      else if (candExpYears >= 1) experienceScore = 15;
      else if (candExpYears > 0) experienceScore = 10;
      else experienceScore = 5;
    }

    // -------------------------------------------------------------
    // 3. EDUCATION MATCH (Max: 10 Points)
    // -------------------------------------------------------------
    let educationScore = 0;
    const candEducation = String(candidate.education || candidate.extracted_education || candidate.address || '').toLowerCase();
    const reqEducation = String(requirement?.education || requirement?.job_description || '').toLowerCase();

    const isGradDegree = /\b(b\.?tech|b\.?e\.?|mca|bca|m\.?tech|bachelor|master|degree|graduate|b\.?sc|m\.?sc)\b/i.test(candEducation);

    if (reqEducation && /\b(b\.?tech|b\.?e\.?|mca|m\.?tech|master)\b/i.test(reqEducation)) {
      if (/\b(b\.?tech|b\.?e\.?|mca|m\.?tech|master)\b/i.test(candEducation)) {
        educationScore = 10;
      } else if (isGradDegree) {
        educationScore = 8;
      } else if (candEducation.includes('diploma')) {
        educationScore = 5;
      } else {
        educationScore = 3;
      }
    } else {
      // General education score
      if (isGradDegree) educationScore = 10;
      else if (candEducation.includes('diploma')) educationScore = 7;
      else if (candEducation.length > 2) educationScore = 6;
      else educationScore = 5;
    }

    // -------------------------------------------------------------
    // 4. SCREENING SCORE (Max: 20 Points)
    // -------------------------------------------------------------
    let screeningScore = 0;
    let screeningStatus = 'Not Available';

    let parsedAnswers = screeningAnswers;
    if (typeof parsedAnswers === 'string') {
      try {
        parsedAnswers = JSON.parse(parsedAnswers);
      } catch (e) {
        parsedAnswers = null;
      }
    }

    if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
      let passedCount = 0;
      parsedAnswers.forEach(ans => {
        if (ans.passed === true || ans.is_correct === true || ans.score >= 70 || ans.result === 'Passed' || ans.status === 'Pass') {
          passedCount++;
        } else if (ans.score != null) {
          passedCount += Math.min(1, parseFloat(ans.score) / 100);
        } else if (ans.answer && String(ans.answer).trim().length > 0 && String(ans.answer).toLowerCase() !== 'no') {
          passedCount += 0.75;
        }
      });
      const ratio = Math.min(1, passedCount / parsedAnswers.length);
      screeningScore = Math.round(ratio * 20);
      screeningStatus = 'Calculated';
    } else if (candidate.screening_score != null && Number(candidate.screening_score) > 0) {
      screeningScore = Math.min(20, Math.round(parseFloat(candidate.screening_score) * 0.2));
      screeningStatus = 'Calculated';
    } else {
      screeningScore = 0;
      screeningStatus = 'Not Configured';
    }

    // -------------------------------------------------------------
    // 5. OTHER CRITERIA (Max: 10 Points)
    // -------------------------------------------------------------
    // Notice Period (Max 5)
    let noticeScore = 0;
    const notice = String(candidate.notice_period || '').toLowerCase();
    if (notice.includes('immediate') || notice.includes('0') || notice.includes('15') || notice.includes('15 days')) {
      noticeScore = 5;
    } else if (notice.includes('30') || notice.includes('1 month') || notice.includes('1-month')) {
      noticeScore = 4;
    } else if (notice.includes('60') || notice.includes('2 month')) {
      noticeScore = 2;
    } else if (notice.includes('90') || notice.includes('3 month')) {
      noticeScore = 1;
    } else {
      noticeScore = 3;
    }

    // Salary Compatibility (Max 5)
    let salaryScore = 0;
    const candExpected = candidate.expected_salary ? parseFloat(candidate.expected_salary) : null;
    const reqSalaryMax = requirement && requirement.salary_to ? parseFloat(requirement.salary_to) : null;

    if (candExpected && reqSalaryMax) {
      if (candExpected <= reqSalaryMax) {
        salaryScore = 5;
      } else if (candExpected <= reqSalaryMax * 1.15) {
        salaryScore = 3;
      } else {
        salaryScore = 1;
      }
    } else {
      salaryScore = 3;
    }

    const otherScore = noticeScore + salaryScore;

    // -------------------------------------------------------------
    // TOTAL SCORE (Sum of 5 components, Maximum 100)
    // -------------------------------------------------------------
    const totalAtsScore = Math.min(100, Math.max(0, skillsScore + experienceScore + educationScore + screeningScore + otherScore));

    const matchLevel = totalAtsScore >= 80 ? 'Excellent Match'
                     : totalAtsScore >= 60 ? 'Good Match'
                     : totalAtsScore >= 40 ? 'Fair Match'
                     : 'Low Match';

    return {
      totalAtsScore,
      matchLevel,
      screeningScore: screeningStatus === 'Calculated' ? Math.round((screeningScore / 20) * 100) : 0,
      breakdown: {
        skills: {
          score: skillsScore,
          maximum: 40,
          matchedSkills,
          missingSkills
        },
        experience: {
          score: experienceScore,
          maximum: 20,
          candidateExperience: candExpYears ? `${candExpYears} Years` : '0 Years',
          requiredExperience: requirement ? `${requirement.experience_from || 0} - ${requirement.experience_to || 0} Years` : 'N/A'
        },
        education: {
          score: educationScore,
          maximum: 10,
          candidateEducation: candidate.education || candidate.extracted_education || 'Graduate',
          requiredEducation: requirement?.education || 'Graduate'
        },
        screening: {
          score: screeningScore,
          maximum: 20,
          status: screeningStatus
        },
        otherCriteria: {
          score: otherScore,
          maximum: 10,
          noticePeriod: candidate.notice_period || 'Immediate',
          salaryCompatibility: `${salaryScore}/5`
        },
        // Flat legacy fields for backward compatibility
        skillsMatch: skillsScore,
        skillsTotal: 40,
        experienceMatch: experienceScore,
        experienceTotal: 20,
        educationMatch: educationScore,
        educationTotal: 10,
        screeningMatch: screeningScore,
        screeningTotal: 20,
        otherMatch: otherScore,
        otherTotal: 10,
        totalAtsScore
      }
    };
  }
}

module.exports = AtsScoringService;
