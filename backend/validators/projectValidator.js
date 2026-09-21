const validateProject = (data) => {
  const errors = [];

  if (!data.project_name || typeof data.project_name !== 'string' || data.project_name.trim() === '') {
    errors.push('Project Name is required');
  }

  if (!data.project_code || typeof data.project_code !== 'string' || data.project_code.trim() === '') {
    errors.push('Project Code is required');
  }

  if (!data.client || typeof data.client !== 'string' || data.client.trim() === '') {
    errors.push('Client is required');
  }

  if (!data.project_manager_id || isNaN(data.project_manager_id)) {
    errors.push('Project Manager is required and must be a valid employee');
  }

  if (!data.start_date) {
    errors.push('Start Date is required');
  }

  if (!data.end_date) {
    errors.push('End Date is required');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push('Project Description is required');
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (start > end) {
      errors.push('Start Date cannot be greater than End Date');
    }
  }

  if (data.priority && !['Low', 'Medium', 'High'].includes(data.priority)) {
    errors.push('Priority must be one of: Low, Medium, High');
  }

  if (data.status && !['Not Started', 'Planning', 'In Progress', 'On Hold', 'Overdue', 'Completed'].includes(data.status)) {
    errors.push('Status must be one of: Not Started, Planning, In Progress, On Hold, Overdue, Completed');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateProject
};