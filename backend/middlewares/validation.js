const response = require('../utils/response');

module.exports = (validator) => {
  return (req, res, next) => {
    const { error } = validator(req.body);
    if (error) {
      const errorDetails = error.details.map(detail => detail.message);
      return response(res, false, 400, 'Validation Error', null, errorDetails);
    }
    next();
  };
};
