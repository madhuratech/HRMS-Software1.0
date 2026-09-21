const validatePromotion = (data) => {
  const errors = [];
  const isUpdate = Boolean(data.id || data.is_update || (data.status && Object.keys(data).length <= 4));

  if (!isUpdate) {
    if (!data.employee_id || isNaN(data.employee_id)) errors.push('Employee is required');
    if (!data.promotion_date) errors.push('Promotion Date is required');
    if (!data.effective_date) errors.push('Effective Date is required');
    if (!data.promoted_designation) errors.push('Promoted Designation is required');
  }
  return { error: errors.length > 0 ? { details: errors.map(m => ({ message: m })) } : null };
};

module.exports = { validatePromotion };
