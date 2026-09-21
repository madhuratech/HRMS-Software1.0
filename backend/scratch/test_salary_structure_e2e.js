const http = require('http');

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== SALARY STRUCTURE VERIFICATION TESTS ===\n');
  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'ADMIN',
    'x-employee-id': '1'
  };

  // Test 1: Components loading
  console.log('1. Testing GET /app/payroll/components...');
  const compRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/components',
    method: 'GET',
    headers: adminHeaders
  });
  console.log(`Status: ${compRes.status}, Found components: ${Array.isArray(compRes.body) ? compRes.body.length : 0}`);
  if (compRes.status !== 200 || !Array.isArray(compRes.body) || compRes.body.length === 0) {
    throw new Error('Failed to load components: ' + JSON.stringify(compRes.body));
  }
  const sampleComponents = compRes.body.slice(0, 3);
  console.log('Sample components:', sampleComponents.map(c => ({ id: c.id, name: c.name, type: c.type })));
  console.log('✓ PASS: Components loaded successfully\n');

  // Test 2: Validation - Missing structure name returns 400
  console.log('2. Testing POST /app/payroll/structures without name (expect 400)...');
  const invalidNameRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/structures',
    method: 'POST',
    headers: adminHeaders
  }, {
    name: '',
    total_ctc: 50000
  });
  console.log(`Status: ${invalidNameRes.status}, Response:`, invalidNameRes.body);
  if (invalidNameRes.status !== 400) {
    throw new Error(`Expected 400 for empty name, got ${invalidNameRes.status}`);
  }
  console.log('✓ PASS: Empty structure name rejected with 400\n');

  // Test 3: Validation - Invalid component ID returns 404 / 400
  console.log('3. Testing POST /app/payroll/structures with non-existent component (expect 404)...');
  const invalidCompRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/structures',
    method: 'POST',
    headers: adminHeaders
  }, {
    name: 'Invalid Comp Test Structure',
    code: 'TEST-INVALID-' + Date.now(),
    total_ctc: 60000,
    components: [
      { componentId: 9999999, value: 50, calc_type: 'percentage' }
    ]
  });
  console.log(`Status: ${invalidCompRes.status}, Response:`, invalidCompRes.body);
  if (invalidCompRes.status !== 404 && invalidCompRes.status !== 400) {
    throw new Error(`Expected 404/400 for invalid component, got ${invalidCompRes.status}`);
  }
  console.log('✓ PASS: Invalid component rejected properly\n');

  // Test 4: Create Structure with valid components and auto-generated code
  console.log('4. Testing POST /app/payroll/structures with valid components...');
  const createPayload = {
    structureName: 'Full Stack Engineer Band 2',
    totalCtc: 75000,
    frequency: 'Monthly',
    status: 'Active',
    salaryComponents: sampleComponents.map((c, i) => ({
      componentId: c.id,
      calc_type: c.calc_type || 'percentage',
      value: (i + 1) * 20,
      percentage_basis: 'basic'
    }))
  };
  const createRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/structures',
    method: 'POST',
    headers: adminHeaders
  }, createPayload);
  console.log(`Status: ${createRes.status}, Response:`, createRes.body);
  if (createRes.status !== 201 || !createRes.body.success) {
    throw new Error('Failed to create structure: ' + JSON.stringify(createRes.body));
  }
  const createdId = createRes.body.data ? createRes.body.data.id : createRes.body.id;
  const createdCode = createRes.body.data ? createRes.body.data.code : createRes.body.code;
  console.log(`Created Structure ID: ${createdId}, Code: ${createdCode}`);
  console.log('✓ PASS: Salary structure created successfully with status 201\n');

  // Test 5: Verify GET /app/payroll/structures/:id returns structure with components
  console.log(`5. Testing GET /app/payroll/structures/${createdId}...`);
  const getRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/app/payroll/structures/${createdId}`,
    method: 'GET',
    headers: adminHeaders
  });
  console.log(`Status: ${getRes.status}, Data:`, {
    id: getRes.body.data?.id,
    name: getRes.body.data?.name,
    code: getRes.body.data?.code,
    total_ctc: getRes.body.data?.total_ctc,
    components_count: getRes.body.data?.components?.length
  });
  if (getRes.status !== 200 || !getRes.body.data?.components?.length) {
    throw new Error('Failed to get structure with components');
  }
  console.log('✓ PASS: Salary structure retrieved with all attached components\n');

  // Test 6: Duplicate Code returns 409 Conflict (not 500)
  console.log(`6. Testing POST /app/payroll/structures with DUPLICATE code '${createdCode}' (expect 409)...`);
  const dupRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/structures',
    method: 'POST',
    headers: adminHeaders
  }, {
    name: 'Duplicate Code Structure',
    code: createdCode,
    total_ctc: 80000,
    components: []
  });
  console.log(`Status: ${dupRes.status}, Response:`, dupRes.body);
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate code, got ${dupRes.status}`);
  }
  console.log('✓ PASS: Duplicate code properly rejected with 409 Conflict\n');

  // Test 7: Update Structure
  console.log(`7. Testing PUT /app/payroll/structures/${createdId}...`);
  const updateRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/app/payroll/structures/${createdId}`,
    method: 'PUT',
    headers: adminHeaders
  }, {
    name: 'Senior Full Stack Engineer Band 2 (Updated)',
    total_ctc: 85000,
    frequency: 'Monthly',
    status: 'Active',
    components: [
      { component_id: sampleComponents[0].id, calc_type: 'percentage', value: 45 }
    ]
  });
  console.log(`Status: ${updateRes.status}, Response:`, updateRes.body);
  if (updateRes.status !== 200 || !updateRes.body.success) {
    throw new Error('Failed to update structure: ' + JSON.stringify(updateRes.body));
  }
  console.log('✓ PASS: Salary structure updated successfully\n');

  // Test 8: Delete Structure
  console.log(`8. Testing DELETE /app/payroll/structures/${createdId}...`);
  const delRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/app/payroll/structures/${createdId}`,
    method: 'DELETE',
    headers: adminHeaders
  });
  console.log(`Status: ${delRes.status}, Response:`, delRes.body);
  if (delRes.status !== 200 || !delRes.body.success) {
    throw new Error('Failed to delete structure: ' + JSON.stringify(delRes.body));
  }
  console.log('✓ PASS: Salary structure deleted successfully\n');

  // Test 9: Employee without create permission -> 403 Forbidden
  console.log('9. Testing direct POST /app/payroll/structures with unauthorized Employee role (expect 403)...');
  const unauthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/app/payroll/structures',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'EMPLOYEE',
      'x-employee-id': '99'
    }
  }, {
    name: 'Hacked Structure',
    total_ctc: 100000
  });
  console.log(`Status: ${unauthRes.status}, Response:`, unauthRes.body);
  if (unauthRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for unauthorized employee, got ${unauthRes.status}`);
  }
  console.log('✓ PASS: Employee without create permission rejected with 403 Forbidden\n');

  console.log('ALL SALARY STRUCTURE TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
