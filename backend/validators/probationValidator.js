const validateProbation = (data) => {
  const errors = [];

  if (!data.employee_id || isNaN(data.employee_id)) {
    errors.push('Employee is required');
  }

  if (!data.probation_start_date) {
    errors.push('Probation Start Date is required');
  }

  if (!data.probation_end_date) {
    errors.push('Probation End Date is required');
  }

  if (!data.reporting_manager || typeof data.reporting_manager !== 'string' || data.reporting_manager.trim() === '') {
    errors.push('Reporting Manager is required');
  }

  // End Date cannot be earlier than Start Date
  if (data.probation_start_date && data.probation_end_date) {
    const start = new Date(data.probation_start_date);
    const end = new Date(data.probation_end_date);
    if (end < start) {
      errors.push('Probation End Date cannot be earlier than Probation Start Date');
    }
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateProbation
};
