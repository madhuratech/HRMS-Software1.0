const validateGoal = (data) => {
  const errors = [];
  if (!data.employee_id || isNaN(data.employee_id)) errors.push('Employee is required');
  if (!data.goal_title) errors.push('Goal Title is required');
  if (!data.target_date) errors.push('Target Date is required');
  if (!data.status) errors.push('Status is required');
  return { error: errors.length > 0 ? { details: errors.map(m => ({ message: m })) } : null };
};

module.exports = { validateGoal };
