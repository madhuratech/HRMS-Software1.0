const db = require('../config/database');

async function seedComponents() {
  db.query('SELECT COUNT(*) as count FROM salary_components', async (err, rows) => {
    if (rows && rows[0].count === 0) {
      const components = [
        ['Basic Salary', 'Earning', 'Yes', 'percentage', 50, 'gross', 'Active', 0, ''],
        ['House Rent Allowance (HRA)', 'Earning', 'Partial', 'percentage', 40, 'basic', 'Active', 0, ''],
        ['Special Allowance', 'Earning', 'Yes', 'formula', 0, 'basic', 'Active', 0, ''],
        ['Provident Fund (PF)', 'Deduction', 'No', 'percentage', 12, 'basic', 'Active', 1, ''],
        ['Employee State Insurance (ESI)', 'Deduction', 'No', 'percentage', 0.75, 'gross', 'Active', 1, ''],
        ['Professional Tax (PT)', 'Deduction', 'No', 'fixed', 0, 'basic', 'Active', 1, '']
      ];

      for (const c of components) {
        await new Promise((resolve, reject) => {
          db.query(
            `INSERT INTO salary_components (name, type, taxable, calc_type, percentage_value, percentage_basis, status, is_statutory, formula) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            c,
            (e, res) => {
              if (e) reject(e); else resolve(res);
            }
          );
        });
      }
      console.log('Seeded default salary components successfully.');
    } else {
      console.log('salary_components already has records:', rows[0].count);
    }

    db.query('SELECT id, name, type, calc_type, percentage_value FROM salary_components', (err2, comps) => {
      console.log('Current components:', comps);
      process.exit(0);
    });
  });
}

seedComponents();
