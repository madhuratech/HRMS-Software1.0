const ApplicationService = require('../services/ApplicationService');
const response = require('../utils/response');
const fs = require('fs');
const path = require('path');

class ApplicationController {
  /**
   * Serve physical resume file for an exact application
   * GET /api/applications/:applicationId/resume
   */
  static async getResume(req, res) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const application = await ApplicationService.getById(applicationId);

      console.log("========== RESUME DEBUG ==========");
      console.log("Application ID:", applicationId);
      console.log("Full Application:", application ? {
        id: application.application_id,
        candidate_name: application.candidate_name,
        original_resume: application.application_original_resume || application.candidate_original_resume,
        original_resume_name: application.application_original_resume_name || application.candidate_original_resume_name,
        resume: application.application_resume || application.candidate_resume
      } : null);
      console.log("application.resume:", application?.application_resume || application?.candidate_resume || application?.resume);
      console.log("application.original_resume:", application?.application_original_resume || application?.candidate_original_resume || application?.original_resume);
      console.log("application.original_resume_name:", application?.application_original_resume_name || application?.candidate_original_resume_name || application?.original_resume_name);
      console.log("==================================");

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Original uploaded resume file not found",
          applicationId
        });
      }

      const fileData = await ApplicationService.getResumeFile(applicationId);

      if (!fileData || !fs.existsSync(fileData.filePath)) {
        return res.status(404).json({
          success: false,
          message: "Original uploaded resume file not found",
          resumePath: application?.application_original_resume || application?.application_resume
        });
      }

      res.setHeader('Content-Type', fileData.contentType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileData.originalResumeName || 'Dina App Dev Resume.pdf'}"`);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(path.resolve(fileData.filePath));
    } catch (err) {
      console.error('[ApplicationController.getResume] Error:', err);
      const statusCode = err.statusCode || 404;
      return res.status(statusCode).json({
        success: false,
        message: err.message || "Original uploaded resume file not found"
      });
    }
  }

  /**
   * Live ATS evaluation for an exact application
   * GET /api/applications/:applicationId/ats-evaluation
   */
  static async getAtsEvaluation(req, res) {
    try {
      const applicationId = req.params.applicationId;
      const evaluation = await ApplicationService.getAtsEvaluation(applicationId);
      return res.status(200).json(evaluation);
    } catch (err) {
      console.error('[ApplicationController.getAtsEvaluation] Error:', err);
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to generate ATS evaluation for application'
      });
    }
  }

  /**
   * Evaluate candidate application (Shortlist / Reject)
   * POST /api/applications/:applicationId/evaluate
   */
  static async evaluate(req, res) {
    try {
      const userId = req.user?.id || 1;
      const applicationId = req.params.applicationId;
      const payload = req.body || {};

      const result = await ApplicationService.evaluate(applicationId, payload, userId);
      return res.status(200).json({
        success: true,
        message: `Application marked as ${result.status}`,
        data: result
      });
    } catch (err) {
      console.error('[ApplicationController.evaluate] Error:', err);
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to submit application evaluation'
      });
    }
  }
}

module.exports = ApplicationController;
