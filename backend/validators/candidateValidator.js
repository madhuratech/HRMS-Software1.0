const validateCandidate = (data) => {
  const errors = [];
  const isUpdate = Boolean(data.id || data.is_update || (data.status && Object.keys(data).length <= 4));

  if (!isUpdate) {
    // Required Candidate Name
    if (!data.candidate_name || typeof data.candidate_name !== 'string' || data.candidate_name.trim() === '') {
      errors.push('Candidate Name is required');
    }

    // Required Email
    if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
      errors.push('Email Address is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('Invalid email address format');
      }
    }

    // Required Mobile Number
    if (!data.mobile_number || typeof data.mobile_number !== 'string' || data.mobile_number.trim() === '') {
      errors.push('Mobile Number is required');
    } else {
      const phoneRegex = /^\+?[0-9\s\-]{7,20}$/;
      if (!phoneRegex.test(data.mobile_number.trim())) {
        errors.push('Invalid mobile number format');
      }
    }

    // Required Department ID
    if (!data.department_id || isNaN(data.department_id)) {
      errors.push('Department is required');
    }

    // Required Job Position
    if (!data.job_position || typeof data.job_position !== 'string' || data.job_position.trim() === '') {
      errors.push('Job Position is required');
    }
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateCandidate
};
