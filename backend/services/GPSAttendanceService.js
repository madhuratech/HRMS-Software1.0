const db = require('../config/database');
const PunchLocationService = require('./PunchLocationService');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

class GPSAttendanceService {
  // Haversine formula to compute distance in meters
  static getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  static getLocalDateStr(date = new Date()) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
    } catch (e) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  static async resolveEmployeeId(employeeId, userEmail = null) {
    try {
      if (employeeId) {
        // 1. Direct match against employees table id
        const rows = await query("SELECT id FROM employees WHERE id = ?", [employeeId]);
        if (rows && rows.length > 0) return rows[0].id;

        // 2. If employeeId is a user table ID, resolve to employees table id via users.employee_id or users.email
        const userRows = await query("SELECT employee_id, email FROM users WHERE id = ?", [employeeId]);
        if (userRows && userRows.length > 0) {
          if (userRows[0].employee_id) {
            const empFromUser = await query("SELECT id FROM employees WHERE id = ?", [userRows[0].employee_id]);
            if (empFromUser && empFromUser.length > 0) return empFromUser[0].id;
          }
          if (userRows[0].email) {
            const empFromEmail = await query("SELECT id FROM employees WHERE email = ?", [userRows[0].email]);
            if (empFromEmail && empFromEmail.length > 0) return empFromEmail[0].id;
          }
        }
      }
      // 3. Resolve by user email
      if (userEmail) {
        const rows = await query("SELECT id FROM employees WHERE email = ?", [userEmail]);
        if (rows && rows.length > 0) return rows[0].id;
      }
    } catch (err) {
      console.error("Error resolving employee_id:", err.message);
    }
    return null;
  }

  static async validateAndRecordPunch(employeeId, data) {
    const { punchType, latitude, longitude, deviceInfo, browser, ipAddress, userEmail } = data;

    const validEmpId = await this.resolveEmployeeId(employeeId, userEmail);
    if (!validEmpId) {
      throw new Error("No valid employee record found in the system. Please create an employee profile first.");
    }
    employeeId = validEmpId;

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("Invalid GPS coordinates provided.");
    }

    // Get active office locations
    const activeLocations = await PunchLocationService.getActiveLocations();
    if (activeLocations.length === 0) {
      await this.logPunchAttempt(employeeId, punchType, lat, lng, 'No Office Location', 0, 'No', deviceInfo, browser, ipAddress, 'Failed', 'No active office locations configured.');
      throw new Error("Attendance settings error: No active office punch locations configured.");
    }

    let nearestLocation = null;
    let minDistance = Infinity;

    for (const loc of activeLocations) {
      const dist = this.getDistance(lat, lng, parseFloat(loc.latitude), parseFloat(loc.longitude));
      if (dist < minDistance) {
        minDistance = dist;
        nearestLocation = loc;
      }
    }

    // GPS Validation: Permitted radius check
    const insideRadius = minDistance <= (nearestLocation.radius || 300) ? 'Yes' : 'No';

    if (insideRadius === 'No') {
      await this.logPunchAttempt(employeeId, punchType, lat, lng, nearestLocation.name, minDistance, 'No', deviceInfo, browser, ipAddress, 'Failed', 'Outside allowed geofence radius.');
      throw new Error(`You are outside the permitted office location (${nearestLocation.name}). Distance: ${minDistance.toFixed(0)}m (Max allowed: ${nearestLocation.radius || 300}m).`);
    }

    const timestamp = new Date();
    const punchDate = this.getLocalDateStr(timestamp);

    // Log successful punch attempt
    await this.logPunchAttempt(employeeId, punchType, lat, lng, nearestLocation.name, minDistance, 'Yes', deviceInfo, browser, ipAddress, 'Success', null);

    // Fetch today's record for this employee
    const existing = await query(
      "SELECT * FROM GPSAttendance WHERE employee_id = ? AND (punch_date = ? OR DATE(check_in_time) = ? OR punch_date = CURDATE() OR DATE(check_in_time) = CURDATE()) ORDER BY id DESC LIMIT 1",
      [employeeId, punchDate, punchDate]
    );

    // Shift settings
    const SHIFT_START = "09:30:00";
    const SHIFT_END = "18:30:00";
    let nowTimeStr = '09:00:00';
    try {
      nowTimeStr = timestamp.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    } catch (e) {
      nowTimeStr = timestamp.toTimeString().split(' ')[0];
    }

    let recordId = null;
    let attendancePayload = null;

    if (punchType === 'IN') {
      if (existing.length > 0 && existing[0].check_in_time) {
        throw new Error("You are already punched in for today.");
      }

      // Check if late entry
      const isLate = nowTimeStr > SHIFT_START;
      const status = isLate ? 'Late Entry' : 'Present';

      if (existing.length === 0) {
        const sqlInsert = `
          INSERT INTO GPSAttendance (employee_id, punch_date, check_in_time, latitude_in, longitude_in, punch_in_location, status, late_entry)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertRes = await query(sqlInsert, [
          employeeId,
          punchDate,
          timestamp,
          lat,
          lng,
          nearestLocation.name,
          status,
          isLate ? 1 : 0
        ]);
        recordId = insertRes.insertId;
      } else {
        recordId = existing[0].id;
        const sqlUpdate = `
          UPDATE GPSAttendance
          SET check_in_time = ?, latitude_in = ?, longitude_in = ?, punch_in_location = ?, status = ?, late_entry = ?
          WHERE id = ?
        `;
        await query(sqlUpdate, [
          timestamp,
          lat,
          lng,
          nearestLocation.name,
          status,
          isLate ? 1 : 0,
          recordId
        ]);
      }

      const fmtInTime = timestamp.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      attendancePayload = {
        id: recordId,
        employee_id: employeeId,
        status: 'PUNCHED_IN',
        statusLabel: status,
        punchInTime: fmtInTime,
        checkInTimeRaw: timestamp,
        punchOutTime: null,
        checkOutTimeRaw: null,
        workingHours: '00h 00m',
        locationName: nearestLocation.name,
        distance: minDistance.toFixed(2),
        latitude: lat,
        longitude: lng,
        location_verified: true
      };
    } else if (punchType === 'OUT') {
      // Punch OUT
      if (existing.length === 0 || !existing[0].check_in_time) {
        throw new Error("You must punch in first before punching out.");
      }

      if (existing[0].check_out_time) {
        throw new Error("You have already checked out for today.");
      }

      recordId = existing[0].id;
      const checkInTime = new Date(existing[0].check_in_time);
      const diffMs = Math.max(0, timestamp - checkInTime);
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const workingHours = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

      // Check if early exit
      const isEarly = nowTimeStr < SHIFT_END;
      const status = isEarly ? 'Early Exit' : 'Completed';

      const sqlUpdate = `
        UPDATE GPSAttendance
        SET check_out_time = ?, latitude_out = ?, longitude_out = ?, punch_out_location = ?, working_hours = ?, status = ?, early_exit = ?
        WHERE id = ?
      `;
      await query(sqlUpdate, [
        timestamp,
        lat,
        lng,
        nearestLocation.name,
        workingHours,
        status,
        isEarly ? 1 : 0,
        recordId
      ]);

      const fmtInTime = new Date(existing[0].check_in_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const fmtOutTime = timestamp.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      attendancePayload = {
        id: recordId,
        employee_id: employeeId,
        status: 'PUNCHED_OUT',
        statusLabel: status,
        punchInTime: fmtInTime,
        punchOutTime: fmtOutTime,
        checkInTimeRaw: existing[0].check_in_time,
        checkOutTimeRaw: timestamp,
        workingHours: workingHours,
        locationName: nearestLocation.name,
        distance: minDistance.toFixed(2),
        latitude: lat,
        longitude: lng,
        location_verified: true
      };
    }

    // Sync to original log table for backward compatibility
    try {
      const sqlSync = `
        INSERT INTO attendance (employee_id, punch_type, punch_time, latitude, longitude)
        VALUES (?, ?, ?, ?, ?)
      `;
      await query(sqlSync, [employeeId, punchType, timestamp, lat, lng]);
    } catch (syncErr) {
      console.warn("Sync to attendance table skipped:", syncErr.message);
    }

    return {
      success: true,
      message: punchType === 'IN' ? 'Punch in successful' : 'Punch out successful',
      locationName: nearestLocation.name,
      distance: minDistance.toFixed(2),
      punchType,
      attendance: attendancePayload,
      todayRecord: attendancePayload
    };
  }

  static async logPunchAttempt(employeeId, punchType, lat, lng, locationName, distance, insideRadius, deviceInfo, browser, ipAddress, status, reason) {
    try {
      const validEmpId = await this.resolveEmployeeId(employeeId);
      if (!validEmpId) return;

      const sql = `
        INSERT INTO AttendanceLogs (employee_id, punch_type, latitude, longitude, location_name, distance, inside_radius, device_info, browser, ip_address, status, failure_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [validEmpId, punchType, lat, lng, locationName, distance, insideRadius, deviceInfo, browser, ipAddress, status, reason]);

      if (status === 'Success') {
        try {
          await query(`INSERT INTO LocationHistory (employee_id, latitude, longitude) VALUES (?, ?, ?)`, [validEmpId, lat, lng]);
        } catch (locErr) {
          console.warn("LocationHistory insert skipped:", locErr.message);
        }
      }
    } catch (err) {
      console.error("Error logging punch attempt:", err.message);
    }
  }

  static async getGPSDashboardStats(targetDate, allowedEmployeeIds = null) {
    const date = targetDate || this.getLocalDateStr();

    let empScopeClause = '';
    let empScopeParams = [date, date];
    let feedParams = [date, date];

    if (Array.isArray(allowedEmployeeIds)) {
      if (allowedEmployeeIds.length === 0) {
        return {
          kpis: { totalCheckins: 0, onSite: 0, remote: 0, activeGeofences: 0 },
          records: [],
          geofences: []
        };
      }
      empScopeClause = ' AND g.employee_id IN (?) ';
      empScopeParams.push(allowedEmployeeIds);
      feedParams.push(allowedEmployeeIds);
    }

    const statsRow = await query(`
      SELECT 
        COUNT(DISTINCT g.employee_id) as total_checkins,
        SUM(CASE WHEN g.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as onsite_checkins,
        0 as remote_checkins
      FROM GPSAttendance g
      JOIN employees e ON e.id = g.employee_id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE (g.punch_date = ? OR DATE(g.check_in_time) = ?) ${empScopeClause}
    `, empScopeParams);

    const geofenceCountRow = await query(`SELECT COUNT(*) as active_geofences FROM GeofenceLocations WHERE status = 'Active'`);

    const totalCheckins = (statsRow && statsRow[0] && statsRow[0].total_checkins) || 0;
    const onSite = (statsRow && statsRow[0] && statsRow[0].onsite_checkins) || 0;
    const remote = (statsRow && statsRow[0] && statsRow[0].remote_checkins) || 0;
    const activeGeofences = (geofenceCountRow && geofenceCountRow[0] && geofenceCountRow[0].active_geofences) || 0;

    const geofenceZones = await query(`
      SELECT 
        id, 
        name, 
        latitude as lat, 
        longitude as lng, 
        radius,
        (
          SELECT COUNT(DISTINCT g.employee_id)
          FROM GPSAttendance g
          WHERE (g.punch_date = ? OR DATE(g.check_in_time) = ?)
            AND (g.punch_in_location = GeofenceLocations.name OR g.punch_out_location = GeofenceLocations.name)
        ) as activeStaff
      FROM GeofenceLocations
      WHERE status = 'Active'
    `, [date, date]);

    let feedWhere = " WHERE (g.punch_date = ? OR DATE(g.check_in_time) = ?) ";
    if (Array.isArray(allowedEmployeeIds)) {
      feedWhere += ' AND g.employee_id IN (?) ';
    }

    const sqlFeed = `
      SELECT 
        g.employee_id,
        e.name,
        e.profile_photo as avatar,
        d.dept_name as dept,
        COALESCE(g.punch_out_location, g.punch_in_location, 'Main Headquarters - Coimbatore') as location,
        COALESCE(g.latitude_out, g.latitude_in) as lat,
        COALESCE(g.longitude_out, g.longitude_in) as lng,
        g.check_in_time,
        g.check_out_time,
        g.working_hours,
        g.status as attendance_status
      FROM GPSAttendance g
      JOIN employees e ON e.id = g.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      ${feedWhere}
      ORDER BY g.created_at DESC
    `;
    const rows = await query(sqlFeed, feedParams);

    const records = rows.map(r => {
      const fmt = t => t ? new Date(t).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : '--';
      const lat = r.lat ? parseFloat(r.lat).toFixed(4) : null;
      const lng = r.lng ? parseFloat(r.lng).toFixed(4) : null;
      return {
        employee_id: r.employee_id,
        name: r.name,
        dept: r.dept || 'General',
        avatar: r.avatar ? `/${r.avatar}` : null,
        location: r.location || 'Main Headquarters - Coimbatore',
        checkIn: fmt(r.check_in_time),
        checkOut: fmt(r.check_out_time),
        workingHours: r.working_hours || (r.check_in_time && !r.check_out_time ? 'Punched In' : '--'),
        attendanceStatus: r.attendance_status || (r.check_out_time ? 'Completed' : 'Present'),
        coordinates: lat && lng ? `${lat}° N, ${lng}° E` : 'N/A',
        lat: r.lat ? parseFloat(r.lat) : null,
        lng: r.lng ? parseFloat(r.lng) : null,
        status: 'On-Site',
        distance: '0.00'
      };
    });

    return {
      kpis: {
        totalCheckins,
        onSite,
        remote,
        activeGeofences
      },
      records,
      geofences: geofenceZones.map(z => ({
        id: z.id,
        name: z.name,
        lat: parseFloat(z.lat),
        lng: parseFloat(z.lng),
        radius: parseInt(z.radius),
        activeStaff: parseInt(z.activeStaff)
      }))
    };
  }

  static async getGPSReportData(filters = {}) {
    const { startDate, endDate, employeeId } = filters;
    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND l.punch_time >= ?';
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      where += ' AND l.punch_time <= ?';
      params.push(`${endDate} 23:59:59`);
    }
    if (employeeId) {
      where += ' AND l.employee_id = ?';
      params.push(employeeId);
    }

    const sql = `
      SELECT 
        l.id,
        l.employee_id,
        e.name as employee_name,
        l.punch_type,
        l.punch_time,
        l.latitude,
        l.longitude,
        l.location_name,
        l.distance,
        l.inside_radius,
        l.status,
        l.device_info,
        l.browser,
        l.ip_address
      FROM AttendanceLogs l
      JOIN employees e ON e.id = l.employee_id
      LEFT JOIN departments d ON e.department_id = d.id
      ${where}
      ORDER BY l.punch_time DESC
    `;
    return await query(sql, params);
  }
}

module.exports = GPSAttendanceService;
