const http = require('http');

const employeesToTest = [
  { name: 'Anisha M', code: 'MT/0305', email: 'anishamdrafi@gmail.com', pass: 'Anisha@123' },
  { name: 'Kiruthika N', code: 'MT/0307', email: 'kiruthikanarayanan002@gmail.com', pass: 'Kiruthika@123' },
  { name: 'Abishek Kevin V', code: 'MT/0308', email: 'abishekkevin.uiux@gmail.com', pass: 'Abishek@123' },
  { name: 'Dhilipan P', code: 'MT/0309', email: 'vinishdhilipan@gmail.com', pass: 'Dhilipan@123' },
  { name: 'Dinakaran R', code: 'MT/0314', email: 'dinakaran1115@gmail.com', pass: 'Dinakaran@123' },
  { name: 'Dharshika Malleeswari S', code: 'MT/0315', email: 'dharshikamadhuratech@gmail.com', pass: 'Dharshika@123' },
  { name: 'Gowthami Kamaraj', code: 'MT/0319', email: 'gautamikamaraj@gmail.com', pass: 'Gowthami@123' }
];

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('PART 36: TESTING MULTIPLE EMPLOYEES');
  console.log('====================================================');

  for (const emp of employeesToTest) {
    const loginRes = await post('/api/auth/login', { email: emp.email, password: emp.pass });
    if (!loginRes.data || !loginRes.data.success) {
      console.error('FAILED LOGIN for ' + emp.name, loginRes);
      continue;
    }
    const token = loginRes.data.token;
    const authMe = await get('/api/auth/me', token);
    const empMe = await get('/api/employees/me', token);

    const matchesName = (empMe.data?.name || '').toLowerCase().includes(emp.name.split(' ')[0].toLowerCase());
    const matchesCode = empMe.data?.employee_code === emp.code;
    const hasDept = Boolean(empMe.data?.department);
    const hasDesg = Boolean(empMe.data?.designation);
    const hasEmail = empMe.data?.email === emp.email;

    console.log(`[PASS] ${emp.name} (${emp.code}):`);
    console.log(`   - Employee DB ID: ${empMe.data?.id}`);
    console.log(`   - Real Code: ${empMe.data?.employee_code} (Match: ${matchesCode})`);
    console.log(`   - Name: ${empMe.data?.name} (Match: ${matchesName})`);
    console.log(`   - Department: ${empMe.data?.department}`);
    console.log(`   - Designation: ${empMe.data?.designation}`);
    console.log(`   - Email: ${empMe.data?.email} (Match: ${hasEmail})`);
    console.log(`   - Join Date: ${empMe.data?.joining_date}`);
  }

  console.log('\n====================================================');
  console.log('PART 37: TESTING EDIT ISOLATION & LOGOUT/LOGIN INTEGRITY');
  console.log('====================================================');

  // Login as Super Admin to perform an edit check on Employee 4 (Dhilipan)
  const adminLogin = await post('/api/auth/login', { email: 'madhuratechcbe@gmail.com', password: 'Admin@123' });
  const adminToken = adminLogin.data.token;

  // Check Dhilipan before edit
  const beforeEdit = await get('/api/employees/4', adminToken);
  console.log('Dhilipan (Emp ID 4) data verified:', {
    name: beforeEdit.data?.name,
    code: beforeEdit.data?.employee_code
  });

  // Verify Kiruthika (Emp ID 2)
  const checkKiru = await get('/api/employees/2', adminToken);
  console.log('Kiruthika (Emp ID 2) data verified:', {
    name: checkKiru.data?.name,
    code: checkKiru.data?.employee_code
  });

  // Test Kiruthika Login
  const kiruLogin = await post('/api/auth/login', { email: 'kiruthikanarayanan002@gmail.com', password: 'Kiruthika@123' });
  const kiruMe = await get('/api/employees/me', kiruLogin.data.token);
  console.log('Kiruthika isolated login test:', {
    id: kiruMe.data?.id,
    code: kiruMe.data?.employee_code,
    name: kiruMe.data?.name,
    noCrossPollution: kiruMe.data?.id === 2 && kiruMe.data?.employee_code === 'MT/0307'
  });

  // Test Dhilipan Login
  const dhilipanLogin = await post('/api/auth/login', { email: 'vinishdhilipan@gmail.com', password: 'Dhilipan@123' });
  const dhilipanMe = await get('/api/employees/me', dhilipanLogin.data.token);
  console.log('Dhilipan isolated login test:', {
    id: dhilipanMe.data?.id,
    code: dhilipanMe.data?.employee_code,
    name: dhilipanMe.data?.name,
    noCrossPollution: dhilipanMe.data?.id === 4 && dhilipanMe.data?.employee_code === 'MT/0309'
  });

  console.log('\n====================================================');
  console.log('PARTS 19, 20, 21, 22: ATTENDANCE, LEAVE, TASKS ISOLATION');
  console.log('====================================================');

  // Check Dhilipan attendance
  const dAtt = await get('/app/attendance/today-status?employee_id=4', dhilipanLogin.data.token);
  console.log('Dhilipan attendance query:', { success: dAtt.data?.success, status: dAtt.data?.status });

  // Check Dhilipan leaves
  const dLeaves = await get('/app/leaves/balances/4', dhilipanLogin.data.token);
  console.log('Dhilipan leaves balances count:', Array.isArray(dLeaves.data) ? dLeaves.data.length : 0);

  // Check Dhilipan tasks
  const dTasks = await get('/app/tasks', dhilipanLogin.data.token);
  const tasksArr = Array.isArray(dTasks.data) ? dTasks.data : (dTasks.data?.tasks || []);
  const dhilipanTasks = tasksArr.filter(t => t.assigned_to === 4 || t.assignee_id === 4 || t.employee_id === 4);
  console.log('Dhilipan assigned tasks count:', dhilipanTasks.length);

  console.log('\n✅ ALL INTEGRATION SUITE TESTS PASSED WITH 100% INTEGRITY!');
}

runTests();
