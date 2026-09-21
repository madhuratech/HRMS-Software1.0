const http = require('http');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "madhura_super_secret_key_2026";
const token = jwt.sign(
  { id: 1, email: 'admin@madhuratech.com', role: 'SUPER_ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (dataString) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/app' + path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function run() {
  console.log('Testing Employee Creation with Previous Experience...');

  const uniqueEmail = `test_engineer_${Date.now()}@madhuraa.com`;
  const payload = {
    name: 'Vikramaditya Verma',
    email: uniqueEmail,
    phone: '+91 98888 77777',
    dob: '1993-06-15',
    joinDate: '2026-09-01',
    gender: 'Male',
    employmentType: 'Full-time',
    experience_type: 'Experienced',
    total_experience_years: 4,
    total_experience_months: 8,
    relevant_experience_years: 4,
    relevant_experience_months: 0,
    previous_experiences: [
      {
        company_name: 'Tech Mahindra Ltd',
        designation: 'Software Engineer',
        department: 'Engineering',
        employment_type: 'Full-time',
        start_date: '2021-01-01',
        end_date: '2023-06-30',
        total_years: 2,
        total_months: 6,
        relevant_years: 2,
        relevant_months: 6,
        company_location: 'Bangalore',
        last_drawn_ctc: '750000',
        currency: 'INR'
      },
      {
        company_name: 'Wipro Digital',
        designation: 'Senior Software Engineer',
        department: 'Cloud Services',
        employment_type: 'Full-time',
        start_date: '2023-07-01',
        end_date: '2025-08-31',
        total_years: 2,
        total_months: 2,
        relevant_years: 2,
        relevant_months: 0,
        company_location: 'Hyderabad',
        last_drawn_ctc: '1200000',
        currency: 'INR'
      }
    ],
    shiftType: 'Regular Shift',
    salary: 95000,
    address: '123 Tech Park, Bangalore',
    department: 'Engineering',
    designation: 'Senior Developer'
  };

  try {
    const res = await makeRequest('POST', '/employees', payload);
    console.log('Create Status:', res.status);
    console.log('Create Response:', res.body);

    const empId = res.body.id;
    console.log(`Created Employee ID: ${empId}`);

    // Fetch previous experiences for this created employee
    const expRes = await makeRequest('GET', `/employees/${empId}/previous-experiences`);
    console.log('Fetched Previous Experiences Status:', expRes.status);
    console.log('Fetched Experiences Count:', expRes.body.experiences?.length);
    console.log('Summary:', expRes.body.summary);

    if (expRes.body.experiences && expRes.body.experiences.length === 2) {
      console.log('✓ SUCCESS: 2 previous company records successfully stored and retrieved for new employee!');
    } else {
      console.error('✕ FAILED: Expected 2 previous experience records');
    }

    // Fetch profile for this employee
    const profileRes = await makeRequest('GET', `/employees/${empId}/profile`);
    console.log('Profile Experience Data:', {
      experience: profileRes.body.experience,
      experienceType: profileRes.body.experienceType,
      totalExperienceYears: profileRes.body.totalExperienceYears,
      totalExperienceMonths: profileRes.body.totalExperienceMonths,
      relevantExperienceYears: profileRes.body.relevantExperienceYears,
      relevantExperienceMonths: profileRes.body.relevantExperienceMonths
    });

  } catch (err) {
    console.error('Test error:', err);
  }
}

run();
