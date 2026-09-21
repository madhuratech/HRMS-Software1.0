const fetch = globalThis.fetch || require('node-fetch');

async function test() {
  const payload = {
    name: 'Standard Structure Test',
    code: 'STR-TEST-1',
    frequency: 'Monthly',
    total_ctc: 50000,
    status: 'Active',
    components: [
      {
        component_id: 1,
        component_name: 'Basic Salary',
        component_type: 'Earning',
        calc_type: 'percentage',
        value: 50,
        percentage_basis: 'ctc',
        enabled: true
      }
    ]
  };

  try {
    const res = await fetch('http://127.0.0.1:5000/app/payroll/structures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'ADMIN',
        'x-employee-id': '1'
      },
      body: JSON.stringify(payload)
    });

    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('RESPONSE BODY:', text);
  } catch (err) {
    console.error('FETCH ERROR:', err);
  }
}

test();
