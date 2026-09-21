const validateDocumentVerification = (data) => {
  const errors = [];

  if (!data.new_joiner_id || isNaN(data.new_joiner_id)) {
    errors.push('New Joiner ID is required');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateDocumentVerification
};
