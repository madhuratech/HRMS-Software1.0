const TeamMemberService = require('../services/TeamMemberService');
const DataScopeService = require('../services/DataScopeService');
const response = require('../utils/response');

class TeamMemberController {
  static async assign(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      const newMember = await TeamMemberService.assign(data, userId);
      return response(res, true, 212, 'Team member assigned successfully', newMember);
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to assign team member', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const data = { ...req.body };
      await TeamMemberService.update(req.params.id, data, userId);
      return response(res, true, 200, 'Team member updated successfully');
    } catch (err) {
      console.error(err);
      return response(res, false, 500, 'Failed to update team member', null, err.message);
    }
  }

  static async remove(req, res) {
    try {
      await TeamMemberService.remove(req.params.id);
      return response(res, true, 200, 'Team member removed successfully');
    } catch (err) {
      return response(res, false, 500, 'Failed to remove team member', null, err.message);
    }
  }

  static async list(req, res) {
    try {
      const scopeData = await DataScopeService.getScope(req);
      const members = await TeamMemberService.list(scopeData);
      return response(res, true, 200, 'Team members retrieved successfully', members);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch team members', null, err.message);
    }
  }

  static async meta(req, res) {
    try {
      const scopeData = await DataScopeService.getScope(req);
      const meta = await TeamMemberService.getMeta(scopeData);
      return response(res, true, 200, 'Team member meta data retrieved successfully', meta);
    } catch (err) {
      return response(res, false, 500, 'Failed to fetch meta data', null, err.message);
    }
  }
}

module.exports = TeamMemberController;