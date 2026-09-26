import * as XLSX from 'xlsx';

export const EMPLOYEE_FIELDS = [
  {
    key: 'employeeCode',
    label: 'Employee Code',
    required: false,
    type: 'string',
    description: 'Leave empty for auto-generated EMP#### or enter existing code to update',
    aliases: ['employee code', 'employee_code', 'employee id', 'employee_id', 'emp code', 'emp_code', 'emp id', 'empid', 'code', 'employee no', 'emp no'],
    sample: 'EMP0015'
  },
  {
    key: 'firstName',
    label: 'First Name',
    required: true,
    type: 'string',
    aliases: ['first name', 'firstname', 'first_name', 'fname'],
    sample: 'Aarav'
  },
  {
    key: 'lastName',
    label: 'Last Name',
    required: true,
    type: 'string',
    aliases: ['last name', 'lastname', 'last_name', 'lname', 'surname', 'initial'],
    sample: 'Sharma'
  },
  {
    key: 'fullName',
    label: 'Full Name',
    required: false,
    type: 'string',
    aliases: ['name', 'full name', 'fullname', 'employee name', 'emp name', 'candidate name'],
    sample: 'Aarav Sharma'
  },
  {
    key: 'email',
    label: 'Login Email',
    required: true,
    type: 'string',
    aliases: ['login email', 'email', 'email address', 'official email', 'company email', 'mail id', 'mail_id', 'email id', 'email_id', 'e mail'],
    sample: 'aarav.sharma@company.com'
  },
  {
    key: 'phone',
    label: 'Contact No',
    required: true,
    type: 'string',
    aliases: ['contact no / phone', 'contact no', 'phone', 'contact_no', 'mobile', 'contact', 'phone number', 'mobile number', 'contact number', 'phone no', 'mobile no'],
    sample: '+91 9876543210'
  },
  {
    key: 'dob',
    label: 'Date of Birth',
    required: false,
    type: 'date',
    description: 'Format: YYYY-MM-DD',
    aliases: ['date of birth', 'dob', 'date_of_birth', 'birth date', 'birthdate'],
    sample: '1996-05-15'
  },
  {
    key: 'gender',
    label: 'Gender',
    required: false,
    type: 'gender',
    options: ['Male', 'Female', 'Other'],
    aliases: ['gender', 'sex'],
    sample: 'Male'
  },
  {
    key: 'shiftType',
    label: 'Employee Shift Type',
    required: false,
    type: 'string',
    options: ['Regular Shift', 'Rotational Shift', 'Contract Shift'],
    aliases: ['employee shift type', 'shift type', 'shift_type', 'shift'],
    sample: 'Regular Shift'
  },
  {
    key: 'department',
    label: 'Department',
    required: false,
    type: 'string',
    aliases: ['department', 'dept', 'dept_name', 'department name', 'dept name'],
    sample: 'Development'
  },
  {
    key: 'designation',
    label: 'Designation',
    required: false,
    type: 'string',
    aliases: ['designation', 'role', 'role_name', 'role name', 'position', 'job title', 'title'],
    sample: 'Full Stack Developer'
  },
  {
    key: 'branch',
    label: 'Branch',
    required: false,
    type: 'string',
    aliases: ['branch', 'branch name', 'location', 'office', 'branch location'],
    sample: 'Head Office'
  },
  {
    key: 'teamName',
    label: 'Team',
    required: false,
    type: 'string',
    aliases: ['team', 'team name', 'team_name'],
    sample: 'Core Engineering'
  },
  {
    key: 'managerName',
    label: 'Reporting Manager',
    required: false,
    type: 'string',
    aliases: ['reporting manager', 'manager', 'manager name', 'manager_name', 'reporting manager name', 'reporting manager / team lead'],
    sample: 'Priyanka M'
  },
  {
    key: 'joinDate',
    label: 'Joining Date',
    required: false,
    type: 'date',
    description: 'Format: YYYY-MM-DD',
    aliases: ['joining date', 'join date', 'join_date', 'date of joining', 'doj', 'date of join'],
    sample: '2026-01-15'
  },
  {
    key: 'employmentType',
    label: 'Employment Type',
    required: false,
    type: 'select',
    options: ['Full-time', 'Part-time', 'Contract'],
    aliases: ['employment type', 'employment_type', 'employment status', 'work type'],
    sample: 'Full-time'
  },
  {
    key: 'experienceType',
    label: 'Experience Type',
    required: false,
    type: 'select',
    options: ['Experienced', 'Fresher'],
    aliases: ['experience type', 'experience_type'],
    sample: 'Experienced'
  },
  {
    key: 'totalExpYears',
    label: 'Total Exp Years',
    required: false,
    type: 'number',
    aliases: ['total exp years', 'total_experience_years', 'exp years', 'years of experience'],
    sample: 3
  },
  {
    key: 'totalExpMonths',
    label: 'Total Exp Months',
    required: false,
    type: 'number',
    aliases: ['total exp months', 'total_experience_months', 'exp months'],
    sample: 6
  },
  {
    key: 'salary',
    label: 'Monthly Salary (INR)',
    required: false,
    type: 'number',
    aliases: ['salary', 'monthly salary', 'gross salary', 'monthly_salary', 'ctc', 'monthly salary (inr)', 'monthly gross salary'],
    sample: 75000
  },
  {
    key: 'bankName',
    label: 'Bank Name',
    required: false,
    type: 'string',
    aliases: ['bank name', 'bank_name', 'bank'],
    sample: 'HDFC Bank'
  },
  {
    key: 'accountNumber',
    label: 'Bank Account Number',
    required: false,
    type: 'string',
    aliases: ['bank account no', 'bank account number', 'account number', 'account_number', 'account no', 'bank account', 'account'],
    sample: '50100456789123'
  },
  {
    key: 'ifscCode',
    label: 'IFSC Code',
    required: false,
    type: 'string',
    aliases: ['ifsc code', 'ifsc', 'ifsc_code', 'ifc code'],
    sample: 'HDFC0001234'
  },
  {
    key: 'emergencyContact',
    label: 'Emergency Contact No',
    required: false,
    type: 'string',
    aliases: ['emergency contact no', 'emergency contact', 'emergency_contact', 'emergency phone', 'emergency contact number', 'emergency no'],
    sample: 'Parent - +91 98888 77777'
  },
  {
    key: 'address',
    label: 'Address',
    required: false,
    type: 'string',
    aliases: ['complete address', 'address', 'residential address', 'location address', 'permanent address'],
    sample: '123 MG Road, Bangalore, Karnataka'
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    required: false,
    type: 'select',
    options: ['Single', 'Married'],
    aliases: ['marital status', 'marital_status', 'marital'],
    sample: 'Single'
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group',
    required: false,
    type: 'string',
    aliases: ['blood group', 'blood_group', 'blood'],
    sample: 'O+'
  }
];

/**
 * Clean & normalize a raw Excel header string:
 * removes non-breaking spaces, punctuation, symbols, slashes, extra whitespace, lowercase
 */
export function normalizeHeaderString(h) {
  if (!h) return '';
  return String(h)
    .replace(/[\u00A0\r\n\t]/g, ' ')
    .replace(/[*#:.]/g, ' ')
    .replace(/[\/_\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Clean alphanumeric key for exact alias matching
 */
export function normalizeHeaderKey(h) {
  return normalizeHeaderString(h).replace(/[^a-z0-9]/g, '');
}

/**
 * Format any date object, number (serial), or string to YYYY-MM-DD
 */
export function formatToYmd(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    if (val > 1000 && val < 100000) {
      // Excel serial date to JS Date (epoch: 1899-12-30 accounting for 1900 leap year bug)
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
    return String(val);
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // If numeric string serial (e.g. "45992")
  if (/^\d{5}$/.test(str)) {
    const num = parseInt(str, 10);
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const parts = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (parts) {
    const d = parts[1].padStart(2, '0');
    const m = parts[2].padStart(2, '0');
    const y = parts[3];
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

/**
 * Match a raw Excel column header to a known employee field definition
 */
export function matchHeaderToField(rawHeader) {
  const normStr = normalizeHeaderString(rawHeader);
  const normKey = normalizeHeaderKey(rawHeader);
  if (!normKey) return null;

  // 1. Exact match on normalized string or key
  for (const spec of EMPLOYEE_FIELDS) {
    for (const alias of spec.aliases) {
      const aliasNorm = normalizeHeaderString(alias);
      const aliasKey = normalizeHeaderKey(alias);
      if (normStr === aliasNorm || normKey === aliasKey) {
        return spec;
      }
    }
  }

  // 2. Contains match (longer aliases first to avoid substring false positives)
  for (const spec of EMPLOYEE_FIELDS) {
    const sortedAliases = [...spec.aliases].sort((a, b) => b.length - a.length);
    for (const alias of sortedAliases) {
      const aliasNorm = normalizeHeaderString(alias);
      if (aliasNorm.length >= 3 && normStr.includes(aliasNorm)) {
        return spec;
      }
    }
  }

  return null;
}

/**
 * Automatically find the row index in a sheet that contains the column headers
 * (Skips company banners, titles, or empty rows at top)
 */
export function findHeaderRowIndex(rows2D = []) {
  let bestRowIdx = 0;
  let maxMatches = 0;

  for (let r = 0; r < Math.min(rows2D.length, 15); r++) {
    const row = rows2D[r];
    if (!row || !Array.isArray(row)) continue;

    let matches = 0;
    for (const cell of row) {
      if (cell && typeof cell === 'string') {
        const matched = matchHeaderToField(cell);
        if (matched) matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestRowIdx = r;
    }
  }

  return { headerRowIdx: bestRowIdx, matchCount: maxMatches };
}

/**
 * Canonical Employee Normalizer:
 * Converts raw Excel row data into the single canonical internal employee object structure
 * matching the Add Employee form.
 */
export function normalizeEmployeeExcelRow(rowArray, colMapping = [], rowId = 1) {
  const emp = {
    _rowId: rowId,
    firstName: '',
    lastName: '',
    name: '',
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    shiftType: 'Regular Shift',
    department: '',
    designation: '',
    branch: '',
    teamName: '',
    managerName: '',
    joinDate: '',
    employmentType: 'Full-time',
    experienceType: 'Experienced',
    totalExpYears: 0,
    totalExpMonths: 0,
    relevantExpYears: 0,
    relevantExpMonths: 0,
    salary: 60000,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    emergencyContact: '',
    address: '',
    maritalStatus: '',
    bloodGroup: '',
    employeeCode: '',
    password: 'Employee@2026'
  };

  // Map each column using pre-computed mapping
  colMapping.forEach(m => {
    if (!m.spec) return;
    const rawVal = Array.isArray(rowArray) ? rowArray[m.colIdx] : rowArray[m.rawHeader];
    if (rawVal === undefined || rawVal === null || rawVal === '') return;

    const key = m.spec.key;
    const type = m.spec.type;

    if (type === 'date') {
      emp[key] = formatToYmd(rawVal);
    } else if (type === 'number') {
      const num = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
      emp[key] = isNaN(num) ? 0 : num;
    } else if (type === 'gender') {
      const gStr = String(rawVal).trim().toLowerCase();
      if (gStr.startsWith('m') && !gStr.startsWith('mar')) emp[key] = 'Male';
      else if (gStr.startsWith('f') || gStr.startsWith('w')) emp[key] = 'Female';
      else emp[key] = 'Other';
    } else {
      let valStr = String(rawVal).replace(/\.0$/, '').trim();
      if (key === 'phone' || key === 'emergencyContact') {
        valStr = valStr.replace(/\s+/g, '');
      }
      emp[key] = valStr;
    }
  });

  // Handle names
  if (!emp.firstName && !emp.lastName && emp.fullName) {
    const parts = emp.fullName.trim().split(/\s+/);
    emp.firstName = parts[0] || '';
    emp.lastName = parts.slice(1).join(' ') || '';
  } else if (emp.firstName && !emp.lastName) {
    const parts = emp.firstName.trim().split(/\s+/);
    if (parts.length > 1) {
      emp.firstName = parts[0];
      emp.lastName = parts.slice(1).join(' ');
    }
  }

  if (!emp.name) {
    emp.name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.fullName || '';
  }
  if (!emp.fullName) {
    emp.fullName = emp.name;
  }

  // Infer gender if missing
  if (!emp.gender) {
    const lowerName = (emp.firstName || emp.name || '').toLowerCase();
    if (lowerName.startsWith('mrs.') || lowerName.startsWith('ms.') || lowerName.startsWith('miss.')) {
      emp.gender = 'Female';
    } else if (lowerName.startsWith('mr.')) {
      emp.gender = 'Male';
    } else {
      emp.gender = 'Other';
    }
  }

  // Default shiftType if blank
  if (!emp.shiftType) {
    emp.shiftType = 'Regular Shift';
  }

  return emp;
}

/**
 * Parse an uploaded Excel file (.xlsx, .xls) into array of canonical employee objects
 */
export async function parseEmployeeExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Select best sheet (first sheet that contains valid employee headers)
        let targetWs = null;
        let bestHeaderIdx = 0;

        for (const sName of workbook.SheetNames) {
          const ws = workbook.Sheets[sName];
          const rows2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          const { headerRowIdx, matchCount } = findHeaderRowIndex(rows2D);
          if (matchCount >= 3) {
            targetWs = ws;
            bestHeaderIdx = headerRowIdx;
            break;
          }
        }

        if (!targetWs) {
          targetWs = workbook.Sheets[workbook.SheetNames[0]];
          const rows2D = XLSX.utils.sheet_to_json(targetWs, { header: 1, defval: '' });
          const { headerRowIdx } = findHeaderRowIndex(rows2D);
          bestHeaderIdx = headerRowIdx;
        }

        const rows2D = XLSX.utils.sheet_to_json(targetWs, { header: 1, defval: '' });
        if (!rows2D || rows2D.length === 0) {
          return resolve([]);
        }

        const rawHeaderRow = rows2D[bestHeaderIdx] || [];

        // Build header mapping: colIndex -> fieldSpec
        const colMapping = [];
        rawHeaderRow.forEach((h, colIdx) => {
          const spec = matchHeaderToField(h);
          colMapping.push({ colIdx, rawHeader: h, spec });
        });

        const mappedEmployees = [];
        let rowId = 1;

        for (let r = bestHeaderIdx + 1; r < rows2D.length; r++) {
          const row = rows2D[r];
          if (!row || !Array.isArray(row)) continue;

          // Check if row has any non-empty cell
          const hasData = row.some(c => c !== null && c !== undefined && String(c).trim() !== '');
          if (!hasData) continue;

          const emp = normalizeEmployeeExcelRow(row, colMapping, rowId);

          // Only include row if it has at least name, email, phone, or code
          if (emp.name || emp.email || emp.phone || emp.employeeCode) {
            mappedEmployees.push(emp);
            rowId++;
          }
        }

        resolve(mappedEmployees);
      } catch (err) {
        console.error("Error parsing Excel:", err);
        reject(new Error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file from browser."));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate an array of parsed employee rows with real-time feedback
 */
export function validateEmployeeRows(rows = [], meta = {}) {
  const existingCodeMap = new Map();
  const existingEmailMap = new Map();

  (meta.existingEmployees || []).forEach(e => {
    if (e.employee_code) existingCodeMap.set(e.employee_code.trim().toUpperCase(), e);
    if (e.email) existingEmailMap.set(e.email.trim().toLowerCase(), e);
  });

  const fileEmailCounts = new Map();
  const fileCodeCounts = new Map();
  rows.forEach(r => {
    if (r.email) {
      const em = r.email.trim().toLowerCase();
      fileEmailCounts.set(em, (fileEmailCounts.get(em) || 0) + 1);
    }
    if (r.employeeCode) {
      const c = r.employeeCode.trim().toUpperCase();
      fileCodeCounts.set(c, (fileCodeCounts.get(c) || 0) + 1);
    }
  });

  let readyCount = 0;
  let missingCount = 0;
  let existingCount = 0;
  let errorCount = 0;

  const validatedRows = rows.map((emp) => {
    const missingFields = [];
    const errors = [];
    const warnings = [];
    let isExisting = false;
    let existingEmployee = null;

    // Check existing employee code
    const code = (emp.employeeCode || '').trim().toUpperCase();
    if (!code) {
      missingFields.push('Employee ID');
    } else {
      if (fileCodeCounts.get(code) > 1) {
        errors.push(`Duplicate Employee Code "${code}" within this Excel file`);
      }
      if (existingCodeMap.has(code)) {
        isExisting = true;
        existingEmployee = existingCodeMap.get(code);
      }
    }

    // Required Field Validations (Exact match with Add Employee required fields)
    if (!emp.firstName && !emp.name) {
      missingFields.push('First Name');
    }
    if (!emp.lastName && !emp.name) {
      missingFields.push('Last Name');
    }

    if (!emp.phone) {
      missingFields.push('Phone');
    }

    if (!emp.email) {
      missingFields.push('Email');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanEmail = emp.email.trim().toLowerCase();
      if (!emailRegex.test(cleanEmail)) {
        errors.push('Invalid email format');
      } else if (fileEmailCounts.get(cleanEmail) > 1) {
        errors.push('Duplicate email within this Excel file');
      } else if (!isExisting && existingEmailMap.has(cleanEmail)) {
        errors.push(`Email already registered for ${existingEmailMap.get(cleanEmail).name}`);
      }
    }

    // Master data advisory warnings (optional, non-blocking)
    if (emp.department && meta.departments && meta.departments.length > 0) {
      const foundDept = meta.departments.some(d => d.toLowerCase() === emp.department.toLowerCase());
      if (!foundDept) {
        warnings.push(`Department "${emp.department}" is not in master list`);
      }
    }

    if (emp.designation && meta.designations && meta.designations.length > 0) {
      const foundDesg = meta.designations.some(d => d.toLowerCase() === emp.designation.toLowerCase());
      if (!foundDesg) {
        warnings.push(`Designation "${emp.designation}" is not in master list`);
      }
    }

    if (emp.branch && meta.branches && meta.branches.length > 0) {
      const foundBranch = meta.branches.some(b => b.toLowerCase() === emp.branch.toLowerCase());
      if (!foundBranch) {
        warnings.push(`Branch "${emp.branch}" is not in master list`);
      }
    }

    // Determine status
    let status = 'Ready';
    if (errors.length > 0) {
      status = 'Error';
      errorCount++;
    } else if (missingFields.length > 0) {
      status = 'Missing Fields';
      missingCount++;
    } else if (isExisting) {
      status = 'Existing';
      existingCount++;
    } else {
      readyCount++;
    }

    return {
      ...emp,
      _status: status,
      _missingFields: missingFields,
      _errors: errors,
      _warnings: warnings,
      _isExisting: isExisting,
      _existingEmployee: existingEmployee,
      _action: isExisting ? (emp._action || 'update') : 'create'
    };
  });

  return {
    rows: validatedRows,
    summary: {
      total: rows.length,
      ready: readyCount,
      missing: missingCount,
      existing: existingCount,
      errors: errorCount
    }
  };
}

/**
 * Download the Excel Template (.xlsx) matching Add Employee form
 */
export function downloadEmployeeExcelTemplate(meta = {}) {
  const wb = XLSX.utils.book_new();

  // Template columns (ordered logically like Add Employee form)
  const headers = EMPLOYEE_FIELDS.map(f => f.label);

  const sampleRow1 = [
    '', // Employee Code (blank for auto-generate)
    'Aarav',
    'Sharma',
    'Aarav Sharma',
    'aarav.sharma@example.com',
    '+91 9876543210',
    '1996-05-15',
    'Male',
    'Regular Shift',
    meta.departments?.[0] || 'Development',
    meta.designations?.[0] || 'Full Stack Developer',
    meta.branches?.[0] || 'Head Office',
    meta.teams?.[0] || 'Engineering',
    'Priyanka M',
    new Date().toISOString().split('T')[0],
    'Full-time',
    'Experienced',
    3,
    6,
    75000,
    'HDFC Bank',
    '50100456789123',
    'HDFC0001234',
    'Parent - +91 98888 77777',
    '123 MG Road, Bangalore, Karnataka',
    'Single',
    'O+'
  ];

  const sampleRow2 = [
    '', // Employee Code
    'Priya',
    'Nair',
    'Priya Nair',
    'priya.nair@example.com',
    '+91 9123456780',
    '2001-08-20',
    'Female',
    'Regular Shift',
    meta.departments?.[1] || meta.departments?.[0] || 'Sales',
    meta.designations?.[1] || meta.designations?.[0] || 'Sales Executive',
    meta.branches?.[0] || 'Head Office',
    meta.teams?.[0] || 'Sales Team',
    'Harshan S',
    new Date().toISOString().split('T')[0],
    'Full-time',
    'Fresher',
    0,
    0,
    50000,
    'ICICI Bank',
    '123405009876',
    'ICIC0000123',
    'Father - +91 91111 22222',
    '45 Anna Nagar, Chennai, Tamil Nadu',
    'Single',
    'A+'
  ];

  const wsData = [headers, sampleRow1, sampleRow2];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));

  XLSX.utils.book_append_sheet(wb, ws, 'Employee Import');

  // Sheet 2: Guidelines & Available Master Data
  const instructions = [
    ['HRMS EMPLOYEE IMPORT - GUIDELINES & MASTER DATA'],
    [''],
    ['1. REQUIRED FIELDS (*):'],
    ['   - First Name & Last Name (or Full Name)'],
    ['   - Login Email (must be unique)'],
    ['   - Contact No (Phone)'],
    [''],
    ['2. OPTIONAL FIELDS:'],
    ['   - Date of Birth, Gender, Shift Type, Department, Designation, Branch, Salary, Bank Details, etc.'],
    [''],
    ['3. EMPLOYEE CODE:'],
    ['   - Leave blank: System will automatically generate sequential IDs (e.g. EMP0015, EMP0016).'],
    ['   - Enter existing code (e.g. EMP0014): System detects the existing employee and offers to update their details.'],
    [''],
    ['4. MASTER DATA IN YOUR SYSTEM:'],
    ['   Active Departments: ' + (meta.departments?.join(', ') || 'Development, Sales, HR, Marketing')],
    ['   Active Designations: ' + (meta.designations?.slice(0, 10).join(', ') || 'Full Stack Developer, HR Specialist')],
    ['   Active Branches: ' + (meta.branches?.join(', ') || 'Head Office')],
    ['   Shift Types: Regular Shift, Rotational Shift, Contract Shift'],
    ['   Employment Types: Full-time, Part-time, Contract'],
    ['   Gender Options: Male, Female, Other']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Master Data');

  XLSX.writeFile(wb, 'HRMS_Employee_Import_Template.xlsx');
}

/**
 * Export employees array to Excel (.xlsx) using the same format
 */
export function exportEmployeesToExcel(employees = []) {
  if (!employees || employees.length === 0) {
    throw new Error("No employees to export.");
  }

  const exportHeaders = [
    'Employee Code',
    'First Name',
    'Last Name',
    'Full Name',
    'Login Email',
    'Contact No',
    'Date of Birth',
    'Gender',
    'Employee Shift Type',
    'Department',
    'Designation',
    'Branch',
    'Team',
    'Reporting Manager',
    'Joining Date',
    'Employment Type',
    'Experience',
    'Experience Type',
    'Monthly Salary (INR)',
    'Bank Name',
    'Bank Account Number',
    'IFSC Code',
    'Emergency Contact No',
    'Address',
    'Status'
  ];

  const rowsData = employees.map(emp => {
    let bankObj = {};
    if (emp.bank_details) {
      try {
        bankObj = typeof emp.bank_details === 'string' ? JSON.parse(emp.bank_details) : emp.bank_details;
      } catch (e) {
        bankObj = {};
      }
    }

    const nameParts = (emp.name || '').trim().split(/\s+/);
    const firstName = emp.first_name || nameParts[0] || '';
    const lastName = emp.last_name || nameParts.slice(1).join(' ') || '';

    return [
      emp.employee_code || emp.employeeCode || emp.employee_id || emp.employeeId || '',
      firstName,
      lastName,
      emp.name || '',
      emp.email || '',
      emp.phone || '',
      emp.dob ? formatToYmd(emp.dob) : '',
      emp.gender || '',
      emp.shift_type || emp.shiftType || 'Regular Shift',
      emp.dept_name || emp.department || '',
      emp.role_name || emp.designation || '',
      emp.branch_name || emp.branch || '',
      emp.team_name || emp.teamName || '',
      emp.manager_name || emp.managerName || '',
      emp.join_date || emp.joinDate ? formatToYmd(emp.join_date || emp.joinDate) : '',
      emp.employment_type || emp.employmentType || 'Full-time',
      emp.experience || '',
      emp.experience_type || emp.experienceType || 'Experienced',
      emp.salary || 0,
      bankObj.bankName || emp.bank_name || '',
      bankObj.accountNumber || emp.account_number || '',
      bankObj.ifscCode || emp.ifsc_code || '',
      emp.emergency_contact || emp.emergencyContact || '',
      emp.address || '',
      emp.status || 'Active'
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...rowsData]);
  ws['!cols'] = exportHeaders.map(h => ({ wch: Math.max(h.length + 4, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `HRMS_Employees_Export_${todayStr}.xlsx`);
}
