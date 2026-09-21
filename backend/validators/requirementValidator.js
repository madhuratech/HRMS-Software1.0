const validateRequirement = (data) => {
  const errors = [];

  if (!data.job_title || typeof data.job_title !== 'string' || data.job_title.trim() === '') {
    errors.push('Job Title is required');
  }

  if (!data.department_id || isNaN(data.department_id)) {
    errors.push('Department ID is required and must be a number');
  }

  if (!data.designation_id || isNaN(data.designation_id)) {
    errors.push('Designation ID is required and must be a number');
  }

  if (!data.vacancies || isNaN(data.vacancies) || parseInt(data.vacancies) <= 0) {
    errors.push('Vacancies must be a number greater than zero');
  }

  if (!data.priority || !['Low', 'Medium', 'High', 'Critical'].includes(data.priority)) {
    errors.push('Priority is required and must be one of: Low, Medium, High, Critical');
  }

  if (!data.status || !['Draft', 'Pending', 'Approved', 'Rejected', 'Open', 'On Hold', 'Closed', 'Cancelled', 'Filled'].includes(data.status)) {
    errors.push('Status is required and must be one of: Draft, Pending, Approved, Rejected, Open, On Hold, Closed, Cancelled, Filled');
  }

  if (data.opening_date && data.closing_date) {
    const opening = new Date(data.opening_date);
    const closing = new Date(data.closing_date);
    if (opening > closing) {
      errors.push('Opening Date cannot be greater than Closing Date');
    }
  }

  if (data.salary_from !== undefined && data.salary_to !== undefined && data.salary_from !== null && data.salary_to !== null) {
    if (parseFloat(data.salary_from) > parseFloat(data.salary_to)) {
      errors.push('Salary From cannot exceed Salary To');
    }
  }

  if (data.experience_from !== undefined && data.experience_to !== undefined && data.experience_from !== null && data.experience_to !== null) {
    if (parseInt(data.experience_from) > parseInt(data.experience_to)) {
      errors.push('Experience From cannot exceed Experience To');
    }
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateRequirement
};
