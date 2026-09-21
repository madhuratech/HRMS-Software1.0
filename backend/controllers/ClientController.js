const ClientService = require('../services/ClientService');
const NotificationService = require('../services/NotificationService');
const response = require('../utils/response');
const getPagination = require('../utils/pagination');

class ClientController {
  static async list(req, res) {
    try {
      const pagination = getPagination(req);
      const filters = {
        search: req.query.search || '',
        client_type: req.query.client_type || null,
        status: req.query.status || null,
        industry: req.query.industry || null,
      };
      const result = await ClientService.list(filters, pagination);
      const stats = await ClientService.getStats();
      const industries = await ClientService.getIndustries();
      return response(res, true, 200, 'Clients list retrieved successfully', {
        clients: result.rows,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit,
        stats,
        industries,
      });
    } catch (err) {
      console.error('[ClientController.list]', err);
      return response(res, false, 500, 'Failed to fetch clients list', null, err.message);
    }
  }

  static async getById(req, res) {
    try {
      const client = await ClientService.getById(req.params.id);
      if (!client) return response(res, false, 404, 'Client not found');
      return response(res, true, 200, 'Client retrieved successfully', client);
    } catch (err) {
      console.error('[ClientController.getById]', err);
      return response(res, false, 500, 'Failed to fetch client', null, err.message);
    }
  }

  static async create(req, res) {
    try {
      const userId = req.user?.id || 1;
      if (!req.body.company_name || !req.body.company_name.trim()) {
        return response(res, false, 400, 'Company name is required');
      }
      const newClient = await ClientService.create(req.body, userId);

      // Fire notification
      try {
        await NotificationService.notifyClientEvent('NEW_CLIENT', newClient.id, req.body.company_name, userId);
      } catch (ne) { console.warn('[ClientController] Notification error:', ne.message); }

      return response(res, true, 201, 'Client created successfully', newClient);
    } catch (err) {
      console.error('[ClientController.create]', err);
      if (err.message && err.message.includes('already exists')) {
        return response(res, false, 409, err.message);
      }
      return response(res, false, 500, 'Failed to create client', null, err.message);
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user?.id || 1;
      const existing = await ClientService.getById(req.params.id);
      if (!existing) return response(res, false, 404, 'Client not found');

      await ClientService.update(req.params.id, req.body, userId);

      // Fire notification
      try {
        const statusChanged = req.body.status && req.body.status !== existing.status;
        const eventType = statusChanged ? 'CLIENT_STATUS_CHANGED' : 'CLIENT_UPDATED';
        await NotificationService.notifyClientEvent(eventType, req.params.id, existing.company_name, userId);
      } catch (ne) { console.warn('[ClientController] Notification error:', ne.message); }

      return response(res, true, 200, 'Client updated successfully');
    } catch (err) {
      console.error('[ClientController.update]', err);
      if (err.message && err.message.includes('already exists')) {
        return response(res, false, 409, err.message);
      }
      return response(res, false, 500, 'Failed to update client', null, err.message);
    }
  }

  static async delete(req, res) {
    try {
      const existing = await ClientService.getById(req.params.id);
      if (!existing) return response(res, false, 404, 'Client not found');
      await ClientService.delete(req.params.id);
      return response(res, true, 200, 'Client deleted successfully');
    } catch (err) {
      console.error('[ClientController.delete]', err);
      return response(res, false, 500, 'Failed to delete client', null, err.message);
    }
  }

  static async activeList(req, res) {
    try {
      const clients = await ClientService.getActiveList();
      return response(res, true, 200, 'Active clients list retrieved', clients);
    } catch (err) {
      console.error('[ClientController.activeList]', err);
      return response(res, false, 500, 'Failed to fetch active clients', null, err.message);
    }
  }

  static async clientProjects(req, res) {
    try {
      const client = await ClientService.getById(req.params.id);
      if (!client) return response(res, false, 404, 'Client not found');
      const projects = await ClientService.getProjects(req.params.id);
      return response(res, true, 200, 'Client projects retrieved successfully', { client, projects });
    } catch (err) {
      console.error('[ClientController.clientProjects]', err);
      return response(res, false, 500, 'Failed to fetch client projects', null, err.message);
    }
  }

  static async clientActivity(req, res) {
    try {
      const activity = await ClientService.getActivity(req.params.id);
      return response(res, true, 200, 'Client activity retrieved', activity);
    } catch (err) {
      console.error('[ClientController.clientActivity]', err);
      return response(res, false, 500, 'Failed to fetch client activity', null, err.message);
    }
  }
}

module.exports = ClientController;
