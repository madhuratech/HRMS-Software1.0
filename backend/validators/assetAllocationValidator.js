const validateAssetAllocation = (data) => {
  const errors = [];

  if (!data.employee_id || isNaN(data.employee_id)) {
    errors.push('Employee is required');
  }

  if (!data.asset_id || isNaN(data.asset_id)) {
    errors.push('Asset is required');
  }

  if (!data.allocation_date) {
    errors.push('Allocation Date is required');
  }

  if (!data.assigned_by || typeof data.assigned_by !== 'string' || data.assigned_by.trim() === '') {
    errors.push('Assigned By is required');
  }

  return {
    error: errors.length > 0 ? { details: errors.map(msg => ({ message: msg })) } : null
  };
};

module.exports = {
  validateAssetAllocation
};
