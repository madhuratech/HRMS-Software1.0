const validateInterview = (data) => {
  const errors = [];

  if (!data.candidate_id || isNaN(data.candidate_id)) {
    errors.push('Candidate is required');
  }

  if (!data.interviewer_id || isNaN(data.interviewer_id)) {
    errors.push('Interviewer is required');
  }

  if (!data.interview_date) {
    errors.push('Interview Date is required');
  } else {
    // Prevent scheduling interviews in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const interviewDate = new Date(data.interview_date);
    if (interviewDate < today) {
      errors.push('Interview Date cannot be in the past');
    }
  }

  if (!data.interview_time) {
    errors.push('Interview Time is required');
  }

  const rounds = ['HR Round', 'Technical Round', 'Manager Round', 'Final Round'];
  if (!data.interview_round || !rounds.includes(data.interview_round)) {
    errors.push('Interview Round is required and must be a valid option');
  }

  const modes = ['Online', 'Offline', 'Telephonic'];
  if (!data.interview_mode || !modes.includes(data.interview_mode)) {
    errors.push('Interview Mode is required and must be a valid option');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateInterview
};
