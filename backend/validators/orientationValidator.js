const validateOrientation = (data) => {
  const errors = [];

  if (!data.new_joiner_id || isNaN(data.new_joiner_id)) {
    errors.push('New Joiner is required');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Orientation Title is required');
  }

  if (!data.orientation_date) {
    errors.push('Orientation Date is required');
  }

  if (!data.trainer || typeof data.trainer !== 'string' || data.trainer.trim() === '') {
    errors.push('Trainer is required');
  }

  if (!data.session_type || !['Online', 'Offline', 'Hybrid'].includes(data.session_type)) {
    errors.push('Session Type is required and must be Online, Offline or Hybrid');
  }

  if (!data.start_time) {
    errors.push('Start Time is required');
  }

  if (!data.end_time) {
    errors.push('End Time is required');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateOrientation
};
