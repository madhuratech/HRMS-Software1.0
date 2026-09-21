const db = require('../config/database');

const Orientation = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  beginTransaction: () => {
    return new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  commit: () => {
    return new Promise((resolve, reject) => {
      db.commit((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  rollback: () => {
    return new Promise((resolve, reject) => {
      db.rollback(() => {
        resolve();
      });
    });
  }
};

module.exports = Orientation;
