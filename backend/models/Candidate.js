const db = require('../config/database');

const Candidate = {
  // Query wrapper with Promise support
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },

  withTransaction: (workFn) => {
    return db.withTransaction(workFn);
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

module.exports = Candidate;
