const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function backup() {
  console.log('Starting full database backup...');
  const tables = await new Promise((res, rej) => {
    db.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'", (err, rows) => {
      if (err) return rej(err);
      res(rows.map(r => Object.values(r)[0]));
    });
  });

  console.log('Found', tables.length, 'tables to backup.');
  const backupFile = path.join(__dirname, '..', 'database_backup_complete.sql');
  const stream = fs.createWriteStream(backupFile, { flags: 'w' });

  stream.write('-- Full Database Backup Created ' + new Date().toISOString() + '\nSET FOREIGN_KEY_CHECKS=0;\n\n');

  for (const t of tables) {
    const createTable = await new Promise((res, rej) => {
      db.query(`SHOW CREATE TABLE \`${t}\``, (err, rows) => {
        if (err) return rej(err);
        res(rows[0]['Create Table']);
      });
    });
    stream.write(`-- Table structure for ${t}\n`);
    stream.write(`DROP TABLE IF EXISTS \`${t}\`;\n`);
    stream.write(createTable + ';\n\n');

    const rows = await new Promise((res, rej) => {
      db.query(`SELECT * FROM \`${t}\``, (err, r) => {
        if (err) return rej(err);
        res(r || []);
      });
    });

    if (rows.length > 0) {
      stream.write(`-- Dumping data for ${t} (${rows.length} rows)\n`);
      for (const row of rows) {
        const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
        const vals = Object.values(row).map(v => {
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return v;
          if (typeof v === 'boolean') return v ? 1 : 0;
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          return db.pool.escape(String(v));
        }).join(', ');
        stream.write(`INSERT INTO \`${t}\` (${keys}) VALUES (${vals});\n`);
      }
      stream.write('\n');
    }
  }

  stream.write('SET FOREIGN_KEY_CHECKS=1;\n');
  stream.end();
  console.log('✅ Full database backup complete:', backupFile);
  process.exit(0);
}

backup().catch(e => {
  console.error('Backup error:', e);
  process.exit(1);
});
