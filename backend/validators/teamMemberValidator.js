const validateTeamMember = (data) => {
  const errors = [];

  if (!data.project_id || isNaN(data.project_id)) {
    errors.push('Project is required and must be a valid project');
  }

  if (!data.employee_id || isNaN(data.employee_id)) {
    errors.push('Employee is required and must be a valid employee');
  }

  if (data.role && typeof data.role !== 'string') {
    errors.push('Role must be a valid text value');
  }

  if (data.status && !['Active', 'On Leave'].includes(data.status)) {
    errors.push('Status must be one of: Active, On Leave');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateTeamMember
};