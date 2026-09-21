const fetch = globalThis.fetch || require('node-fetch');

async function testComponentId() {
  const BASE = 'http://127.0.0.1:5000/app/payroll/structures';

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'ADMIN',
      'x-employee-id': '1'
    },
    body: JSON.stringify({
      name: 'Test Struct ComponentId',
      code: 'TEST-COMP-ID-1',
      total_ctc: 50000,
      components: [
        {
          componentId: 1,
          value: 50
        }
      ]
    })
  });
  console.log('STATUS with componentId:', res.status);
  const data = await res.json();
  console.log('RESPONSE with componentId:', data);
}

testComponentId();
