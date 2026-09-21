const db = require('../config/database');
const Candidate = require('../models/Candidate');
const CandidateService = require('../services/CandidateService');
const EmployeeExperienceService = require('../services/EmployeeExperienceService');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING CANDIDATE-TO-EMPLOYEE CONVERSION TEST SUITE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Experienced Candidate Conversion
    // ----------------------------------------------------
    console.log('--- TEST 1: Experienced Candidate Conversion ---');
    const expCandEmail = `cand_exp_${Date.now()}@test.com`;
    const candInsert = await query(`
      INSERT INTO candidates (
        candidate_name, email, mobile_number, gender, job_position, department_id,
        experience, current_company, current_salary, expected_salary,
        status, resume, original_resume, original_resume_name, created_at
      ) VALUES (?, ?, '9876543210', 'Male', 'Senior Full Stack Developer', 1,
        '4 Years 6 Months', 'ABC Technologies', 800000, 1200000,
        'Applied', '/uploads/test_resume.pdf', '/uploads/test_resume.pdf', 'John_Resume.pdf', NOW())
    `, ['John Experienced', expCandEmail]);
    const expCandidateId = candInsert.insertId;

    // Add 2 previous companies in candidate_experiences
    const exp1Id = await CandidateService.addCandidateExperience(expCandidateId, {
      company_name: 'ABC Technologies',
      designation: 'Senior Developer',
      department: 'Engineering',
      employment_type: 'Full Time',
      start_date: '2022-01-01',
      end_date: '2024-06-30',
      is_currently_working: 0,
      duration_months: 30,
      company_location: 'Chennai',
      reason_for_leaving: 'Career Growth',
      last_drawn_ctc: 800000
    });

    const exp2Id = await CandidateService.addCandidateExperience(expCandidateId, {
      company_name: 'XYZ Solutions',
      designation: 'Junior Developer',
      department: 'Product',
      employment_type: 'Full Time',
      start_date: '2020-01-01',
      end_date: '2021-12-31',
      is_currently_working: 0,
      duration_months: 24,
      company_location: 'Bangalore',
      reason_for_leaving: 'Higher Studies',
      last_drawn_ctc: 500000
    });

    // Execute Conversion
    const convResult1 = await CandidateService.convertToEmployee(expCandidateId, {}, 1);
    console.log('Conversion Result 1:', convResult1);

    // Verify Employee created & candidate_id linked
    const empRows = await query('SELECT * FROM employees WHERE id = ?', [convResult1.employee_id]);
    if (empRows.length === 0) throw new Error('Employee record not found after conversion');
    const emp1 = empRows[0];
    if (emp1.candidate_id !== expCandidateId) throw new Error(`candidate_id not linked properly! Got ${emp1.candidate_id}, expected ${expCandidateId}`);
    if (emp1.experience_type !== 'Experienced') throw new Error(`experience_type expected 'Experienced', got ${emp1.experience_type}`);
    if (emp1.total_experience_years !== 4 || emp1.total_experience_months !== 6) {
      throw new Error(`Total experience summary mismatch: ${emp1.total_experience_years} yrs ${emp1.total_experience_months} mos`);
    }

    // Verify Previous Experiences copied
    const empExpRows = await query('SELECT * FROM employee_previous_experiences WHERE employee_id = ? ORDER BY start_date DESC', [emp1.id]);
    if (empExpRows.length !== 2) throw new Error(`Expected 2 copied previous experience records, got ${empExpRows.length}`);
    if (empExpRows[0].company_name !== 'ABC Technologies' || empExpRows[0].candidate_experience_id !== exp1Id) {
      throw new Error(`First experience mismatch: ${empExpRows[0].company_name}, candidate_exp_id: ${empExpRows[0].candidate_experience_id}`);
    }
    if (empExpRows[1].company_name !== 'XYZ Solutions' || empExpRows[1].candidate_experience_id !== exp2Id) {
      throw new Error(`Second experience mismatch: ${empExpRows[1].company_name}, candidate_exp_id: ${empExpRows[1].candidate_experience_id}`);
    }

    // Verify original candidate data is intact (NOT deleted)
    const candCheck = await query('SELECT * FROM candidates WHERE id = ?', [expCandidateId]);
    if (candCheck.length === 0 || candCheck[0].status !== 'Hired') throw new Error('Original candidate missing or not marked Hired');
    const candExpCheck = await query('SELECT * FROM candidate_experiences WHERE candidate_id = ?', [expCandidateId]);
    if (candExpCheck.length !== 2) throw new Error('Original candidate experiences were modified or deleted!');

    // Verify candidate resume copied to employee_documents as reference
    const docCheck = await query('SELECT * FROM employee_documents WHERE employee_id = ? AND document_type = "Resume"', [emp1.id]);
    if (docCheck.length === 0) throw new Error('Resume was not referenced in employee_documents');
    console.log('✓ TEST 1 PASSED: Experienced Candidate converted successfully with preserved previous experience history.\n');

    // ----------------------------------------------------
    // TEST 2: Fresher Candidate Conversion
    // ----------------------------------------------------
    console.log('--- TEST 2: Fresher Candidate Conversion ---');
    const fresherEmail = `cand_fresher_${Date.now()}@test.com`;
    const fresherInsert = await query(`
      INSERT INTO candidates (
        candidate_name, email, mobile_number, gender, job_position, department_id,
        experience, status, created_at
      ) VALUES (?, ?, '9123456780', 'Female', 'Graduate Trainee Engineer', 1,
        'Fresher', 'Applied', NOW())
    `, ['Alice Fresher', fresherEmail]);
    const fresherCandId = fresherInsert.insertId;

    const convResult2 = await CandidateService.convertToEmployee(fresherCandId, {}, 1);
    const emp2Rows = await query('SELECT * FROM employees WHERE id = ?', [convResult2.employee_id]);
    const emp2 = emp2Rows[0];
    if (emp2.experience_type !== 'Fresher' || emp2.total_experience_years !== 0 || emp2.total_experience_months !== 0) {
      throw new Error(`Fresher experience summary mismatch: ${emp2.experience_type}, ${emp2.total_experience_years} yrs ${emp2.total_experience_months} mos`);
    }
    const fresherExpRows = await query('SELECT * FROM employee_previous_experiences WHERE employee_id = ?', [emp2.id]);
    if (fresherExpRows.length !== 0) throw new Error(`Fresher should have 0 previous experiences, found ${fresherExpRows.length}`);
    console.log('✓ TEST 2 PASSED: Fresher converted cleanly with 0 years 0 months and 0 experience records.\n');

    // ----------------------------------------------------
    // TEST 3: Multiple Conversion Request (Idempotency)
    // ----------------------------------------------------
    console.log('--- TEST 3: Multiple Conversion Request (Idempotency) ---');
    const convResult3 = await CandidateService.convertToEmployee(expCandidateId, {}, 1);
    if (convResult3.employee_id !== convResult1.employee_id) {
      throw new Error(`Idempotency failed: Created new employee ${convResult3.employee_id} instead of reusing ${convResult1.employee_id}`);
    }
    if (convResult3.copied_experiences_count !== 0) {
      throw new Error(`Idempotency failed: Re-copied ${convResult3.copied_experiences_count} experience records!`);
    }
    const emp1ExpCount = await query('SELECT COUNT(*) as c FROM employee_previous_experiences WHERE employee_id = ?', [emp1.id]);
    if (emp1ExpCount[0].c !== 2) throw new Error(`Duplicate experience records found! Count: ${emp1ExpCount[0].c}`);
    console.log('✓ TEST 3 PASSED: Multiple conversion attempts safely reuse employee and prevent duplicate experiences.\n');

    // ----------------------------------------------------
    // TEST 4: Edit Employee Experience (Independence / Isolation)
    // ----------------------------------------------------
    console.log('--- TEST 4: Edit Employee Experience & History Isolation ---');
    const firstEmpExp = empExpRows[0];
    await EmployeeExperienceService.update(firstEmpExp.id, {
      company_name: 'ABC Technologies Global Ltd',
      designation: 'Lead Software Architect',
      verification_status: 'Verified',
      verification_notes: 'Background check verified via HR email'
    }, 1);

    // Verify employee record was updated
    const updatedEmpExp = await EmployeeExperienceService.getById(firstEmpExp.id);
    if (updatedEmpExp.company_name !== 'ABC Technologies Global Ltd' || updatedEmpExp.verification_status !== 'Verified') {
      throw new Error('Employee experience record was not updated properly');
    }

    // Verify candidate original experience remains unchanged
    const origCandExp = await query('SELECT * FROM candidate_experiences WHERE id = ?', [exp1Id]);
    if (origCandExp[0].company_name !== 'ABC Technologies' || origCandExp[0].designation !== 'Senior Developer') {
      throw new Error('Original candidate experience record was mutated!');
    }
    console.log('✓ TEST 4 PASSED: Employee previous experience updated while candidate original record remains completely untouched.\n');

    // ----------------------------------------------------
    // TEST 5: Backend Data Validation
    // ----------------------------------------------------
    console.log('--- TEST 5: Backend Data Validation ---');
    // Test invalid dates (start_date > end_date)
    let dateErrCaught = false;
    try {
      await EmployeeExperienceService.create(emp1.id, {
        company_name: 'Invalid Date Co',
        designation: 'Tester',
        start_date: '2024-05-01',
        end_date: '2023-01-01',
        employment_type: 'Full Time'
      }, 1);
    } catch (e) {
      dateErrCaught = true;
    }
    if (!dateErrCaught) throw new Error('Failed to reject start_date > end_date');

    // Test invalid months (> 11)
    let monthErrCaught = false;
    try {
      await EmployeeExperienceService.updateSummary(emp1.id, {
        total_experience_years: 3,
        total_experience_months: 15
      }, 1);
    } catch (e) {
      monthErrCaught = true;
    }
    if (!monthErrCaught) throw new Error('Failed to reject months > 11');

    // Test relevant experience > total experience
    let relExpErrCaught = false;
    try {
      await EmployeeExperienceService.updateSummary(emp1.id, {
        total_experience_years: 2,
        total_experience_months: 0,
        relevant_experience_years: 5,
        relevant_experience_months: 0
      }, 1);
    } catch (e) {
      relExpErrCaught = true;
    }
    if (!relExpErrCaught) throw new Error('Failed to reject relevant_experience > total_experience');
    console.log('✓ TEST 5 PASSED: Strict backend validations enforced for dates, months, and relevant vs total experience.\n');

    // ----------------------------------------------------
    // TEST 6: Transaction Failure & Rollback Test
    // ----------------------------------------------------
    console.log('--- TEST 6: Transaction Failure & Rollback Test ---');
    const failCandEmail = `cand_fail_${Date.now()}@test.com`;
    const failInsert = await query(`
      INSERT INTO candidates (
        candidate_name, email, mobile_number, gender, job_position, department_id,
        experience, current_company, status, created_at
      ) VALUES (?, ?, '9999999999', 'Male', 'Test Engineer', 1, '2 Years', 'Fail Corp', 'Applied', NOW())
    `, ['Fail Candidate', failCandEmail]);
    const failCandId = failInsert.insertId;

    // Simulate error during conversion using Candidate.withTransaction
    let rollbackVerified = false;
    try {
      await Candidate.withTransaction(async (conn) => {
        await conn.query(
          'INSERT INTO employees (name, email, status, candidate_id) VALUES (?, ?, "Active", ?)',
          ['Fail Candidate Temp', failCandEmail, failCandId]
        );
        // Intentional error inside transaction
        throw new Error('Simulated failure during experience processing');
      });
    } catch (err) {
      rollbackVerified = true;
    }

    if (!rollbackVerified) throw new Error('Rollback was not triggered');
    const checkRolledBackEmp = await query('SELECT id FROM employees WHERE email = ?', [failCandEmail]);
    if (checkRolledBackEmp.length > 0) throw new Error('Rollback failed: partial employee record remained in database!');
    console.log('✓ TEST 6 PASSED: Transaction rollback correctly rolled back all partial records on error.\n');

    console.log('====================================================');
    console.log('ALL CANDIDATE CONVERSION TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

runTests();
