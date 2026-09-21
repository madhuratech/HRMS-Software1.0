const express = require('express');
const router = express.Router();
const TeamMemberController = require('../controllers/TeamMemberController');
const { authenticateJWT, checkPermission } = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');
const { validateTeamMember } = require('../validators/teamMemberValidator');

router.get('/', authenticateJWT, checkPermission('projects', 'team_members', 'view'), TeamMemberController.list);
router.get('/meta', authenticateJWT, checkPermission('projects', 'team_members', 'view'), TeamMemberController.meta);

router.post('/', authenticateJWT, checkPermission('projects', 'team_members', 'create'), validationMiddleware(validateTeamMember), TeamMemberController.assign);
router.put('/:id', authenticateJWT, checkPermission('projects', 'team_members', 'edit'), TeamMemberController.update);
router.delete('/:id', authenticateJWT, checkPermission('projects', 'team_members', 'delete'), TeamMemberController.remove);

module.exports = router;