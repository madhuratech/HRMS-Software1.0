require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret";
const tokenAdmin = jwt.sign({
  id: 1,
  userId: 1,
  employee_id: 1,
  employeeId: 1,
  name: 'Super Admin',
  email: 'admin@madhuratech.com',
  role: 'SUPER_ADMIN'
}, JWT_SECRET, { expiresIn: '1h' });

async function testCreate() {
  console.log('Testing POST /app/leaves/types ...');

  const payload = {
    name: 'Casual Leave',
    code: 'CL',
    desc: 'Leave for personal work and casual reasons',
    maxDays: '12',
    carryForward: true,
    requiresApproval: true,
    paidLeave: true,
    status: 'Active'
  };

  const res = await fetch('http://127.0.0.1:5000/app/leaves/types', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenAdmin}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('BODY:', text);

  // Now fetch all types
  const getRes = await fetch('http://127.0.0.1:5000/app/leaves/types', {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  });
  const getList = await getRes.json();
  console.log('LIST COUNT:', getList.length);
  console.log('FETCHED TYPES:', getList);

  process.exit(res.status === 200 ? 0 : 1);
}

testCreate().catch(err => {
  console.error(err);
  process.exit(1);
});
