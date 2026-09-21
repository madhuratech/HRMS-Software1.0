require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret";

async function testRoles() {
  const roles = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'];
  
  for (const r of roles) {
    const token = jwt.sign({ id: 1, userId: 1, email: `${r.toLowerCase()}@madhuratech.com`, role: r }, JWT_SECRET);
    const res = await fetch('http://127.0.0.1:5000/app/leaves/types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: `Role Test ${r}`,
        code: `RT_${r.substring(0, 3)}`,
        maxDays: 10
      })
    });
    const data = await res.json();
    console.log(`Role ${r} -> status: ${res.status}, result:`, data.message || data.success || data.error);
    if (data.id) {
      // Clean up
      await fetch(`http://127.0.0.1:5000/app/leaves/types/${data.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  }
  process.exit(0);
}

testRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
