const validateTask = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Task Name is required');
  }

  if (!data.project_id || isNaN(data.project_id)) {
    errors.push('Project is required and must be a valid project');
  }

  if (!data.assignee_id || isNaN(data.assignee_id)) {
    errors.push('Assigned To is required and must be a valid employee');
  }

  if (!data.start_date) {
    errors.push('Start Date is required');
  }

  if (!data.due_date) {
    errors.push('Due Date is required');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push('Task Description is required');
  }

  if (data.start_date && data.due_date) {
    const start = new Date(data.start_date);
    const due = new Date(data.due_date);
    if (start > due) {
      errors.push('Start Date cannot be greater than Due Date');
    }
  }

  if (data.priority && !['Low', 'Medium', 'High'].includes(data.priority)) {
    errors.push('Priority must be one of: Low, Medium, High');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateTask
};