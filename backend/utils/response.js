const fs = require('fs');
const path = require('path');

module.exports = (res, success = true, statusCode = 200, message = "", data = null, errors = null) => {
  if (statusCode >= 400) {
    const logEntry = `[${new Date().toISOString()}] ${statusCode} Error: ${message}. Details: ${JSON.stringify(errors)}\n`;
    try {
      fs.appendFileSync(path.join(__dirname, '../error.log'), logEntry);
    } catch (e) {
      console.error('Failed to write to error.log', e);
    }
  }
  return res.status(statusCode).json({
    success,
    message,
    data,
    errors
  });
};
