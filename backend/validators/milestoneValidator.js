const validateMilestone = (data) => {
  const errors = [];

  if (!data.milestone_name || typeof data.milestone_name !== 'string' || data.milestone_name.trim() === '') {
    errors.push('Milestone Name is required');
  }

  if (!data.project_id || isNaN(data.project_id)) {
    errors.push('Project is required and must be a valid project');
  }

  if (!data.due_date) {
    errors.push('Due Date is required');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push('Milestone Description is required');
  }

  if (data.status && !['Upcoming', 'In Progress', 'Completed', 'Delayed'].includes(data.status)) {
    errors.push('Status must be one of: Upcoming, In Progress, Completed, Delayed');
  }

  if (data.progress_pct !== undefined && data.progress_pct !== null) {
    const pct = parseInt(data.progress_pct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateMilestone
};