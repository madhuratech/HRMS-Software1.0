const fetch = globalThis.fetch || require('node-fetch');

async function testPerms() {
  const BASE = 'http://127.0.0.1:5000/app/payroll/structures';

  // 1. Employee -> should be 403
  const empRes = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'EMPLOYEE',
      'x-employee-id': '10'
    },
    body: JSON.stringify({ name: 'Test Struct' })
  });
  console.log('EMPLOYEE POST status:', empRes.status);

  // 2. Admin -> should pass permission check
  const adminRes = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'ADMIN',
      'x-employee-id': '1'
    },
    body: JSON.stringify({})
  });
  console.log('ADMIN POST (empty body) status:', adminRes.status);
  const adminData = await adminRes.json();
  console.log('ADMIN POST response:', adminData);
}

testPerms();
