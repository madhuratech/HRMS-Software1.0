const validateOfferLetter = (data) => {
  const errors = [];

  if (!data.candidate_name || typeof data.candidate_name !== 'string' || data.candidate_name.trim() === '') {
    errors.push('Candidate Name is required');
  }

  if (!data.job_position || typeof data.job_position !== 'string' || data.job_position.trim() === '') {
    errors.push('Job Position is required');
  }

  if (!data.department_id || isNaN(data.department_id)) {
    errors.push('Department is required');
  }

  if (!data.salary_offered || typeof data.salary_offered !== 'string' || data.salary_offered.trim() === '') {
    errors.push('Salary Offered is required');
  }

  if (!data.joining_date) {
    errors.push('Joining Date is required');
  }

  if (!data.reporting_manager || typeof data.reporting_manager !== 'string' || data.reporting_manager.trim() === '') {
    errors.push('Reporting Manager is required');
  }

  if (!data.offer_expiry_date) {
    errors.push('Offer Expiry Date is required');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateOfferLetter
};
