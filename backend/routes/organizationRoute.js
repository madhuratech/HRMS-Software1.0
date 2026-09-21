const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authenticateJWT, checkPermission } = require("../middlewares/auth");

/**
 * DEPARTMENTS CRUD
 */
router.get("/departments", authenticateJWT, checkPermission("organization", "departments", "view"), (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.dept_name as name,
      COALESCE(d.code, CONCAT('DEPT-', LPAD(d.id, 2, '0'))) as code,
      COALESCE(e.name, 'Unassigned') as headName,
      IF(e.name IS NOT NULL, 'Department Manager', 'Unassigned') as headRole,
      e.profile_photo as headAvatar,
      d.branch,
      (SELECT COUNT(*) FROM employees e2 WHERE e2.department_id = d.id AND e2.status = 'Active') as employees,
      COALESCE(d.createdDate, DATE_FORMAT(NOW(), '%d %b %Y')) as createdDate,
      COALESCE(d.createdDate, DATE_FORMAT(NOW(), '%d %b %Y')) as updatedDate,
      COALESCE(d.status, 'Active') as status,
      d.email,
      d.phone,
      d.extension,
      d.location,
      d.parentDepartment,
      d.description
    FROM departments d
    LEFT JOIN employees e ON d.manager_id = e.id AND e.status = 'Active'
    ORDER BY d.id ASC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.post("/departments", authenticateJWT, checkPermission("organization", "departments", "create"), (req, res) => {
  const { name, code, headName, branch, email, phone, extension, location, parentDepartment, description, status } = req.body;
  const sql = `
    INSERT INTO departments (dept_name, code, branch, status, email, phone, extension, location, parentDepartment, description, manager_id, createdDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM employees WHERE name = ? LIMIT 1), DATE_FORMAT(NOW(), '%d %b %Y'))
  `;
  db.query(sql, [name, code, branch || 'Chennai', status || 'Active', email, phone, extension, location, parentDepartment, description, headName], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department created successfully", id: result.insertId });
  });
});

router.put("/departments/:id", authenticateJWT, checkPermission("organization", "departments", "edit"), (req, res) => {
  const { id } = req.params;
  const { name, code, headName, branch, status, email, phone, extension, location, parentDepartment, description } = req.body;
  const sql = `
    UPDATE departments
    SET dept_name = ?, code = ?, branch = ?, status = ?, email = ?, phone = ?, extension = ?, location = ?, parentDepartment = ?, description = ?,
        manager_id = (SELECT id FROM employees WHERE name = ? LIMIT 1)
    WHERE id = ?
  `;
  db.query(sql, [name, code, branch || 'Chennai', status || 'Active', email, phone, extension, location, parentDepartment, description, headName, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department updated successfully" });
  });
});

router.delete("/departments/:id", authenticateJWT, checkPermission("organization", "departments", "delete"), (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM departments WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department deleted successfully" });
  });
});

/**
 * DESIGNATIONS CRUD
 */
router.get("/designations", authenticateJWT, checkPermission("organization", "designations", "view"), (req, res) => {
  const sql = `
    SELECT 
      des.id,
      des.role_name as name,
      des.role_code as code,
      des.department,
      des.reportsTo,
      des.grade,
      des.level,
      (SELECT COUNT(*) FROM employees e WHERE e.designation_id = des.id AND e.status = 'Active') as employees,
      COALESCE(des.createdDate, DATE_FORMAT(NOW(), '%d %b %Y')) as createdDate,
      COALESCE(des.status, 'Active') as status,
      des.description
    FROM designations des
    ORDER BY des.id ASC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.post("/designations", authenticateJWT, checkPermission("organization", "designations", "create"), (req, res) => {
  const { name, code, department, reportsTo, grade, level, status, description } = req.body;
  const sql = `
    INSERT INTO designations (role_name, role_code, department, reportsTo, grade, level, status, description, createdDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_FORMAT(NOW(), '%d %b %Y'))
  `;
  db.query(sql, [name, code, department, reportsTo, grade, level, status || 'Active', description], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Designation created successfully", id: result.insertId });
  });
});

router.put("/designations/:id", authenticateJWT, checkPermission("organization", "designations", "edit"), (req, res) => {
  const { id } = req.params;
  const { name, code, department, reportsTo, grade, level, status, description } = req.body;
  const sql = `
    UPDATE designations
    SET role_name = ?, role_code = ?, department = ?, reportsTo = ?, grade = ?, level = ?, status = ?, description = ?
    WHERE id = ?
  `;
  db.query(sql, [name, code, department, reportsTo, grade, level, status, description, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Designation updated successfully" });
  });
});

router.delete("/designations/:id", authenticateJWT, checkPermission("organization", "designations", "delete"), (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM designations WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Designation deleted successfully" });
  });
});

const PDFDocument = require("pdfkit");

function mapRowToProfile(row) {
  return {
    general: {
      companyName: row.company_name,
      legalCompanyName: row.legal_company_name,
      companyCode: row.company_code,
      companyType: row.company_type,
      industry: row.industry,
      businessType: row.business_type,
      yearEstablished: row.year_established,
      numberOfEmployees: row.number_of_employees,
      financialYear: row.financial_year
    },
    contact: {
      officialEmail: row.official_email,
      hrEmail: row.hr_email,
      supportEmail: row.support_email,
      website: row.website,
      phoneNumber: row.phone_number,
      mobileNumber: row.mobile_number,
      alternateNumber: row.alternate_number,
      faxNumber: row.fax_number,
      linkedinUrl: row.linkedin_url,
      facebookUrl: row.facebook_url,
      twitterUrl: row.twitter_url,
      instagramUrl: row.instagram_url
    },
    address: {
      headOfficeAddress1: row.head_office_address1,
      headOfficeAddress2: row.head_office_address2,
      headOfficeLandmark: row.head_office_landmark,
      headOfficeCity: row.head_office_city,
      headOfficeState: row.head_office_state,
      headOfficeCountry: row.head_office_country,
      headOfficeZipCode: row.head_office_zip_code,
      headOfficeGoogleMapsUrl: row.head_office_google_maps_url,
      branchName: row.branch_name,
      branchAddress: row.branch_address,
      branchCity: row.branch_city,
      branchState: row.branch_state,
      branchCountry: row.branch_country,
      branchZipCode: row.branch_zip_code
    },
    business: {
      gstNumber: row.gst_number,
      panNumber: row.pan_number,
      cinNumber: row.cin_number,
      tanNumber: row.tan_number,
      msmeNumber: row.msme_number,
      iecCode: row.iec_code,
      pfRegistrationNumber: row.pf_registration_number,
      esiRegistrationNumber: row.esi_registration_number,
      professionalTaxNumber: row.professional_tax_number,
      labourLicenseNumber: row.labour_license_number,
      shopEstablishmentNumber: row.shop_establishment_number
    },
    hrSettings: {
      employeeIdPrefix: row.employee_id_prefix,
      autoGenerateEmployeeId: row.auto_generate_employee_id,
      defaultDepartment: row.default_department,
      defaultDesignation: row.default_designation,
      probationPeriod: row.probation_period,
      noticePeriod: row.notice_period,
      defaultShift: row.default_shift,
      workingDays: row.working_days,
      weekendPolicy: row.weekend_policy,
      attendanceMethod: row.attendance_method,
      biometricEnabled: Boolean(row.biometric_enabled),
      overtimeEnabled: Boolean(row.overtime_enabled),
      leaveCarryForward: Boolean(row.leave_carry_forward)
    },
    payroll: {
      payrollFrequency: row.payroll_frequency,
      salaryCycle: row.salary_cycle,
      salaryPaymentDate: row.salary_payment_date,
      basicSalaryPct: row.basic_salary_pct,
      hraPct: row.hra_pct,
      pfEnabled: Boolean(row.pf_enabled),
      esiEnabled: Boolean(row.esi_enabled),
      professionalTax: Boolean(row.professional_tax),
      tdsEnabled: Boolean(row.tds_enabled),
      bonusEnabled: Boolean(row.bonus_enabled),
      gratuityEnabled: Boolean(row.gratuity_enabled),
      payrollApproval: row.payroll_approval
    },
    banking: {
      bankName: row.bank_name,
      branchName: row.bank_branch_name,
      accountHolderName: row.account_holder_name,
      accountNumber: row.account_number,
      confirmAccountNumber: row.confirm_account_number,
      ifscCode: row.ifsc_code,
      swiftCode: row.swift_code,
      micrCode: row.micr_code,
      upiId: row.upi_id,
      salaryPaymentMethod: row.salary_payment_method
    },
    branding: {
      companyThemeColor: row.company_theme_color,
      secondaryThemeColor: row.secondary_theme_color,
      companyLogoName: row.company_logo_name,
      faviconName: row.favicon_name,
      loginBgName: row.login_bg_name,
      dashboardBannerName: row.dashboard_banner_name,
      emailHeaderLogoName: row.email_header_logo_name,
      emailFooterLogoName: row.email_footer_logo_name,
      companySealName: row.company_seal_name,
      digitalSignatureName: row.digital_signature_name
    },
    documents: row.documents ? JSON.parse(row.documents) : {
      gstCertificate: null,
      panCard: null,
      cinCertificate: null,
      incorporationCertificate: null,
      pfCertificate: null,
      esiCertificate: null,
      labourLicense: null,
      isoCertificate: null,
      companyPolicies: null,
      employeeHandbook: null
    },
    systemSettings: {
      language: row.language,
      timeZone: row.time_zone,
      currency: row.currency,
      dateFormat: row.date_format,
      timeFormat: row.time_format,
      passwordPolicy: row.password_policy,
      twoFactorAuthentication: Boolean(row.two_factor_authentication),
      sessionTimeout: row.session_timeout,
      loginAttempts: row.login_attempts,
      emailNotification: Boolean(row.email_notification),
      smsNotification: Boolean(row.sms_notification),
      pushNotification: Boolean(row.push_notification),
      smtp: row.smtp,
      smsGateway: row.sms_gateway,
      googleWorkspace: row.google_workspace,
      microsoft365: row.microsoft_365,
      biometricDevice: row.biometric_device
    }
  };
}

/**
 * GET COMPANY PROFILE
 */
router.get("/profile", (req, res) => {
  const sql = "SELECT * FROM company_profile WHERE id = 1";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch profile", details: err });
    if (!rows || rows.length === 0) {
      db.query("INSERT IGNORE INTO company_profile (id, company_name) VALUES (1, 'Hawkeye Nest Technologies Pvt Ltd')", () => {
        db.query("SELECT * FROM company_profile WHERE id = 1", (err2, rows2) => {
          if (rows2 && rows2.length > 0) {
            return res.json(mapRowToProfile(rows2[0]));
          }
          return res.json(mapRowToProfile({}));
        });
      });
      return;
    }
    res.json(mapRowToProfile(rows[0]));
  });
});

/**
 * UPDATE COMPANY PROFILE
 */
router.put("/profile", authenticateJWT, checkPermission("organization", "company_profile", "edit"), (req, res) => {
  const p = req.body;
  const sql = `
    UPDATE company_profile
    SET 
      company_name = ?, legal_company_name = ?, company_code = ?, company_type = ?, industry = ?, business_type = ?, year_established = ?, number_of_employees = ?, financial_year = ?,
      official_email = ?, hr_email = ?, support_email = ?, website = ?, phone_number = ?, mobile_number = ?, alternate_number = ?, fax_number = ?, linkedin_url = ?, facebook_url = ?, twitter_url = ?, instagram_url = ?,
      head_office_address1 = ?, head_office_address2 = ?, head_office_landmark = ?, head_office_city = ?, head_office_state = ?, head_office_country = ?, head_office_zip_code = ?, head_office_google_maps_url = ?, branch_name = ?, branch_address = ?, branch_city = ?, branch_state = ?, branch_country = ?, branch_zip_code = ?,
      gst_number = ?, pan_number = ?, cin_number = ?, tan_number = ?, msme_number = ?, iec_code = ?, pf_registration_number = ?, esi_registration_number = ?, professional_tax_number = ?, labour_license_number = ?, shop_establishment_number = ?,
      employee_id_prefix = ?, auto_generate_employee_id = ?, default_department = ?, default_designation = ?, probation_period = ?, notice_period = ?, default_shift = ?, working_days = ?, weekend_policy = ?, attendance_method = ?, biometric_enabled = ?, overtime_enabled = ?, leave_carry_forward = ?,
      payroll_frequency = ?, salary_cycle = ?, salary_payment_date = ?, basic_salary_pct = ?, hra_pct = ?, pf_enabled = ?, esi_enabled = ?, professional_tax = ?, tds_enabled = ?, bonus_enabled = ?, gratuity_enabled = ?, payroll_approval = ?,
      bank_name = ?, bank_branch_name = ?, account_holder_name = ?, account_number = ?, confirm_account_number = ?, ifsc_code = ?, swift_code = ?, micr_code = ?, upi_id = ?, salary_payment_method = ?,
      company_theme_color = ?, secondary_theme_color = ?, company_logo_name = ?, favicon_name = ?, login_bg_name = ?, dashboard_banner_name = ?, email_header_logo_name = ?, email_footer_logo_name = ?, company_seal_name = ?, digital_signature_name = ?,
      documents = ?,
      language = ?, time_zone = ?, currency = ?, date_format = ?, time_format = ?, password_policy = ?, two_factor_authentication = ?, session_timeout = ?, login_attempts = ?, email_notification = ?, sms_notification = ?, push_notification = ?, smtp = ?, sms_gateway = ?, google_workspace = ?, microsoft_365 = ?, biometric_device = ?
    WHERE id = 1
  `;

  const values = [
    p.general?.companyName, p.general?.legalCompanyName, p.general?.companyCode, p.general?.companyType, p.general?.industry, p.general?.businessType, p.general?.yearEstablished, p.general?.numberOfEmployees, p.general?.financialYear,
    p.contact?.officialEmail, p.contact?.hrEmail, p.contact?.supportEmail, p.contact?.website, p.contact?.phoneNumber, p.contact?.mobileNumber, p.contact?.alternateNumber, p.contact?.faxNumber, p.contact?.linkedinUrl, p.contact?.facebookUrl, p.contact?.twitterUrl, p.contact?.instagramUrl,
    p.address?.headOfficeAddress1, p.address?.headOfficeAddress2, p.address?.headOfficeLandmark, p.address?.headOfficeCity, p.address?.headOfficeState, p.address?.headOfficeCountry, p.address?.headOfficeZipCode, p.address?.headOfficeGoogleMapsUrl, p.address?.branchName, p.address?.branchAddress, p.address?.branchCity, p.address?.branchState, p.address?.branchCountry, p.address?.branchZipCode,
    p.business?.gstNumber, p.business?.panNumber, p.business?.cinNumber, p.business?.tanNumber, p.business?.msmeNumber, p.business?.iecCode, p.business?.pfRegistrationNumber, p.business?.esiRegistrationNumber, p.business?.professionalTaxNumber, p.business?.labourLicenseNumber, p.business?.shopEstablishmentNumber,
    p.hrSettings?.employeeIdPrefix, p.hrSettings?.autoGenerateEmployeeId, p.hrSettings?.defaultDepartment, p.hrSettings?.defaultDesignation, p.hrSettings?.probationPeriod, p.hrSettings?.noticePeriod, p.hrSettings?.defaultShift, p.hrSettings?.workingDays, p.hrSettings?.weekendPolicy, p.hrSettings?.attendanceMethod, p.hrSettings?.biometricEnabled, p.hrSettings?.overtimeEnabled, p.hrSettings?.leaveCarryForward,
    p.payroll?.payrollFrequency, p.payroll?.salaryCycle, p.payroll?.salaryPaymentDate, p.payroll?.basicSalaryPct, p.payroll?.hraPct, p.payroll?.pfEnabled, p.payroll?.esiEnabled, p.payroll?.professionalTax, p.payroll?.tdsEnabled, p.payroll?.bonusEnabled, p.payroll?.gratuityEnabled, p.payroll?.payrollApproval,
    p.banking?.bankName, p.banking?.branchName, p.banking?.accountHolderName, p.banking?.accountNumber, p.banking?.confirmAccountNumber, p.banking?.ifscCode, p.banking?.swiftCode, p.banking?.micrCode, p.banking?.upiId, p.banking?.salaryPaymentMethod,
    p.branding?.companyThemeColor, p.branding?.secondaryThemeColor, p.branding?.companyLogoName, p.branding?.faviconName, p.branding?.loginBgName, p.branding?.dashboardBannerName, p.branding?.emailHeaderLogoName, p.branding?.emailFooterLogoName, p.branding?.companySealName, p.branding?.digitalSignatureName,
    p.documents ? JSON.stringify(p.documents) : null,
    p.systemSettings?.language, p.systemSettings?.timeZone, p.systemSettings?.currency, p.systemSettings?.dateFormat, p.systemSettings?.timeFormat, p.systemSettings?.passwordPolicy, p.systemSettings?.twoFactorAuthentication, p.systemSettings?.sessionTimeout, p.systemSettings?.loginAttempts, p.systemSettings?.emailNotification, p.systemSettings?.smsNotification, p.systemSettings?.pushNotification, p.systemSettings?.smtp, p.systemSettings?.smsGateway, p.systemSettings?.googleWorkspace, p.systemSettings?.microsoft365, p.systemSettings?.biometricDevice
  ];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: "Failed to update profile", details: err });
    res.json({ message: "Company profile updated successfully" });
  });
});

/**
 * EXPORT PDF REPORT
 */
router.post("/export-pdf", (req, res) => {
  const { generatedBy } = req.body;
  const user = generatedBy || "John Doe";

  const sql = "SELECT * FROM company_profile WHERE id = 1";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database query error", details: err });
    if (rows.length === 0) return res.status(404).json({ error: "Company profile not found" });

    const p = mapRowToProfile(rows[0]);

    // Log the activity
    const logSql = "INSERT INTO activity_logs (user_email, action, details) VALUES (?, ?, ?)";
    db.query(logSql, [user, "Company Profile Export", `Company profile PDF report exported by ${user}.`], (logErr) => {
      if (logErr) console.error("Activity Logging Failed:", logErr);
    });

    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=company_profile.pdf");
      doc.pipe(res);

      const primaryColor = p.branding?.companyThemeColor || "#2453D4";
      const secondaryColor = p.branding?.secondaryThemeColor || "#64748B";

      // Draw PDF structure
      const drawHeader = (currentPage, totalPages) => {
        doc.save();
        // Top blue banner background
        doc.rect(0, 0, 595, 12).fill(primaryColor);

        // Header info
        doc.fillColor("#1e293b");
        doc.font("Helvetica-Bold").fontSize(14).text(p.general?.companyName || "Hawkeye Nest Technologies Pvt Ltd", 50, 30);
        doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(p.general?.companyType || "Private Limited", 50, 45);

        // Right side date/user info
        const now = new Date();
        const exportDate = now.toLocaleDateString("en-IN") + " " + now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
        doc.font("Helvetica").fontSize(8).fillColor("#64748b");
        doc.text(`Generated By: ${user}`, 400, 30, { align: "right", width: 145 });
        doc.text(`Exported On: ${exportDate}`, 400, 42, { align: "right", width: 145 });

        // Thin divider
        doc.moveTo(50, 60).lineTo(545, 60).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
        doc.restore();
      };

      const drawFooter = (currentPage, totalPages) => {
        doc.save();
        // Divider
        doc.moveTo(50, 780).lineTo(545, 780).lineWidth(0.5).strokeColor("#e2e8f0").stroke();

        doc.font("Helvetica").fontSize(8).fillColor("#94a3b8");
        doc.text("Generated automatically by the HRMS.", 50, 790);
        doc.text("CONFIDENTIAL DOCUMENT", 240, 790, { width: 115, align: "center" });
        doc.text(`Page ${currentPage} of ${totalPages}`, 450, 790, { width: 95, align: "right" });
        doc.restore();
      };

      // Header spacing
      doc.y = 80;

      // Report Title
      doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(20).text("Company Profile Report", { align: "center" });
      doc.moveDown(1.5);

      // Utility function to draw table-like structures
      const drawSectionHeader = (title) => {
        doc.moveDown(0.5);
        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(12).text(title);
        doc.moveDown(0.2);
        doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).lineWidth(1.5).strokeColor(primaryColor).stroke();
        doc.moveDown(0.4);
      };

      const drawRow = (label1, val1, label2, val2) => {
        const startY = doc.y;
        doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(9).text(label1, 50, startY, { width: 110 });
        doc.fillColor("#1e293b").font("Helvetica").fontSize(9).text(val1 || "—", 160, startY, { width: 120 });

        if (label2) {
          doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(9).text(label2, 300, startY, { width: 110 });
          doc.fillColor("#1e293b").font("Helvetica").fontSize(9).text(val2 || "—", 410, startY, { width: 135 });
        }

        const maxY = Math.max(doc.y, startY);
        doc.y = maxY + 8; // Row spacing
      };

      // 1. Overview Section
      drawSectionHeader("Overview");
      drawRow("Company Name", p.general?.companyName, "Legal Company Name", p.general?.legalCompanyName);
      drawRow("Company Type", p.general?.companyType, "Industry", p.general?.industry);
      drawRow("Business Type", p.general?.businessType, "Established Year", p.general?.yearEstablished);
      drawRow("Official Email", p.contact?.officialEmail, "Website", p.contact?.website);
      drawRow("Phone Number", p.contact?.phoneNumber, "Mobile Number", p.contact?.mobileNumber);

      // 2. Address Section
      drawSectionHeader("Address Details");
      const fullAddress = [p.address?.headOfficeAddress1, p.address?.headOfficeAddress2, p.address?.headOfficeLandmark].filter(Boolean).join(", ");
      drawRow("Head Office Address", fullAddress);
      drawRow("City", p.address?.headOfficeCity, "State", p.address?.headOfficeState);
      drawRow("Country", p.address?.headOfficeCountry, "Postal Code", p.address?.headOfficeZipCode);
      if (p.address?.branchAddress) {
        const branchFull = [p.address?.branchAddress, p.address?.branchCity, p.address?.branchState, p.address?.branchCountry, p.address?.branchZipCode].filter(Boolean).join(", ");
        drawRow("Branch Details", `${p.address?.branchName || "Branch"}: ${branchFull}`);
      }

      // 3. Business Information
      drawSectionHeader("Business Information");
      drawRow("GST Number", p.business?.gstNumber, "PAN Number", p.business?.panNumber);
      drawRow("CIN Number", p.business?.cinNumber, "TAN Number", p.business?.tanNumber);
      drawRow("MSME Number", p.business?.msmeNumber, "IEC Code", p.business?.iecCode);

      // Trigger automatic new page for rest sections to keep layout super neat
      doc.addPage();
      doc.y = 80;

      // 4. Organization & HR Details
      drawSectionHeader("Organization & HR Settings");
      drawRow("Total Employees", p.general?.numberOfEmployees, "Working Days", p.hrSettings?.workingDays);
      drawRow("Office Hours", p.hrSettings?.defaultShift, "Weekend Policy", p.hrSettings?.weekendPolicy);
      drawRow("Attendance Policy", p.hrSettings?.attendanceMethod, "Leave Carry Forward", p.hrSettings?.leaveCarryForward ? "Yes" : "No");
      drawRow("Probation Period", `${p.hrSettings?.probationPeriod || "—"} Months`, "Notice Period", `${p.hrSettings?.noticePeriod || "—"} Days`);

      // 5. Payroll Information
      drawSectionHeader("Payroll Settings");
      drawRow("Payroll Frequency", p.payroll?.payrollFrequency, "Salary Cycle", p.payroll?.salaryCycle);
      drawRow("Payment Date", p.payroll?.salaryPaymentDate, "Currency", p.systemSettings?.currency);
      drawRow("Basic Salary", `${p.payroll?.basicSalaryPct || "50"}%`, "HRA Component", `${p.payroll?.hraPct || "40"}%`);

      // 6. Bank Information
      drawSectionHeader("Bank Details");
      // Mask bank account number (mask all but last 4 digits)
      const rawAcc = p.banking?.accountNumber || "";
      const maskedAcc = rawAcc.length > 4
        ? rawAcc.slice(-4).padStart(rawAcc.length, "*")
        : rawAcc;
      drawRow("Bank Name", p.banking?.bankName, "Branch Name", p.banking?.branchName);
      drawRow("Account Holder", p.banking?.accountHolderName, "Account Number", maskedAcc);
      drawRow("IFSC Code", p.banking?.ifscCode, "Salary Payment Method", p.banking?.salaryPaymentMethod);

      // Draw all headers and footers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        drawHeader(i + 1, pages.count);
        drawFooter(i + 1, pages.count);
      }

      doc.end();
    } catch (pdfErr) {
      console.error("PDF Generation failed:", pdfErr);
      res.status(500).json({ error: "Failed to generate PDF document", details: pdfErr.message });
    }
  });
});

/**
 * TEAMS CRUD
 */
/**
 * TEAMS CRUD
 */
router.get("/teams", (req, res) => {
  const sql = `
    SELECT 
      t.id,
      t.name,
      COALESCE(NULLIF(t.code, ''), CONCAT('TM-', UPPER(SUBSTRING(t.name, 1, 3)))) as code,
      COALESCE(d.dept_name, d.department_name, NULLIF(t.department, ''), 'General') as department,
      t.department_id,
      COALESCE(tl.name, NULLIF(t.teamLead, ''), 'Unassigned') as teamLead,
      t.team_lead_id,
      GREATEST(COALESCE((SELECT COUNT(*) FROM employees e WHERE e.team_id = t.id AND e.status = 'Active'), 0), COALESCE(t.members, 0)) as members,
      t.description,
      t.createdDate,
      t.status
    FROM teams t
    LEFT JOIN departments d ON (t.department_id = d.id OR t.department = d.dept_name OR t.department = d.department_name)
    LEFT JOIN employees tl ON (t.team_lead_id = tl.id OR t.teamLead = tl.name)
    ORDER BY t.id ASC
  `;
  db.query(sql, async (err, rows) => {
    if (err) {
      console.error("[GET /teams] Query Error:", err);
      return res.status(500).json(err);
    }
    
    // Enrich with live teamMemberIds array from employees table
    try {
      const teamsWithMembers = await Promise.all((rows || []).map(async (t) => {
        const emps = await new Promise(r => db.query("SELECT id FROM employees WHERE team_id = ?", [t.id], (e, res) => r(res || [])));
        return {
          ...t,
          teamMemberIds: emps.map(e => e.id)
        };
      }));
      res.json(teamsWithMembers);
    } catch (e) {
      res.json(rows || []);
    }
  });
});

router.post("/teams", authenticateJWT, checkPermission("organization", "teams", "create"), async (req, res) => {
  const { name, code, department, departmentId, teamLead, teamLeadId, members, status, description, teamMemberIds } = req.body;
  
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Team Name is required" });
  }

  // Check for duplicate team name
  const existingTeam = await new Promise(r => db.query("SELECT id FROM teams WHERE LOWER(name) = LOWER(?) LIMIT 1", [String(name).trim()], (e, rows) => r(rows)));
  if (existingTeam && existingTeam.length > 0) {
    return res.status(400).json({ error: `A team named "${name}" already exists.` });
  }

  let deptId = departmentId || null;
  if (!deptId && department) {
    const cleanDept = String(department).replace(/\s*\([^)]*\)/g, '').trim();
    const deptRows = await new Promise(r => db.query(
      "SELECT id FROM departments WHERE dept_name = ? OR dept_name = ? OR name = ? OR name = ? OR CONCAT(dept_name, ' (', code, ')') = ? LIMIT 1",
      [department, cleanDept, department, cleanDept, department],
      (e, res) => r(res)
    ));
    if (deptRows && deptRows.length > 0) deptId = deptRows[0].id;
  }

  let leadId = teamLeadId || null;
  if (!leadId && teamLead) {
    const leadRows = await new Promise(r => db.query("SELECT id FROM employees WHERE name = ? LIMIT 1", [teamLead], (e, res) => r(res)));
    if (leadRows && leadRows.length > 0) leadId = leadRows[0].id;
  }

  const memberCount = Array.isArray(teamMemberIds) && teamMemberIds.length > 0 ? teamMemberIds.length : (parseInt(members) || 1);

  const sql = `
    INSERT INTO teams (name, code, department, department_id, teamLead, team_lead_id, members, status, description, createdDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_FORMAT(NOW(), '%d %b %Y'))
  `;
  db.query(sql, [
    String(name).trim(),
    code ? String(code).trim() : '',
    department ? String(department).trim() : '',
    deptId || null,
    teamLead ? String(teamLead).trim() : '',
    leadId || null,
    memberCount,
    status || 'Active',
    description ? String(description).trim() : ''
  ], (err, result) => {
    if (err) {
      console.error("Error inserting team:", err);
      return res.status(500).json({ error: err.message || "Failed to create team", details: err });
    }
    const teamId = result.insertId;

    if (Array.isArray(teamMemberIds) && teamMemberIds.length > 0) {
      db.query("UPDATE employees SET team_id = ? WHERE id IN (?)", [teamId, teamMemberIds], (e) => {
        if (e) console.error("Error updating team_id for employees:", e);
      });
    }

    res.json({ message: "Team created successfully", id: teamId });
  });
});

router.put("/teams/:id", authenticateJWT, checkPermission("organization", "teams", "edit"), async (req, res) => {
  const { id } = req.params;
  const { name, code, department, departmentId, teamLead, teamLeadId, members, status, description, teamMemberIds } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Team Name is required" });
  }

  let deptId = departmentId || null;
  if (!deptId && department) {
    const cleanDept = String(department).replace(/\s*\([^)]*\)/g, '').trim();
    const deptRows = await new Promise(r => db.query(
      "SELECT id FROM departments WHERE dept_name = ? OR dept_name = ? OR name = ? OR name = ? OR CONCAT(dept_name, ' (', code, ')') = ? LIMIT 1",
      [department, cleanDept, department, cleanDept, department],
      (e, res) => r(res)
    ));
    if (deptRows && deptRows.length > 0) deptId = deptRows[0].id;
  }

  let leadId = teamLeadId || null;
  if (!leadId && teamLead) {
    const leadRows = await new Promise(r => db.query("SELECT id FROM employees WHERE name = ? LIMIT 1", [teamLead], (e, res) => r(res)));
    if (leadRows && leadRows.length > 0) leadId = leadRows[0].id;
  }

  const memberCount = Array.isArray(teamMemberIds) && teamMemberIds.length > 0 ? teamMemberIds.length : (parseInt(members) || 1);

  const sql = `
    UPDATE teams
    SET name = ?, code = ?, department = ?, department_id = ?, teamLead = ?, team_lead_id = ?, members = ?, status = ?, description = ?
    WHERE id = ?
  `;
  db.query(sql, [
    String(name).trim(),
    code ? String(code).trim() : '',
    department ? String(department).trim() : '',
    deptId || null,
    teamLead ? String(teamLead).trim() : '',
    leadId || null,
    memberCount,
    status || 'Active',
    description ? String(description).trim() : '',
    id
  ], (err, result) => {
    if (err) {
      console.error("Error updating team:", err);
      return res.status(500).json({ error: err.message || "Failed to update team", details: err });
    }

    if (Array.isArray(teamMemberIds)) {
      db.query("UPDATE employees SET team_id = NULL WHERE team_id = ?", [id], () => {
        if (teamMemberIds.length > 0) {
          db.query("UPDATE employees SET team_id = ? WHERE id IN (?)", [id, teamMemberIds]);
        }
      });
    }

    res.json({ message: "Team updated successfully" });
  });
});

router.delete("/teams/:id", authenticateJWT, checkPermission("organization", "teams", "delete"), (req, res) => {
  const { id } = req.params;
  db.query("UPDATE employees SET team_id = NULL WHERE team_id = ?", [id], () => {
    db.query("DELETE FROM teams WHERE id = ?", [id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Team deleted successfully" });
    });
  });
});

/**
 * HOLIDAYS CRUD
 */
router.get("/holidays", authenticateJWT, checkPermission("organization", "holiday_calendar", "view"), (req, res) => {
  const sql = `
    SELECT 
      id,
      name,
      DATE_FORMAT(holiday_date, '%d %b %Y') as date,
      type,
      branch,
      description,
      COALESCE(status, 'Active') as status
    FROM holidays
    ORDER BY id ASC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.post("/holidays", authenticateJWT, checkPermission("organization", "holiday_calendar", "create"), (req, res) => {
  const { name, date, type, branch, description, status } = req.body;
  const sql = `
    INSERT INTO holidays (name, date, holiday_date, type, branch, description, status)
    VALUES (?, ?, CURRENT_DATE(), ?, ?, ?, ?)
  `;
  db.query(sql, [name, date, type || 'National', branch || 'All Branches', description, status || 'Active'], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Holiday created successfully", id: result.insertId });
  });
});

router.put("/holidays/:id", authenticateJWT, checkPermission("organization", "holiday_calendar", "edit"), (req, res) => {
  const { id } = req.params;
  const { name, date, type, branch, description, status } = req.body;
  const sql = `
    UPDATE holidays
    SET name = ?, date = ?, type = ?, branch = ?, description = ?, status = ?
    WHERE id = ?
  `;
  db.query(sql, [name, date, type, branch, description, status, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Holiday updated successfully" });
  });
});

router.delete("/holidays/:id", authenticateJWT, checkPermission("organization", "holiday_calendar", "delete"), (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM holidays WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Holiday deleted successfully" });
  });
});

/**
 * ORGANIZATION CHART
 */
router.get("/org-chart", authenticateJWT, checkPermission("organization", "organization_chart", "view"), (req, res) => {
  const sql = `
    SELECT 
      e.id,
      e.name,
      des.role_name as title,
      d.dept_name as department,
      e.profile_photo as image,
      e.manager_id
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN designations des ON e.designation_id = des.id
    WHERE e.status = 'Active'
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows || rows.length === 0) {
      return res.json(null);
    }
    const map = {};
    const roots = [];
    rows.forEach(r => {
      map[r.id] = { ...r, children: [] };
    });
    rows.forEach(r => {
      if (r.manager_id && map[r.manager_id]) {
        map[r.manager_id].children.push(map[r.id]);
      } else {
        roots.push(map[r.id]);
      }
    });

    res.json(roots.length > 0 ? roots[0] : map[rows[0].id]);
  });
});

/**
 * SHIFTS CRUD
 */
const shiftExtraStore = {};

router.get("/shifts", authenticateJWT, checkPermission("organization", "shift_management", "view"), (req, res) => {
  const sql = `
    SELECT 
      id,
      name,
      COALESCE(code, CONCAT('SHT-', UPPER(SUBSTRING(name, 1, 3)))) as code,
      startTime,
      endTime,
      breakTime,
      graceTime,
      workingHours,
      employees,
      COALESCE(status, 'Active') as status,
      description,
      COALESCE(createdDate, DATE_FORMAT(NOW(), '%d %b %Y')) as createdDate
    FROM shifts
    ORDER BY id ASC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    const enriched = (rows || []).map(r => {
      const extra = shiftExtraStore[r.id] || {};
      return {
        ...r,
        workingDays: extra.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        assignedEmployees: extra.assignedEmployees || [],
        offLabel: extra.offLabel || 'Weekly Off',
        dayOffLabels: extra.dayOffLabels || {}
      };
    });
    res.json(enriched);
  });
});

router.post("/shifts", authenticateJWT, checkPermission("organization", "shift_management", "create"), (req, res) => {
  const { name, code, startTime, endTime, breakTime, graceTime, workingHours, employees, status, description, assignedEmployees, workingDays, offLabel, dayOffLabels } = req.body;
  const empCount = Array.isArray(assignedEmployees) ? assignedEmployees.length : (parseInt(employees) || 0);
  const sql = `
    INSERT INTO shifts (name, code, startTime, endTime, breakTime, graceTime, workingHours, employees, status, description, createdDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_FORMAT(NOW(), '%d %b %Y'))
  `;
  db.query(sql, [name, code, startTime, endTime, breakTime || '60 mins', graceTime || '15 mins', workingHours || '9 hours', empCount, status || 'Active', description], (err, result) => {
    if (err) return res.status(500).json(err);
    const newId = result.insertId;
    shiftExtraStore[newId] = {
      workingDays: Array.isArray(workingDays) ? workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      assignedEmployees: Array.isArray(assignedEmployees) ? assignedEmployees : [],
      offLabel: offLabel || 'Weekly Off',
      dayOffLabels: dayOffLabels || {}
    };
    res.json({ message: "Shift created successfully", id: newId });
  });
});

router.put("/shifts/:id", authenticateJWT, checkPermission("organization", "shift_management", "edit"), (req, res) => {
  const { id } = req.params;
  const { name, code, startTime, endTime, breakTime, graceTime, workingHours, employees, status, description, assignedEmployees, workingDays, offLabel, dayOffLabels } = req.body;
  const empCount = Array.isArray(assignedEmployees) ? assignedEmployees.length : (parseInt(employees) || 0);
  const sql = `
    UPDATE shifts
    SET name = ?, code = ?, startTime = ?, endTime = ?, breakTime = ?, graceTime = ?, workingHours = ?, employees = ?, status = ?, description = ?
    WHERE id = ?
  `;
  db.query(sql, [name, code, startTime, endTime, breakTime, graceTime, workingHours, empCount, status, description, id], (err, result) => {
    if (err) return res.status(500).json(err);
    shiftExtraStore[id] = {
      workingDays: Array.isArray(workingDays) ? workingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      assignedEmployees: Array.isArray(assignedEmployees) ? assignedEmployees : [],
      offLabel: offLabel || 'Weekly Off',
      dayOffLabels: dayOffLabels || {}
    };
    res.json({ message: "Shift updated successfully" });
  });
});

router.delete("/shifts/:id", authenticateJWT, checkPermission("organization", "shift_management", "delete"), (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM shifts WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    delete shiftExtraStore[id];
    res.json({ message: "Shift deleted successfully" });
  });
});

module.exports = router;
