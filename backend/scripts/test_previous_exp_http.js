const http = require('http');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "madhura_super_secret_key_2026";
const token = jwt.sign(
  { id: 1, email: 'admin@madhuratech.com', role: 'SUPER_ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function makeRequest(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders
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

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function testHttpEndpoints() {
  console.log('Testing HTTP Endpoints on port 5000...');

  // 1. Test GET /employees/1/previous-experiences
  const getRes = await makeRequest('GET', '/employees/1/previous-experiences');
  console.log('GET /employees/1/previous-experiences -> Status:', getRes.status, 'Summary:', getRes.body?.summary);

  // 2. Test POST /employees/1/previous-experiences
  const postRes = await makeRequest('POST', '/employees/1/previous-experiences', {
    company_name: 'Tech Innovators Inc',
    designation: 'Senior Cloud Engineer',
    department: 'Cloud Ops',
    employment_type: 'Full Time',
    start_date: '2021-03-01',
    end_date: '2023-08-31',
    is_currently_working: 0,
    company_location: 'Hyderabad',
    reason_for_leaving: 'Relocation',
    last_drawn_ctc: 1400000,
    verification_status: 'Verified',
    verification_notes: 'HR background check verified'
  });
  console.log('POST /employees/1/previous-experiences -> Status:', postRes.status, 'Created Exp ID:', postRes.body?.experience?.id);
  const expId = postRes.body?.experience?.id;

  // 3. Test PUT /employees/1/previous-experiences/:expId
  if (expId) {
    const putRes = await makeRequest('PUT', `/employees/1/previous-experiences/${expId}`, {
      designation: 'Principal Cloud Architect',
      verification_status: 'Verified'
    });
    console.log('PUT /employees/1/previous-experiences/' + expId + ' -> Status:', putRes.status, 'Updated Designation:', putRes.body?.experience?.designation);

    // 4. Test DELETE /employees/1/previous-experiences/:expId
    const delRes = await makeRequest('DELETE', `/employees/1/previous-experiences/${expId}`);
    console.log('DELETE /employees/1/previous-experiences/' + expId + ' -> Status:', delRes.status, 'Message:', delRes.body?.message);
  }

  // 5. Test Forbidden Employee Role check
  const empToken = jwt.sign(
    { id: 11, email: 'emp@madhuratech.com', role: 'EMPLOYEE' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const forbiddenRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/app/employees/1/previous-experiences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${empToken}`,
        'Content-Type': 'application/json',
        'x-user-role': 'EMPLOYEE'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.write(JSON.stringify({ company_name: 'Test', designation: 'Dev', start_date: '2023-01-01' }));
    req.end();
  });
  console.log('RBAC Check (Employee Role Edit Blocked) -> Status:', forbiddenRes.status, '(Expected 403)');

  console.log('HTTP Endpoint verification complete!');
  process.exit(0);
}

testHttpEndpoints().catch(err => {
  console.error('HTTP Test failed:', err);
  process.exit(1);
});
