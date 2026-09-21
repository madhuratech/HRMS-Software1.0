const db = require('../config/database');
const util = require('util');
const query = util.promisify(db.query).bind(db);

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate real distance with noise filtering:
// - Ignore jumps < 40 meters (GPS noise when stationary)
// - Ignore jumps > 2 km per point (GPS glitch / teleport)
function calcRealDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = getDistanceFromLatLonInKm(
      parseFloat(points[i-1].latitude), parseFloat(points[i-1].longitude),
      parseFloat(points[i].latitude),   parseFloat(points[i].longitude)
    );
    if (d >= 0.04 && d < 2.0) { // between 40m and 2km per step
      total += d;
    }
  }
  return total;
}

class ClientVisitService {
  // officeLat/officeLng = where the employee is currently (office/start point)
  static async startJourney(employeeId, clientName, officeLat, officeLng, clientAddress, destLat, destLng) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const result = await query(`
      INSERT INTO client_visits 
      (employee_id, client_name, date, start_journey_time, office_lat, office_lng, client_address, client_dest_lat, client_dest_lng, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Travelling')
    `, [employeeId, clientName, today, now, officeLat, officeLng, clientAddress || null, destLat || null, destLng || null]);
    
    const visitId = result.insertId;
    
    // Store starting location in history
    await query(`
      INSERT INTO LocationHistory (employee_id, latitude, longitude, visit_id, recorded_at)
      VALUES (?, ?, ?, ?, ?)
    `, [employeeId, officeLat, officeLng, visitId, now]);

    return { id: visitId, employee_id: employeeId, status: 'Travelling' };
  }

  static async reachClient(visitId, lat, lng, photoUrl) {
    const now = new Date();
    await query(`
      UPDATE client_visits
      SET check_in_time = ?, check_in_lat = ?, check_in_lng = ?, photo_in_url = ?, status = 'In Meeting'
      WHERE id = ?
    `, [now, lat, lng, photoUrl, visitId]);

    const v = await query('SELECT employee_id FROM client_visits WHERE id = ?', [visitId]);
    if (v && v.length > 0) {
      await query(`
        INSERT INTO LocationHistory (employee_id, latitude, longitude, visit_id, recorded_at)
        VALUES (?, ?, ?, ?, ?)
      `, [v[0].employee_id, lat, lng, visitId, now]);
    }
  }

  static async endMeeting(visitId, lat, lng, photoUrl) {
    const now = new Date();
    await query(`
      UPDATE client_visits
      SET check_out_time = ?, check_out_lat = ?, check_out_lng = ?, photo_out_url = ?, status = 'Returning'
      WHERE id = ?
    `, [now, lat, lng, photoUrl, visitId]);

    const v = await query('SELECT employee_id FROM client_visits WHERE id = ?', [visitId]);
    if (v && v.length > 0) {
      await query(`
        INSERT INTO LocationHistory (employee_id, latitude, longitude, visit_id, recorded_at)
        VALUES (?, ?, ?, ?, ?)
      `, [v[0].employee_id, lat, lng, visitId, now]);
    }
  }

  static async reachOffice(visitId, employeeId, lat, lng) {
    const now = new Date();

    // 1. Get all points for this visit to calculate total distance
    const points = await query(`
      SELECT latitude, longitude FROM LocationHistory
      WHERE visit_id = ? AND employee_id = ?
      ORDER BY recorded_at ASC
    `, [visitId, employeeId]);
    
    // Add the final point
    points.push({ latitude: lat, longitude: lng });

    const totalDistanceKm = calcRealDistance(points);

    // Rate = 5 per km
    const fee = totalDistanceKm * 5;

    await query(`
      UPDATE client_visits
      SET end_journey_time = ?, distance_travelled = ?, calculated_fee = ?, status = 'Completed'
      WHERE id = ? AND employee_id = ?
    `, [now, totalDistanceKm, fee, visitId, employeeId]);

    // Save final point
    await query(`
      INSERT INTO LocationHistory (employee_id, latitude, longitude, visit_id, recorded_at)
      VALUES (?, ?, ?, ?, ?)
    `, [employeeId, lat, lng, visitId, now]);

    return { distance: totalDistanceKm.toFixed(2), fee: fee.toFixed(2) };
  }

  static async trackLocation(visitId, employeeId, lat, lng) {
    await query(`
      INSERT INTO LocationHistory (employee_id, latitude, longitude, visit_id)
      VALUES (?, ?, ?, ?)
    `, [employeeId, lat, lng, visitId]);
    return { success: true };
  }

  static async getActiveVisitsForEmployee(employeeId) {
    const visits = await query(`
      SELECT cv.*, e.name as employee_name
      FROM client_visits cv
      LEFT JOIN employees e ON cv.employee_id = e.id
      WHERE cv.employee_id = ? AND cv.status != 'Completed'
      ORDER BY cv.id DESC
    `, [employeeId]);
    return visits;
  }

  static async getCompletedVisitsForEmployee(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    const visits = await query(`
      SELECT cv.*, e.name as employee_name
      FROM client_visits cv
      LEFT JOIN employees e ON cv.employee_id = e.id
      WHERE cv.employee_id = ? AND cv.status = 'Completed' AND cv.date = ?
      ORDER BY cv.id DESC
    `, [employeeId, today]);
    return visits;
  }

  static async getLiveVisits() {
    const activeVisits = await query(`
      SELECT cv.*, e.name as employee_name,
             (SELECT latitude FROM LocationHistory lh WHERE lh.visit_id = cv.id ORDER BY recorded_at DESC LIMIT 1) as last_lat,
             (SELECT longitude FROM LocationHistory lh WHERE lh.visit_id = cv.id ORDER BY recorded_at DESC LIMIT 1) as last_lng,
             (SELECT recorded_at FROM LocationHistory lh WHERE lh.visit_id = cv.id ORDER BY recorded_at DESC LIMIT 1) as last_update
      FROM client_visits cv
      LEFT JOIN employees e ON cv.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE cv.status != 'Completed'
      ORDER BY cv.id DESC
    `);
    
    const today = new Date().toISOString().split('T')[0];
    const completedVisits = await query(`
      SELECT cv.id, cv.employee_id, cv.client_name, cv.start_journey_time, cv.end_journey_time, cv.check_in_time, cv.check_out_time, cv.distance_travelled, cv.calculated_fee, cv.status, e.name as employee_name
      FROM client_visits cv
      LEFT JOIN employees e ON cv.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE cv.date = ? AND cv.status = 'Completed'
      ORDER BY cv.id DESC
    `, [today]);

    return { activeVisits, completedVisits };
  }

  static async getLiveVisitDetails(visitId) {
    const visits = await query(`
      SELECT cv.*, e.name as employee_name
      FROM client_visits cv
      JOIN employees e ON cv.employee_id = e.id
      WHERE cv.id = ?
    `, [visitId]);

    if (visits.length === 0) throw new Error("Visit not found");
    const visit = visits[0];

    let rawPoints = await query(`
      SELECT latitude, longitude, recorded_at FROM LocationHistory
      WHERE visit_id = ?
      ORDER BY recorded_at ASC
    `, [visitId]);

    // If starting office position was not recorded, add it at the start
    if (visit.office_lat && visit.office_lng) {
      const hasOffice = rawPoints.some(p => Math.abs(parseFloat(p.latitude) - parseFloat(visit.office_lat)) < 0.0001 && Math.abs(parseFloat(p.longitude) - parseFloat(visit.office_lng)) < 0.0001);
      if (!hasOffice) {
        rawPoints.unshift({ latitude: visit.office_lat, longitude: visit.office_lng, recorded_at: visit.start_journey_time });
      }
    }

    // If check-in milestone was completed but not in history, append it
    if (visit.check_in_lat && visit.check_in_lng) {
      const hasCheckIn = rawPoints.some(p => Math.abs(parseFloat(p.latitude) - parseFloat(visit.check_in_lat)) < 0.0001 && Math.abs(parseFloat(p.longitude) - parseFloat(visit.check_in_lng)) < 0.0001);
      if (!hasCheckIn) {
        rawPoints.push({ latitude: visit.check_in_lat, longitude: visit.check_in_lng, recorded_at: visit.check_in_time });
      }
    }

    // If check-out milestone was completed but not in history, append it
    if (visit.check_out_lat && visit.check_out_lng) {
      const hasCheckOut = rawPoints.some(p => Math.abs(parseFloat(p.latitude) - parseFloat(visit.check_out_lat)) < 0.0001 && Math.abs(parseFloat(p.longitude) - parseFloat(visit.check_out_lng)) < 0.0001);
      if (!hasCheckOut) {
        rawPoints.push({ latitude: visit.check_out_lat, longitude: visit.check_out_lng, recorded_at: visit.check_out_time });
      }
    }

    // Filter GPS noise: remove points that jump > 2km from previous (glitches)
    // Keep only points that moved > 40m from previous (remove stationary noise)
    const filteredPoints = [];
    for (let i = 0; i < rawPoints.length; i++) {
      if (i === 0) { filteredPoints.push(rawPoints[i]); continue; }
      const prev = filteredPoints[filteredPoints.length - 1];
      const d = getDistanceFromLatLonInKm(
        parseFloat(prev.latitude), parseFloat(prev.longitude),
        parseFloat(rawPoints[i].latitude), parseFloat(rawPoints[i].longitude)
      );
      if (d >= 0.04) {
        filteredPoints.push(rawPoints[i]);
      }
    }

    // If only 1 point remained after filtering but rawPoints had more, keep rawPoints
    const finalPoints = filteredPoints.length > 0 ? filteredPoints : rawPoints;

    const totalDistanceKm = calcRealDistance(finalPoints);
    const currentFee = totalDistanceKm * 5;

    return {
      visit,
      points: finalPoints,
      liveDistance: totalDistanceKm.toFixed(2),
      liveFee: currentFee.toFixed(2)
    };
  }

  static async deleteVisit(visitId) {
    // Also delete associated location history to maintain referential integrity
    await query(`DELETE FROM LocationHistory WHERE visit_id = ?`, [visitId]);
    await query(`DELETE FROM client_visits WHERE id = ?`, [visitId]);
  }
}

module.exports = ClientVisitService;
