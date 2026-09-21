const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');

// Enable universal CORS for resume viewing and downloads
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// GET /api/applications/:applicationId/resume
router.get('/:applicationId/resume', ApplicationController.getResume);

// GET /api/applications/:applicationId/ats-evaluation
router.get('/:applicationId/ats-evaluation', ApplicationController.getAtsEvaluation);

// POST /api/applications/:applicationId/evaluate
router.post('/:applicationId/evaluate', ApplicationController.evaluate);

module.exports = router;
