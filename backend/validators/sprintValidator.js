const validateSprint = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Sprint Name is required');
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (start > end) {
      errors.push('Start Date cannot be greater than End Date');
    }
  }

  if (data.status && !['Planning', 'Active', 'Completed'].includes(data.status)) {
    errors.push('Status must be one of: Planning, Active, Completed');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateSprint
};