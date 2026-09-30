const db = require('../config/database');

async function run() {
  const tables = await new Promise((res, rej) => {
    db.query("SHOW TABLES", (err, rows) => {
      if (err) return rej(err);
      res(rows.map(r => Object.values(r)[0]));
    });
  });

  const empIds = (await new Promise(r => db.query("SELECT id FROM employees", (e, rows) => r(rows.map(x => x.id)))));
  const userIds = (await new Promise(r => db.query("SELECT id FROM users", (e, rows) => r(rows.map(x => x.id)))));

  console.log(`Current Valid Employee IDs: [${empIds.join(', ')}]`);
  console.log(`Current Valid User IDs: [${userIds.join(', ')}]`);

  for (const t of tables) {
    const cols = await new Promise(r => db.query(`DESCRIBE \`${t}\``, (e, rows) => r(rows || [])));
    const colNames = cols.map(c => c.Field);

    for (const c of colNames) {
      if (c === 'employee_id' || c === 'emp_id' || c === 'assignee_id') {
        const orphanCount = await new Promise(r => {
          db.query(`SELECT COUNT(*) as cnt FROM \`${t}\` WHERE \`${c}\` IS NOT NULL AND \`${c}\` NOT IN (${empIds.join(',') || 0})`, (e, res) => {
            if (e) return r(0);
            r(res[0].cnt);
          });
        });
        if (orphanCount > 0) {
          console.log(`⚠️ Table \`${t}\` column \`${c}\` has ${orphanCount} orphan employee record(s)!`);
        }
      }
      if (c === 'user_id' || c === 'recipient_user_id') {
        const orphanCount = await new Promise(r => {
          db.query(`SELECT COUNT(*) as cnt FROM \`${t}\` WHERE \`${c}\` IS NOT NULL AND \`${c}\` NOT IN (${userIds.join(',') || 0})`, (e, res) => {
            if (e) return r(0);
            r(res[0].cnt);
          });
        });
        if (orphanCount > 0) {
          console.log(`⚠️ Table \`${t}\` column \`${c}\` has ${orphanCount} orphan user record(s)!`);
        }
      }
    }
  }

  console.log('Orphan scan finished.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
