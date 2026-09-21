const express = require('express');
const router = express.Router();
const RequirementController = require('../controllers/RequirementController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateRequirement } = require('../validators/requirementValidator');
const upload = require('../utils/fileUpload');

const db = require('../config/database');

router.get('/meta/all', authenticateJWT, (req, res) => {
  const db = require('../config/database');

  db.query("SELECT id, role_name as name, department, role_code as code FROM designations WHERE status = 'Active' OR status IS NULL ORDER BY role_name ASC", (err, desigs) => {
    db.query("SELECT id, COALESCE(dept_name, department_name) as name, code FROM departments WHERE status = 'Active' OR status IS NULL ORDER BY dept_name ASC", (err, depts) => {
      db.query("SELECT id, branch_name as name FROM branches WHERE status = 'Active' OR status IS NULL", (err, branches) => {
        db.query(`
          SELECT 
            e.id, 
            e.name, 
            COALESCE(des.role_name, '') as role_name, 
            COALESCE(d.dept_name, '') as dept_name,
            COALESCE(u.role, '') as user_role
          FROM employees e
          LEFT JOIN departments d ON e.department_id = d.id
          LEFT JOIN designations des ON e.designation_id = des.id
          LEFT JOIN users u ON (u.employee_id = e.id OR u.email = e.email)
          WHERE e.status = 'Active' OR e.status IS NULL
          ORDER BY e.name ASC
        `, (err, allEmps) => {
          db.query("SELECT id, company_name as name FROM company_profile LIMIT 1", (err, companies) => {
            const employees = (allEmps || []).map(e => ({ id: e.id, name: e.name }));
            
            // Filter strictly HR role / HR department employees for Hiring Manager dropdown
            let hrEmployees = (allEmps || []).filter(e => {
              const r = (e.role_name || e.user_role || '').toUpperCase();
              const d = (e.dept_name || '').toUpperCase();
              return r.includes('HR') || r.includes('HUMAN RESOURCE') || r.includes('RECRUIT') || r.includes('TALENT') ||
                     d.includes('HR') || d.includes('HUMAN RESOURCE');
            }).map(e => ({ id: e.id, name: e.name }));

            // If no designated HR role is found, fallback to all employees/admin
            if (hrEmployees.length === 0) {
              hrEmployees = employees;
            }

            res.json({
              designations: (desigs && desigs.length > 0) ? desigs : [
                { id: 1, name: 'Team Leader' },
                { id: 2, name: 'Senior Developer' },
                { id: 3, name: 'Software Engineer' },
                { id: 4, name: 'HR Executive' }
              ],
              departments: (depts && depts.length > 0) ? depts : [
                { id: 1, name: 'Engineering' },
                { id: 2, name: 'Human Resources' },
                { id: 3, name: 'Design' },
                { id: 4, name: 'Finance' }
              ],
              branches: (branches && branches.length > 0) ? branches : [
                { id: 1, name: 'Headquarters' }
              ],
              companies: (companies && companies.length > 0 && companies[0].name) ? companies : [
                { id: 1, name: 'Madhura Tech' }
              ],
              employees: employees,
              hrEmployees: hrEmployees
            });
          });
        });
      });
    });
  });
});

router.get('/', authenticateJWT, checkPermission('recruitment', 'job_openings', 'view'), RequirementController.list);
router.get('/dropdown', authenticateJWT, checkPermission('recruitment', 'job_openings', 'view'), RequirementController.dropdown);
router.get('/dashboard', authenticateJWT, checkPermission('recruitment', 'job_openings', 'view'), RequirementController.getDashboard);
router.get('/:id', authenticateJWT, checkPermission('recruitment', 'job_openings', 'view'), RequirementController.getById);

router.post('/', authenticateJWT, checkPermission('recruitment', 'job_openings', 'create'), upload.single('attachment'), validationMiddleware(validateRequirement), RequirementController.create);
router.put('/:id', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), upload.single('attachment'), validationMiddleware(validateRequirement), RequirementController.update);
router.delete('/:id', authenticateJWT, checkPermission('recruitment', 'job_openings', 'delete'), RequirementController.softDelete);

router.post('/:id/restore', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.restore);
router.post('/:id/publish', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.publish);
router.post('/:id/publish-linkedin', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.publishLinkedIn);
router.get('/:id/publishing-channels', authenticateJWT, checkPermission('recruitment', 'job_openings', 'view'), RequirementController.getPublishingChannels);
router.post('/:id/retry-publish', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.retryPublishChannel);
router.post('/:id/approve', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.approve);
router.post('/:id/reject', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.reject);
router.post('/:id/close', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.close);
router.post('/:id/reopen', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.reopen);
router.post('/:id/duplicate', authenticateJWT, checkPermission('recruitment', 'job_openings', 'create'), RequirementController.duplicate);

router.post('/bulk-delete', authenticateJWT, checkPermission('recruitment', 'job_openings', 'delete'), RequirementController.bulkDelete);
router.post('/bulk-status', authenticateJWT, checkPermission('recruitment', 'job_openings', 'edit'), RequirementController.bulkStatusUpdate);

module.exports = router;
