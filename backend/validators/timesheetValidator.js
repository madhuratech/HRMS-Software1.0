const validateTimesheet = (data) => {
  const errors = [];

  if (!data.employee_id || isNaN(data.employee_id)) {
    errors.push('Employee Name is required and must be a valid employee');
  }

  if (!data.project_id || isNaN(data.project_id)) {
    errors.push('Project is required and must be a valid project');
  }

  if (data.hours === undefined || data.hours === null || isNaN(data.hours) || parseFloat(data.hours) <= 0) {
    errors.push('Hours Logged must be a number greater than zero');
  }

  if (data.hours && (parseFloat(data.hours) > 24)) {
    errors.push('Hours Logged cannot exceed 24');
  }

  if (data.billable && !['Billable', 'Non-Billable'].includes(data.billable)) {
    errors.push('Billable Type must be one of: Billable, Non-Billable');
  }

  if (data.status && !['Pending', 'Approved', 'Rejected'].includes(data.status)) {
    errors.push('Approval Status must be one of: Pending, Approved, Rejected');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateTimesheet
};