const db = require('../config/database');

/**
 * Safely generates the next sequential employee code in format EMP#### (e.g. EMP0001, EMP0002).
 * Determines the highest existing employee code number (from employee_code and employee_id)
 * and increments by 1.
 * Does NOT use COUNT(*) + 1 to prevent collisions when rows were deleted or gaps exist.
 *
 * @param {object|null} connection Optional db connection/pool for transactions
 * @returns {Promise<string>} Next employee code, e.g. "EMP0015"
 */
async function getNextEmployeeCode(connection = null) {
  const queryFn = (sql, params = []) => {
    if (connection && typeof connection.query === 'function') {
      return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    }
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  };

  const sql = `
    SELECT 
      COALESCE(
        MAX(
          CAST(
            SUBSTRING(
              COALESCE(NULLIF(employee_code, ''), NULLIF(employee_id, '')), 
              4
            ) AS UNSIGNED
          )
        ), 
        0
      ) as max_code
    FROM employees
    WHERE (
      employee_code REGEXP '^EMP[0-9]+$' 
      OR employee_id REGEXP '^EMP[0-9]+$'
    )
  `;

  const rows = await queryFn(sql);
  const maxCode = (rows && rows[0] && rows[0].max_code) ? parseInt(rows[0].max_code, 10) : 0;
  const nextNumber = maxCode + 1;
  return `EMP${String(nextNumber).padStart(4, '0')}`;
}

module.exports = {
  getNextEmployeeCode
};
