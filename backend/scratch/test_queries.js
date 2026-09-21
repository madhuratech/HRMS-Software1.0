const db = require('../config/database');

const sqlPromotions = `
  SELECT 
    p.*,
    e.name as employee_name,
    e.profile_photo as profile_photo,
    COALESCE(d1.role_name, p.current_designation) as old_designation,
    COALESCE(d2.role_name, p.promoted_designation) as new_designation,
    approver.name as approved_by_name
  FROM promotions p
  JOIN employees e ON p.employee_id = e.id
  LEFT JOIN designations d1 ON p.old_designation_id = d1.id
  LEFT JOIN designations d2 ON p.new_designation_id = d2.id
  LEFT JOIN employees approver ON p.approved_by = approver.id
  ORDER BY p.created_at DESC
`;

const sqlTransfers = `
  SELECT 
    t.*,
    e.name as employee_name,
    e.profile_photo as profile_photo,
    approver.name as approved_by_name
  FROM transfers t
  JOIN employees e ON t.employee_id = e.id
  LEFT JOIN employees approver ON t.approved_by = approver.id
  ORDER BY t.created_at DESC
`;

const sqlExits = `
  SELECT 
    ex.*,
    e.name as employee_name,
    e.profile_photo as profile_photo
  FROM exit_management ex
  JOIN employees e ON ex.employee_id = e.id
  ORDER BY ex.created_at DESC
`;

db.query(sqlPromotions, (errP, rowsP) => {
  console.log('Promotions count:', rowsP ? rowsP.length : 0);
  if (rowsP && rowsP.length) console.log('Sample Promotion:', rowsP[0]);

  db.query(sqlTransfers, (errT, rowsT) => {
    console.log('Transfers count:', rowsT ? rowsT.length : 0);
    if (rowsT && rowsT.length) console.log('Sample Transfer:', rowsT[0]);

    db.query(sqlExits, (errE, rowsE) => {
      console.log('Exits count:', rowsE ? rowsE.length : 0);
      if (rowsE && rowsE.length) console.log('Sample Exit:', rowsE[0]);
      process.exit(0);
    });
  });
});
