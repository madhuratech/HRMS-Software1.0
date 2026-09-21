const validateNewJoiner = (data) => {
  const errors = [];

  if (!data.employee_name || typeof data.employee_name !== 'string' || data.employee_name.trim() === '') {
    errors.push('Employee Name is required');
  }

  if (!data.department_id || isNaN(data.department_id)) {
    errors.push('Department is required');
  }

  if (!data.designation || typeof data.designation !== 'string' || data.designation.trim() === '') {
    errors.push('Designation is required');
  }

  if (!data.joining_date) {
    errors.push('Joining Date is required');
  }

  if (!data.reporting_manager || typeof data.reporting_manager !== 'string' || data.reporting_manager.trim() === '') {
    errors.push('Reporting Manager is required');
  }

  if (!data.checklist || typeof data.checklist !== 'string' || data.checklist.trim() === '') {
    errors.push('Checklist is required');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateNewJoiner
};
