const ClientVisitService = require('../services/ClientVisitService');
const db = require('../config/database');
const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.startJourney = async (req, res) => {
  try {
    let employeeId = req.user.employeeId || req.user.employee_id;
    
    if (!employeeId && ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'].includes(String(req.user.role || '').toUpperCase())) {
      const rows = await query('SELECT id FROM employees LIMIT 1');
      if (rows && rows.length > 0) {
        employeeId = rows[0].id;
      } else {
        return res.status(400).json({ success: false, message: "No employees found in the database. Please create at least one employee to test tracking." });
      }
    } else if (!employeeId) {
      employeeId = req.user.id;
    }
    const { clientName, lat, lng, clientAddress, destLat, destLng } = req.body;
    
    if (!clientName || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Missing required fields (clientName, lat, lng)" });
    }

    const visit = await ClientVisitService.startJourney(
      employeeId, clientName,
      parseFloat(lat), parseFloat(lng),
      clientAddress || null,
      destLat ? parseFloat(destLat) : null,
      destLng ? parseFloat(destLng) : null
    );
    res.json({ success: true, visit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reachClient = async (req, res) => {
  try {
    const { visitId, lat, lng } = req.body;
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }
    
    if (!visitId || !lat || !lng || !photoUrl) {
      return res.status(400).json({ success: false, message: "Missing required fields (visitId, lat, lng, photo)" });
    }

    await ClientVisitService.reachClient(visitId, parseFloat(lat), parseFloat(lng), photoUrl);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.endMeeting = async (req, res) => {
  try {
    const { visitId, lat, lng } = req.body;
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }
    
    if (!visitId || !lat || !lng || !photoUrl) {
      return res.status(400).json({ success: false, message: "Missing required fields (visitId, lat, lng, photo)" });
    }

    await ClientVisitService.endMeeting(visitId, parseFloat(lat), parseFloat(lng), photoUrl);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reachOffice = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;
    const { visitId, lat, lng } = req.body;
    
    if (!visitId || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Missing required fields (visitId, lat, lng)" });
    }

    const result = await ClientVisitService.reachOffice(visitId, employeeId, parseFloat(lat), parseFloat(lng));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackLocation = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;
    const { visitId, lat, lng } = req.body;
    
    if (!visitId || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await ClientVisitService.trackLocation(visitId, employeeId, parseFloat(lat), parseFloat(lng));
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveVisits = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;
    const role = String(req.user.role || '').toUpperCase();
    let visits = [];
    let completed = [];
    if (['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'SALES_MANAGER', 'TEAM_LEADER', 'TEAMLEAD', 'MANAGER', 'HR', 'HR_MANAGER'].includes(role)) {
      const data = await ClientVisitService.getLiveVisits();
      visits = data.activeVisits;
      completed = data.completedVisits;
    } else {
      visits = await ClientVisitService.getActiveVisitsForEmployee(employeeId);
      completed = await ClientVisitService.getCompletedVisitsForEmployee(employeeId);
    }
    res.json({ success: true, visits, completedVisits: completed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLiveDashboard = async (req, res) => {
  try {
    const data = await ClientVisitService.getLiveVisits();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLiveTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await ClientVisitService.getLiveVisitDetails(id);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    await ClientVisitService.deleteVisit(id);
    res.json({ success: true, message: 'Visit deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveMapLink = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'Missing URL' });
    
    // Follow redirect to get the long URL containing coordinates
    const response = await fetch(url, { redirect: 'follow' });
    const expandedUrl = response.url;
    
    res.json({ success: true, expandedUrl });
  } catch (error) {
    console.error('Error resolving map link:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve map link' });
  }
};

