const db = require("../config/database");
const GPSAttendanceService = require("../services/GPSAttendanceService");
const PunchLocationService = require("../services/PunchLocationService");
const PDFDocument = require("pdfkit");

const DataScopeService = require("../services/DataScopeService");

// Original endpoint for backward compatibility, updated to use GPS geofence validation
exports.punch = async (req, res) => {
  try {
    let rawEmpId = req.headers['x-employee-id'] || req.body.employee_id || (req.user && (req.user.employeeId || req.user.employee_id || req.user.userId || req.user.id));
    const userEmail = req.user && req.user.email;
    const employeeId = await GPSAttendanceService.resolveEmployeeId(rawEmpId, userEmail);

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Could not identify valid employee profile for the current user." });
    }

    const { punch_type, latitude, longitude, device_info, browser, ip_address } = req.body;

    if (!punch_type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields (punch_type, latitude, longitude)" });
    }

    const punchData = {
      punchType: punch_type,
      latitude,
      longitude,
      deviceInfo: device_info || req.headers['user-agent'] || 'Unknown',
      browser: browser || 'Unknown',
      ipAddress: ip_address || req.ip || 'Unknown',
      userEmail: userEmail
    };

    const result = await GPSAttendanceService.validateAndRecordPunch(employeeId, punchData);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Punch error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRecent = async (req, res) => {
  try {
    let rawEmpId = req.params?.employee_id || req.query?.employee_id || req.headers?.['x-employee-id'] || (req.user && (req.user.employeeId || req.user.employee_id || req.user.userId || req.user.id));
    const userEmail = req.user && req.user.email;
    const validEmpId = await GPSAttendanceService.resolveEmployeeId(rawEmpId, userEmail);

    if (!validEmpId) {
      return res.json([]);
    }

    const todayStr = GPSAttendanceService.getLocalDateStr();

    // 1. Fetch GPSAttendance sessions
    const sessions = await new Promise((resolve) => {
      const sql = `
        SELECT 
          id,
          employee_id,
          punch_date,
          check_in_time,
          check_out_time,
          working_hours,
          status,
          punch_in_location,
          punch_out_location,
          late_entry,
          early_exit
        FROM GPSAttendance
        WHERE employee_id = ?
        ORDER BY punch_date DESC, check_in_time DESC
        LIMIT 10
      `;
      db.query(sql, [validEmpId], (err, rows) => {
        if (err) return resolve([]);
        resolve(rows || []);
      });
    });

    // 2. Fetch raw attendance punches
    const rawPunches = await new Promise((resolve) => {
      const sql = `
        SELECT id, employee_id, punch_type, punch_time, latitude, longitude
        FROM attendance
        WHERE employee_id = ?
        ORDER BY punch_time DESC
        LIMIT 15
      `;
      db.query(sql, [validEmpId], (err, rows) => {
        if (err) return resolve([]);
        resolve(rows || []);
      });
    });

    // Format rich session list
    const formattedSessions = sessions.map(s => {
      let dateLabel = 'Past Day';
      if (s.punch_date) {
        const pDateStr = GPSAttendanceService.getLocalDateStr(s.punch_date);
        if (pDateStr === todayStr) {
          dateLabel = 'Today';
        } else {
          dateLabel = new Date(s.punch_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }

      const inTime = s.check_in_time 
        ? new Date(s.check_in_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) 
        : '--';
      const outTime = s.check_out_time 
        ? new Date(s.check_out_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) 
        : '--';

      let statusBadge = s.status || (s.check_out_time ? 'Completed' : 'Checked In');
      if (s.check_in_time && !s.check_out_time) {
        statusBadge = 'Checked In';
      }

      let workingHoursDisplay = s.working_hours || '--';
      if (s.check_in_time && !s.check_out_time) {
        const diffMs = Math.max(0, new Date() - new Date(s.check_in_time));
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        workingHoursDisplay = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
      }

      return {
        id: s.id,
        date: dateLabel,
        dateRaw: s.punch_date || s.check_in_time,
        checkIn: inTime,
        checkOut: outTime,
        workingHours: workingHoursDisplay,
        location: s.punch_in_location || 'Office / Geo-fenced',
        status: statusBadge,
        isToday: dateLabel === 'Today',
        punch_type: s.check_out_time ? 'OUT' : 'IN',
        punch_time: s.check_out_time || s.check_in_time
      };
    });

    return res.status(200).json(formattedSessions);
  } catch (error) {
    console.error("Fetch recent failed:", error);
    return res.status(500).json({ message: "Fetch failed", error: error.message });
  }
};

exports.getDailyStats = async (req, res) => {
  try {
    const scopeData = await DataScopeService.getScope(req);
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    let scopeClause = '';
    let queryParams = [targetDate, targetDate, targetDate];

    if (!scopeData.isUnrestricted && Array.isArray(scopeData.allowedEmployeeIds)) {
      if (scopeData.allowedEmployeeIds.length === 0) {
        return res.json({
          kpis: { totalEmployees: 0, present: 0, presentPct: '0.00%', absent: 0, absentPct: '0.00%', late: 0, latePct: '0.00%', leave: 0, leavePct: '0.00%' },
          records: []
        });
      }
      scopeClause = ' AND e.id IN (?)';
      queryParams = [targetDate, targetDate, scopeData.allowedEmployeeIds, targetDate];
    }

    const sql = `
      SELECT 
        e.id,
        e.name,
        e.profile_photo as avatar,
        d.dept_name as department,
        MIN(CASE WHEN a.punch_type = 'IN' THEN a.punch_time END) as check_in_time,
        MAX(CASE WHEN a.punch_type = 'OUT' THEN a.punch_time END) as check_out_time,
        (
          SELECT COUNT(*) 
          FROM leave_applications la 
          WHERE la.employee_id = e.id 
            AND la.status = 'Approved' 
            AND ? BETWEEN la.start_date AND la.end_date
        ) as on_leave
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance a ON a.employee_id = e.id AND DATE(a.punch_time) = ?
      WHERE e.status = 'Active'${scopeClause}
      GROUP BY e.id, e.name, e.profile_photo, d.dept_name
    `;

    db.query(sql, queryParams, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to load daily attendance stats", error: err.message });
    }

    const records = rows.map(row => {
      let status = 'Absent';
      let checkIn = '--';
      let checkOut = '--';
      let workingHours = '00h 00m';

      if (row.check_in_time) {
        const checkInDate = new Date(row.check_in_time);

        checkIn = checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const checkInHour = checkInDate.getHours();
        const checkInMin = checkInDate.getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMin > 15)) {
          status = 'Late';
        } else {
          status = 'Present';
        }

        if (row.check_out_time) {
          const checkOutDate = new Date(row.check_out_time);
          checkOut = checkOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

          const diffMs = checkOutDate - checkInDate;
          if (diffMs > 0) {
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            workingHours = `${String(diffHrs).padStart(2, '0')}h ${String(diffMins).padStart(2, '0')}m`;
          }
        }
      } else if (row.on_leave > 0) {
        status = 'On Leave';
      }

      return {
        id: `EMP${String(row.id).padStart(3, '0')}`,
        db_id: row.id,
        name: row.name,
        avatar: row.avatar ? `/${row.avatar}` : null,
        department: row.department || 'General',
        checkIn,
        checkOut,
        status,
        workingHours
      };
    });

    const totalEmployees = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const leave = records.filter(r => r.status === 'On Leave').length;
    const absent = records.filter(r => r.status === 'Absent').length;

    const formatPct = (val) => totalEmployees > 0 ? `${((val / totalEmployees) * 100).toFixed(2)}%` : '0.00%';

      res.json({
        kpis: {
          totalEmployees,
          present: present + late,
          presentPct: formatPct(present + late),
          absent,
          absentPct: formatPct(absent),
          late,
          latePct: formatPct(late),
          leave,
          leavePct: formatPct(leave)
        },
        records
      });
    });
  } catch (err) {
    console.error('getDailyStats error:', err);
    return res.status(500).json({ message: "Failed to load daily attendance stats", error: err.message });
  }
};

exports.getGPSFeed = async (req, res) => {
  try {
    const scopeData = await DataScopeService.getScope(req);
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const data = await GPSAttendanceService.getGPSDashboardStats(targetDate, scopeData.allowedEmployeeIds);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    console.error("GPS feed error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// LOCATION MASTER ENDPOINTS
// ==========================================

exports.getPunchLocations = async (req, res) => {
  try {
    const data = await PunchLocationService.getLocations(req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPunchLocationById = async (req, res) => {
  try {
    const location = await PunchLocationService.getLocationById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: "Punch Location not found" });
    }
    return res.status(200).json({ success: true, location });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPunchLocation = async (req, res) => {
  try {
    const location = await PunchLocationService.createLocation(req.body);
    return res.status(201).json({ success: true, location });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updatePunchLocation = async (req, res) => {
  try {
    const location = await PunchLocationService.updateLocation(req.params.id, req.body);
    return res.status(200).json({ success: true, location });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deletePunchLocation = async (req, res) => {
  try {
    await PunchLocationService.deleteLocation(req.params.id);
    return res.status(200).json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.togglePunchLocationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const result = await PunchLocationService.toggleStatus(req.params.id, status);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// REPORTS & EXPORTS
// ==========================================

exports.getGPSReport = async (req, res) => {
  try {
    const logs = await GPSAttendanceService.getGPSReportData(req.query);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportGPSReportPDF = async (req, res) => {
  try {
    const logs = await GPSAttendanceService.getGPSReportData(req.query);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=gps_attendance_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("GPS Geofence Attendance Report", { align: 'center' }).moveDown();
    doc.fontSize(10).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' }).moveDown();

    // Table Headers
    const headers = ["Employee", "Date & Time", "Punch", "Location", "Distance", "Inside Geofence", "Status"];
    const colWidths = [100, 100, 50, 100, 60, 60, 50];
    const startX = 30;
    let currentY = doc.y;

    // Draw header text
    doc.fontSize(9).font('Helvetica-Bold');
    let tempX = startX;
    headers.forEach((h, i) => {
      doc.text(h, tempX, currentY, { width: colWidths[i], align: 'left' });
      tempX += colWidths[i];
    });

    doc.moveTo(startX, currentY + 12).lineTo(560, currentY + 12).stroke();
    currentY += 18;

    // Draw rows
    doc.font('Helvetica');
    logs.forEach(log => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
      }
      const timeStr = new Date(log.punch_time).toLocaleString();
      const distStr = log.distance ? `${parseFloat(log.distance).toFixed(1)}m` : '0m';

      const rowValues = [
        log.employee_name,
        timeStr,
        log.punch_type,
        log.location_name || 'N/A',
        distStr,
        log.inside_radius || 'N/A',
        log.status
      ];

      let cellX = startX;
      rowValues.forEach((val, idx) => {
        doc.text(val.toString(), cellX, currentY, { width: colWidths[idx], align: 'left' });
        cellX += colWidths[idx];
      });

      doc.moveTo(startX, currentY + 10).lineTo(560, currentY + 10).strokeColor('#e5e7eb').stroke();
      currentY += 16;
    });

    doc.end();
  } catch (error) {
    console.error("PDF Export error:", error);
    return res.status(500).send("Failed to export PDF report");
  }
};

exports.exportGPSReportExcel = async (req, res) => {
  try {
    const logs = await GPSAttendanceService.getGPSReportData(req.query);

    // Build CSV content
    const headers = ["Employee ID", "Employee Name", "Punch Type", "Punch Time", "Latitude", "Longitude", "Location Name", "Distance (m)", "Inside Radius", "Device Info", "Browser", "IP Address", "Status", "Failure Reason"];
    const rows = logs.map(log => [
      log.employee_id,
      `"${log.employee_name.replace(/"/g, '""')}"`,
      log.punch_type,
      new Date(log.punch_time).toISOString(),
      log.latitude,
      log.longitude,
      `"${(log.location_name || '').replace(/"/g, '""')}"`,
      log.distance ? parseFloat(log.distance).toFixed(2) : 0,
      log.inside_radius,
      `"${(log.device_info || '').replace(/"/g, '""')}"`,
      log.browser,
      log.ip_address,
      log.status,
      `"${(log.failure_reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=gps_attendance_report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Excel Export error:", error);
    return res.status(500).send("Failed to export Excel report");
  }
};

exports.getTodayStatus = async (req, res) => {
  try {
    let rawEmpId = req.params?.employee_id || req.query?.employee_id || req.headers?.['x-employee-id'] || (req.user && (req.user.employeeId || req.user.employee_id || req.user.userId || req.user.id));
    const userEmail = req.user && req.user.email;
    const validEmpId = await GPSAttendanceService.resolveEmployeeId(rawEmpId, userEmail);

    if (!validEmpId) {
      return res.status(200).json({ success: true, status: 'NOT_PUNCHED', statusLabel: 'Ready to Check In', attendance: null });
    }

    const todayStr = GPSAttendanceService.getLocalDateStr();
    const now = new Date();

    // 1. Query GPSAttendance table
    let gpsRows = await new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM GPSAttendance 
        WHERE employee_id = ? 
          AND (punch_date = ? OR DATE(check_in_time) = ? OR punch_date = CURDATE() OR DATE(check_in_time) = CURDATE())
        ORDER BY id DESC LIMIT 1
      `;
      db.query(sql, [validEmpId, todayStr, todayStr], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    if (gpsRows.length > 0) {
      const rec = gpsRows[0];
      const inTimeStr = rec.check_in_time 
        ? new Date(rec.check_in_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) 
        : null;
      const outTimeStr = rec.check_out_time 
        ? new Date(rec.check_out_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) 
        : null;

      if (rec.check_in_time && !rec.check_out_time) {
        const checkInDate = new Date(rec.check_in_time);
        const diffMs = Math.max(0, now - checkInDate);
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const workingHoursElapsed = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

        const payload = {
          id: rec.id,
          employee_id: validEmpId,
          status: 'PUNCHED_IN',
          statusLabel: rec.status || 'Present',
          punchInTime: inTimeStr,
          punchOutTime: null,
          checkInTimeRaw: rec.check_in_time,
          checkOutTimeRaw: null,
          workingHours: workingHoursElapsed,
          locationName: rec.punch_in_location || 'Office / Geo-fenced',
          latitude: rec.latitude_in,
          longitude: rec.longitude_in,
          location_verified: true
        };

        return res.status(200).json({
          success: true,
          ...payload,
          attendance: payload
        });
      } else if (rec.check_in_time && rec.check_out_time) {
        let calcHours = rec.working_hours;
        if (!calcHours || calcHours === '0h 0m' || calcHours.includes('undefined')) {
          const diffMs = Math.max(0, new Date(rec.check_out_time) - new Date(rec.check_in_time));
          const hrs = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          calcHours = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
        }

        const payload = {
          id: rec.id,
          employee_id: validEmpId,
          status: 'PUNCHED_OUT',
          statusLabel: rec.status || 'Completed',
          punchInTime: inTimeStr,
          punchOutTime: outTimeStr,
          checkInTimeRaw: rec.check_in_time,
          checkOutTimeRaw: rec.check_out_time,
          workingHours: calcHours,
          locationName: rec.punch_out_location || rec.punch_in_location || 'Office / Geo-fenced',
          latitude: rec.latitude_out || rec.latitude_in,
          longitude: rec.longitude_out || rec.longitude_in,
          location_verified: true
        };

        return res.status(200).json({
          success: true,
          ...payload,
          attendance: payload
        });
      }
    }

    // 2. Query attendance table
    let attRows = await new Promise((resolve, reject) => {
      const sql = `
        SELECT punch_type, punch_time, latitude, longitude
        FROM attendance 
        WHERE employee_id = ? AND (DATE(punch_time) = ? OR DATE(punch_time) = CURDATE())
        ORDER BY punch_time ASC
      `;
      db.query(sql, [validEmpId, todayStr], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    if (attRows.length > 0) {
      const inPunch = attRows.find(r => r.punch_type === 'IN');
      const outPunch = attRows.filter(r => r.punch_type === 'OUT').pop();

      if (inPunch && !outPunch) {
        const inTimeStr = new Date(inPunch.punch_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        const checkInDate = new Date(inPunch.punch_time);
        const diffMs = Math.max(0, now - checkInDate);
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const workingHoursElapsed = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

        const payload = {
          id: inPunch.id || 0,
          employee_id: validEmpId,
          status: 'PUNCHED_IN',
          statusLabel: 'Present',
          punchInTime: inTimeStr,
          punchOutTime: null,
          checkInTimeRaw: inPunch.punch_time,
          checkOutTimeRaw: null,
          workingHours: workingHoursElapsed,
          locationName: 'Office / Geo-fenced',
          latitude: inPunch.latitude,
          longitude: inPunch.longitude,
          location_verified: true
        };

        return res.status(200).json({
          success: true,
          ...payload,
          attendance: payload
        });
      } else if (inPunch && outPunch) {
        const inTimeStr = new Date(inPunch.punch_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        const outTimeStr = new Date(outPunch.punch_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        const diffMs = Math.max(0, new Date(outPunch.punch_time) - new Date(inPunch.punch_time));
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const calcHours = `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

        const payload = {
          id: outPunch.id || 0,
          employee_id: validEmpId,
          status: 'PUNCHED_OUT',
          statusLabel: 'Completed',
          punchInTime: inTimeStr,
          punchOutTime: outTimeStr,
          checkInTimeRaw: inPunch.punch_time,
          checkOutTimeRaw: outPunch.punch_time,
          workingHours: calcHours,
          locationName: 'Office / Geo-fenced',
          latitude: outPunch.latitude,
          longitude: outPunch.longitude,
          location_verified: true
        };

        return res.status(200).json({
          success: true,
          ...payload,
          attendance: payload
        });
      }
    }

    return res.status(200).json({
      success: true,
      status: 'NOT_PUNCHED',
      statusLabel: 'Ready to Check In',
      attendance: null
    });
  } catch (error) {
    console.error("Failed to get today status:", error);
    return res.status(500).json({ success: false, message: "Internal server error fetching today's status" });
  }
};

exports.updateAttendanceRecord = async (req, res) => {
  try {
    const scopeData = await DataScopeService.getScope(req);
    const { employeeId, date } = req.params;
    const targetEmpId = parseInt(employeeId);

    if (!employeeId || !date) {
      return res.status(400).json({ success: false, message: "Missing employee ID or date" });
    }

    const validEmpId = await GPSAttendanceService.resolveEmployeeId(employeeId);
    if (!validEmpId) {
      return res.status(404).json({ success: false, message: "No valid employee record found in the database." });
    }

    if (!scopeData.isUnrestricted && Array.isArray(scopeData.allowedEmployeeIds)) {
      if (!scopeData.allowedEmployeeIds.includes(targetEmpId)) {
        return res.status(403).json({ success: false, message: "Permission Denied: You cannot modify attendance records for employees outside your authorized data scope." });
      }
    }

    const { checkInTime, checkOutTime, status, workingHours } = req.body;
    const checkInTimestamp = checkInTime ? new Date(`${date} ${checkInTime}`) : null;
    const checkOutTimestamp = checkOutTime ? new Date(`${date} ${checkOutTime}`) : null;

    const existing = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM GPSAttendance WHERE employee_id = ? AND punch_date = ?", [validEmpId, date], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    if (existing.length === 0) {
      const sqlInsert = `
        INSERT INTO GPSAttendance (employee_id, punch_date, check_in_time, check_out_time, working_hours, status, latitude_in, longitude_in, punch_in_location)
        VALUES (?, ?, ?, ?, ?, ?, 11.013011, 76.956732, 'Main Headquarters')
      `;
      await new Promise((resolve, reject) => {
        db.query(sqlInsert, [validEmpId, date, checkInTimestamp, checkOutTimestamp, workingHours || '08h 00m', status || 'Present'], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    } else {
      const sqlUpdate = `
        UPDATE GPSAttendance
        SET check_in_time = ?, check_out_time = ?, working_hours = ?, status = ?
        WHERE employee_id = ? AND punch_date = ?
      `;
      await new Promise((resolve, reject) => {
        db.query(sqlUpdate, [checkInTimestamp, checkOutTimestamp, workingHours || '08h 00m', status || 'Present', validEmpId, date], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    }

    await new Promise((resolve, reject) => {
      db.query("DELETE FROM attendance WHERE employee_id = ? AND DATE(punch_time) = ?", [validEmpId, date], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (checkInTimestamp) {
      await new Promise((resolve, reject) => {
        db.query("INSERT INTO attendance (employee_id, punch_type, punch_time, latitude, longitude) VALUES (?, 'IN', ?, 11.013011, 76.956732)", [validEmpId, checkInTimestamp], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    }
    if (checkOutTimestamp) {
      await new Promise((resolve, reject) => {
        db.query("INSERT INTO attendance (employee_id, punch_type, punch_time, latitude, longitude) VALUES (?, 'OUT', ?, 11.013011, 76.956732)", [validEmpId, checkOutTimestamp], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    }

    return res.status(200).json({ success: true, message: "Attendance record updated successfully!" });
  } catch (error) {
    console.error("Failed to update attendance record:", error);
    return res.status(500).json({ success: false, message: "Internal server error updating attendance record" });
  }
};

exports.deleteAttendanceRecord = async (req, res) => {
  try {
    const scopeData = await DataScopeService.getScope(req);
    const { employeeId, date } = req.params;
    const targetEmpId = parseInt(employeeId);

    if (!employeeId || !date) {
      return res.status(400).json({ success: false, message: "Missing employee ID or date" });
    }

    if (!scopeData.isUnrestricted && Array.isArray(scopeData.allowedEmployeeIds)) {
      if (!scopeData.allowedEmployeeIds.includes(targetEmpId)) {
        return res.status(403).json({ success: false, message: "Permission Denied: You cannot delete attendance records for employees outside your authorized data scope." });
      }
    }

    await Promise.all([
      new Promise((resolve, reject) => {
        db.query("DELETE FROM GPSAttendance WHERE employee_id = ? AND punch_date = ?", [employeeId, date], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("DELETE FROM attendance WHERE employee_id = ? AND DATE(punch_time) = ?", [employeeId, date], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      })
    ]);

    return res.status(200).json({ success: true, message: "Attendance record deleted successfully!" });
  } catch (error) {
    console.error("Failed to delete attendance record:", error);
    return res.status(500).json({ success: false, message: "Internal server error deleting attendance record" });
  }
};
