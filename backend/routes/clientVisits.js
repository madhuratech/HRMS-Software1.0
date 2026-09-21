const express = require('express');
const router = express.Router();
const clientVisitController = require('../controllers/clientVisitController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { requireSalesAndMarketing } = require('../middlewares/gpsAuth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-visit-' + file.originalname.replace(/\s+/g, '-'));
  }
});
const upload = multer({ storage: storage });

router.post('/start-journey', authenticateJWT, requireSalesAndMarketing, clientVisitController.startJourney);
router.post('/track', authenticateJWT, requireSalesAndMarketing, clientVisitController.trackLocation);
router.post('/reach-client', authenticateJWT, requireSalesAndMarketing, upload.single('photo'), clientVisitController.reachClient);
router.post('/end-meeting', authenticateJWT, requireSalesAndMarketing, upload.single('photo'), clientVisitController.endMeeting);
router.post('/reach-office', authenticateJWT, requireSalesAndMarketing, clientVisitController.reachOffice);
router.get('/active', authenticateJWT, requireSalesAndMarketing, clientVisitController.getActiveVisits);
router.get('/live', authenticateJWT, requireSalesAndMarketing, clientVisitController.getLiveDashboard);
router.get('/:id/track', authenticateJWT, requireSalesAndMarketing, clientVisitController.getLiveTrack);
router.delete('/:id', authenticateJWT, requireSalesAndMarketing, clientVisitController.deleteVisit);
router.post('/resolve-link', authenticateJWT, requireSalesAndMarketing, clientVisitController.resolveMapLink);

module.exports = router;
