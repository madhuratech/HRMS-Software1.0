const db = require('../config/database');
const response = require('../utils/response');

const requireSalesAndMarketing = async (req, res, next) => {
  try {
    if (!req.user) {
      return response(res, false, 401, 'Unauthorized');
    }
    return next();
  } catch (error) {
    console.error("GPS Auth Error:", error);
    return response(res, false, 500, 'Internal Server Error during GPS authorization');
  }
};

module.exports = {
  requireSalesAndMarketing
};
