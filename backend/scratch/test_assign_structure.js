const http = require('http');

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    if (bodyData) req.write(JSON.stringify(bodyData));
    req.end();
  });
}

async function testAssign() {
  console.log('Testing assignStructure endpoint...');
  const res = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/structures/assign',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'ADMIN',
      'x-employee-id': '1'
    }
  }, {
    employee_id: 11,
    structure_id: 13,
    effective_from: '2026-09-12',
    custom_gross: 65000
  });

  console.log('Assign status:', res.status, 'Body:', res.body);
  if (res.status === 200 && res.body.success) {
    console.log('✓ PASS: Assign structure works properly!');
  } else {
    throw new Error('Failed to assign structure');
  }
}

testAssign().catch(console.error);
