const express = require('express');
const router = express.Router();
const PublicJobsController = require('../controllers/PublicJobsController');
const upload = require('../utils/fileUpload');

/*
|--------------------------------------------------------------------------
| PUBLIC CAREER API (Accessible by WordPress, Career Portals, Embeds)
|--------------------------------------------------------------------------
*/

// Enable universal CORS for public API endpoints
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// GET ALL ACTIVE JOBS
router.get('/', PublicJobsController.listJobs);

// GET SINGLE JOB
router.get('/:slug', PublicJobsController.getJobDetails);

// APPLY FOR JOB
router.post('/:jobId/apply', upload.single('resume'), PublicJobsController.applyForJob);

module.exports = router;