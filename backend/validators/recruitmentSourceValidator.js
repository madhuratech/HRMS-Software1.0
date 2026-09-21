const validateRecruitmentSource = (data) => {
  const errors = [];

  if (!data.source_name || typeof data.source_name !== 'string' || data.source_name.trim() === '') {
    errors.push('Source Name is required');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateRecruitmentSource
};
