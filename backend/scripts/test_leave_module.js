require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || "madhura_super_secret_key_2026";
const BASE_URL = 'http://127.0.0.1:5000/app';

// Tokens
const tokenEmpA = jwt.sign({
  id: 10,
  userId: 10,
  employee_id: 10,
  employeeId: 10,
  employee_code: 'EMP0010',
  name: 'Dhilipan P',
  email: 'dhilipanmadhuratech@gmail.com',
  role: 'EMPLOYEE'
}, JWT_SECRET, { expiresIn: '1h' });

const tokenEmpB = jwt.sign({
  id: 11,
  userId: 11,
  employee_id: 11,
  employeeId: 11,
  employee_code: 'EMP0011',
  name: 'Dinakaran R',
  email: 'dinamadhuratech@gmail.com',
  role: 'EMPLOYEE'
}, JWT_SECRET, { expiresIn: '1h' });

const tokenAdmin = jwt.sign({
  id: 1,
  userId: 1,
  employee_id: 1,
  employeeId: 1,
  name: 'Super Admin',
  email: 'admin@madhuratech.com',
  role: 'SUPER_ADMIN'
}, JWT_SECRET, { expiresIn: '1h' });

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE LEAVE MODULE TEST SUITE');
  console.log('========================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message, detail = '') {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      if (detail) console.error(`   Details:`, detail);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // ISSUE 1: EMPLOYEE LEAVE APPLICATION & SECURITY ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- TESTING ISSUE 1: EMPLOYEE LEAVE APPLICATION & SECURITY ---');

    // Test 1.1: Employee A can fetch leave types
    const typesRes = await req('/leaves/types', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    assert(typesRes.status === 200 && Array.isArray(typesRes.data) && typesRes.data.length >= 7,
      'Employee A can load master Leave Types without 403 Forbidden',
      typesRes.data
    );

    // Test 1.2: Employee A attempts to submit on behalf of Employee B (ID Spoofing) -> MUST return 403
    const spoofRes = await req('/leaves/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 11, // Trying to submit for Employee B
        leave_type_code: 'CL',
        start_date: '2026-10-01',
        end_date: '2026-10-02',
        reason: 'Spoofed request attempt'
      })
    });
    assert(spoofRes.status === 403,
      'Backend rejects Employee A attempting to submit leave for Employee B with 403 Forbidden',
      `Got status ${spoofRes.status}: ${JSON.stringify(spoofRes.data)}`
    );

    // Test 1.3: Employee A attempts to view Employee B balances -> MUST return 403
    const foreignBalRes = await req('/leaves/balances/11', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    assert(foreignBalRes.status === 403,
      'Backend rejects Employee A attempting to view Employee B balances with 403 Forbidden',
      `Got status ${foreignBalRes.status}: ${JSON.stringify(foreignBalRes.data)}`
    );

    // -------------------------------------------------------------
    // ISSUE 2: EMPLOYEE-SPECIFIC LEAVE BALANCE & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- TESTING ISSUE 2: EMPLOYEE-SPECIFIC LEAVE BALANCE & SUFFICIENCY ---');

    // Test 2.1: Fetch Employee A's balances -> Must match CL=5, SL=3, EL=8
    const balARes = await req('/leaves/balances/10', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    const clA = (balARes.data || []).find(b => b.leave_code === 'CL');
    const slA = (balARes.data || []).find(b => b.leave_code === 'SL');
    const elA = (balARes.data || []).find(b => b.leave_code === 'EL');
    assert(balARes.status === 200 && clA?.days_remaining === 5 && slA?.days_remaining === 3 && elA?.days_remaining === 8,
      'Employee A (Dhilipan P) has correct specific balances: CL=5, SL=3, EL=8',
      `CL: ${clA?.days_remaining}, SL: ${slA?.days_remaining}, EL: ${elA?.days_remaining}`
    );

    // Test 2.2: Fetch Employee B's balances -> Must have CL=12, SL=10, EL=15 (not Employee A's balances!)
    const balBRes = await req('/leaves/balances/11', {
      headers: { Authorization: `Bearer ${tokenEmpB}` }
    });
    const clB = (balBRes.data || []).find(b => b.leave_code === 'CL');
    const slB = (balBRes.data || []).find(b => b.leave_code === 'SL');
    const elB = (balBRes.data || []).find(b => b.leave_code === 'EL');
    assert(balBRes.status === 200 && clB?.days_remaining === 12 && slB?.days_remaining === 10 && elB?.days_remaining === 15,
      'Employee B (Dinakaran R) has distinct employee-specific balances: CL=12, SL=10, EL=15',
      `CL: ${clB?.days_remaining}, SL: ${slB?.days_remaining}, EL: ${elB?.days_remaining}`
    );

    // Test 2.3: Date Range validation (end_date < start_date)
    const invalidDateRes = await req('/leaves/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 10,
        leave_type_code: 'CL',
        start_date: '2026-10-10',
        end_date: '2026-10-05',
        reason: 'End date before start date'
      })
    });
    assert(invalidDateRes.status === 400,
      'Backend rejects invalid date range where End Date is before Start Date',
      invalidDateRes.data
    );

    // Test 2.4: Insufficient Balance Rejection (Requested 10 days of CL, available is 5)
    const excessRes = await req('/leaves/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 10,
        leave_type_code: 'CL',
        start_date: '2026-10-01',
        end_date: '2026-10-10', // 10 days
        reason: 'Requested more than available'
      })
    });
    assert(excessRes.status === 400 && String(excessRes.data.message || '').includes('Insufficient leave balance'),
      'Backend rejects application exceeding available balance with "Insufficient leave balance."',
      excessRes.data
    );

    // Test 2.5: Valid Application (Requested 2 days of CL, available is 5)
    const validAppRes = await req('/leaves/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 10,
        leave_type_code: 'CL',
        start_date: '2026-10-12',
        end_date: '2026-10-13', // 2 days
        reason: 'Valid personal errand'
      })
    });
    const appId = validAppRes.data?.id;
    assert(validAppRes.status === 200 && appId,
      'Employee A submits valid leave application within balance limits successfully',
      validAppRes.data
    );

    // Test 2.6: Status change & balance sync (Admin approves -> balance deducted)
    const approveRes = await req(`/leaves/applications/${appId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: 'Approved', approved_by: 1 })
    });
    assert(approveRes.status === 200,
      'Admin approves leave application successfully',
      approveRes.data
    );

    // Verify CL balance was deducted from 5 to 3
    const balAfterApprove = await req('/leaves/balances/10', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    const clAfter = (balAfterApprove.data || []).find(b => b.leave_code === 'CL');
    assert(clAfter?.days_remaining === 3,
      'CL balance for Employee A accurately deducted from 5 to 3 upon approval',
      `Current remaining: ${clAfter?.days_remaining}`
    );

    // Test 2.7: Restoration on rejection (Admin sets to Rejected -> balance restored from 3 to 5)
    const rejectRes = await req(`/leaves/applications/${appId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: 'Rejected', approved_by: 1 })
    });
    const balAfterReject = await req('/leaves/balances/10', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    const clRestored = (balAfterReject.data || []).find(b => b.leave_code === 'CL');
    assert(clRestored?.days_remaining === 5,
      'CL balance for Employee A restored from 3 back to 5 upon rejection',
      `Current remaining: ${clRestored?.days_remaining}`
    );

    // Clean up test application
    await new Promise(r => db.query("DELETE FROM leave_applications WHERE id = ?", [appId], () => r()));

    // -------------------------------------------------------------
    // ISSUE 3: COMP-OFF MODULE
    // -------------------------------------------------------------
    console.log('\n--- TESTING ISSUE 3: COMP-OFF MODULE ---');

    // Test 3.1: Employee A creates a Comp-Off request
    const testWorkedDate = '2026-09-06';
    // Remove any leftover from prior runs
    await new Promise(r => db.query("DELETE FROM comp_off_requests WHERE employee_id = 10 AND worked_date = ?", [testWorkedDate], () => r()));

    const compRes = await req('/leaves/comp-off', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 10,
        worked_date: testWorkedDate,
        total_days: '1',
        reason: 'Weekend server migration deployment support'
      })
    });
    const compId = compRes.data?.id;
    assert(compRes.status === 200 && compId,
      'Employee A submits Comp-Off request successfully',
      compRes.data
    );

    // Test 3.2: Duplicate submission prevention for the same worked date
    const dupCompRes = await req('/leaves/comp-off', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 10,
        worked_date: testWorkedDate,
        total_days: '1',
        reason: 'Duplicate attempt'
      })
    });
    assert(dupCompRes.status === 400 && String(dupCompRes.data.message || '').includes('already exists'),
      'Backend rejects duplicate Comp-Off submission for the same worked date',
      dupCompRes.data
    );

    // Test 3.3: Employee A attempts to submit comp-off for Employee B -> MUST return 403
    const spoofCompRes = await req('/leaves/comp-off', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({
        employee_id: 11, // Spoofing Employee B
        worked_date: '2026-09-07',
        total_days: '1',
        reason: 'Spoofed comp off'
      })
    });
    assert(spoofCompRes.status === 403,
      'Backend rejects Employee A attempting to create Comp-Off for Employee B with 403 Forbidden',
      spoofCompRes.data
    );

    // Test 3.4: Employee A fetches comp-off requests -> Scoped to Employee A
    const listCompRes = await req('/leaves/comp-off', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    const allBelongToA = (listCompRes.data || []).every(c => c.employee_id === 10);
    assert(listCompRes.status === 200 && (listCompRes.data || []).length > 0 && allBelongToA,
      'Employee A comp-off list contains ONLY their own records',
      `Found ${(listCompRes.data || []).length} records, all belong to Employee A: ${allBelongToA}`
    );

    // Test 3.5: Employee A attempts to approve own request -> MUST return 403 Forbidden
    const unauthApprove = await req(`/leaves/comp-off/${compId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenEmpA}` },
      body: JSON.stringify({ status: 'Approved' })
    });
    assert(unauthApprove.status === 403,
      'Backend rejects unauthorized Employee attempting to approve Comp-Off with 403 Forbidden',
      unauthApprove.data
    );

    // Test 3.6: Admin approves Comp-Off request -> Status Approved & credits COMP balance
    const adminCompApprove = await req(`/leaves/comp-off/${compId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: 'Approved', approved_by: 'Super Admin' })
    });
    assert(adminCompApprove.status === 200,
      'Admin approves Comp-Off request successfully',
      adminCompApprove.data
    );

    // Verify record persistence and COMP balance crediting
    const verifyCompReq = await new Promise(r => db.query("SELECT * FROM comp_off_requests WHERE id = ?", [compId], (err, rows) => r(rows && rows[0])));
    assert(verifyCompReq && verifyCompReq.status === 'Approved',
      'Comp-Off request persists with Approved status in database',
      verifyCompReq
    );

    // Verify COMP leave balance credited
    const balCompRes = await req('/leaves/balances/10', {
      headers: { Authorization: `Bearer ${tokenEmpA}` }
    });
    const compBal = (balCompRes.data || []).find(b => b.leave_code === 'COMP');
    assert(compBal && compBal.days_remaining >= 11,
      'Comp-Off days (1 day) successfully credited to Employee A COMP leave balance (from 10 to 11)',
      `COMP days remaining: ${compBal?.days_remaining}`
    );

    // Clean up test comp-off
    await new Promise(r => db.query("DELETE FROM comp_off_requests WHERE id = ?", [compId], () => r()));
    // Reset COMP balance back to 10
    await new Promise(r => db.query("UPDATE leave_balances SET days_remaining = 10 WHERE employee_id = 10 AND leave_type_id = (SELECT id FROM leave_types WHERE code = 'COMP' LIMIT 1)", () => r()));

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    console.log('\n========================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
