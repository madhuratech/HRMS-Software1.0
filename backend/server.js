require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./config/database");

// Process-level crash prevention
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
  const logMessage = `[${new Date().toISOString()}] Unhandled Rejection: ${reason?.stack || reason}\n\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'error.log'), logMessage);
  } catch (e) { }
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
  const logMessage = `[${new Date().toISOString()}] Uncaught Exception: ${err?.stack || err}\n\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'error.log'), logMessage);
  } catch (e) { }
});

// Programmatic Knex Migration Runner on Startup with Retry
const knex = require('knex');
const knexConfig = require('./knexfile');

async function runMigrationsSafely(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let knexInstance = null;
    try {
      knexInstance = knex(knexConfig.production || knexConfig.development);
      const hasTable = await knexInstance.schema.hasTable('knex_migrations');
      if (hasTable) {
        const migrationsDir = path.join(__dirname, 'migrations');
        const filesOnDisk = fs.existsSync(migrationsDir)
          ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'))
          : [];
        const dbRecords = await knexInstance('knex_migrations').select('id', 'name');
        const missingIds = dbRecords.filter(r => !filesOnDisk.includes(r.name)).map(r => r.id);
        if (missingIds.length > 0) {
          await knexInstance('knex_migrations').whereIn('id', missingIds).del();
          console.log(`🧹 Cleaned ${missingIds.length} orphan migration record(s) from database.`);
        }
      }
      await knexInstance.migrate.latest();
      console.log('✅ Cloud database schemas/migrations verified and updated.');
      await knexInstance.destroy();
      break;
    } catch (err) {
      if (knexInstance) {
        try { await knexInstance.destroy(); } catch (e) {}
      }
      if (attempt < retries) {
        console.warn(`[Migration Warning] Attempt ${attempt} failed: ${err.message}. Retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      } else {
        console.warn('⚠️ Knex migration runner finished with warning (non-fatal):', err.message);
      }
    }
  }
}

runMigrationsSafely();

const app = express();

const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'https://hrms-software1-0-one.vercel.app',
  'https://madhuratech.com',
  'https://www.madhuratech.com',
  'http://localhost:5173',
  'http://localhost:3000',
  ...envOrigins
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      allowedOrigins.some(o => o.toLowerCase() === cleanOrigin.toLowerCase()) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-employee-id', 'x-user-role', 'Pragma', 'Cache-Control']
}));
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploads
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Safe endpoint for static upload files
app.get("/uploads/photos/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, 'photos', filename);
  if (fs.existsSync(filePath)) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(path.resolve(filePath));
  }

  // If not on local disk (e.g. Render ephemeral environment), check database for persistent photo
  const empMatch = filename.match(/^emp_(\d+)_/);
  if (empMatch) {
    const empId = empMatch[1];
    return db.query("SELECT profile_photo, name FROM employees WHERE id = ?", [empId], (err, rows) => {
      if (!err && rows && rows.length > 0 && rows[0].profile_photo) {
        const photo = rows[0].profile_photo;
        if (photo.startsWith('data:image/')) {
          const match = photo.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const imgBuffer = Buffer.from(match[2], 'base64');
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(imgBuffer);
          }
        }
      }
      const cleanName = (rows && rows[0] && rows[0].name) || filename.replace(/^emp_\d+_|\.[^.]+$/g, '') || 'User';
      return res.redirect(`https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563EB&color=fff&bold=true`);
    });
  }

  const cleanName = filename.replace(/^emp_\d+_|\.[^.]+$/g, '') || 'User';
  return res.redirect(`https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563EB&color=fff&bold=true`);
});

app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(path.resolve(filePath));
  }
  return res.status(404).json({ success: false, message: 'Original uploaded resume file not found' });
});

app.get("/", (req, res) => {
  res.send("HRM Backend Running");
});

app.use("/api/public/jobs", require("./routes/publicJobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/app/applications", require("./routes/applications"));
app.use("/api/jobs", require("./routes/requirements"));
app.use("/api/attendance", require("./routes/attendanceRoute"));
app.use("/app/attendance", require("./routes/attendanceRoute"));
app.use("/api/auth", require("./routes/auth"));
app.use("/app/auth", require("./routes/auth"));
app.use("/api/auth/admin-register", require("./routes/adminRegister"));
app.use("/app/auth/admin-register", require("./routes/adminRegister"));
app.use("/app/dashboard", require("./routes/dashboard"));
app.use("/app/employees", require("./routes/employee"));
app.use("/app/requirements", require("./routes/requirements"));
app.use("/app/candidates", require("./routes/candidates"));
app.use("/app/interviews", require("./routes/interviews"));
app.use("/app/offers", require("./routes/offerLetters"));
app.use("/app/pipeline", require("./routes/pipeline"));
app.use("/app/joiners", require("./routes/newJoiners"));
app.use("/app/verifications", require("./routes/verifications"));
app.use("/app/assets", require("./routes/assets"));
app.use("/app/orientations", require("./routes/orientations"));
app.use("/app/probations", require("./routes/probations"));
app.use("/app/goals", require("./routes/goals"));
app.use("/app/kpis", require("./routes/kpis"));
app.use("/app/kras", require("./routes/kras"));
app.use("/app/appraisals", require("./routes/appraisals"));
app.use("/app/reviews", require("./routes/reviews"));
app.use("/app/feedback", require("./routes/feedback"));
app.use("/app/promotions", require("./routes/promotions"));

app.use("/app/leaves", require("./routes/leaves"));
app.use("/app/organization", require("./routes/organizationRoute"));
app.use("/app", require("./routes/organizationRoute"));
app.use("/api", require("./routes/organizationRoute"));
app.use("/app/payroll", require("./routes/payroll"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/app/tickets", require("./routes/tickets"));
app.use("/app/rbac", require("./routes/rbacRoute"));
app.use("/app/notifications", require("./routes/notifications"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/app/client-visits", require("./routes/clientVisits"));
app.use("/api/client-visits", require("./routes/clientVisits"));

// Projects Management Module
app.use("/app/projects", require("./routes/projects"));
app.use("/app/tasks", require("./routes/tasks"));
app.use("/app/sprints", require("./routes/sprints"));
app.use("/app/timesheets", require("./routes/timesheets"));
app.use("/app/milestones", require("./routes/milestones"));
app.use("/app/project-team", require("./routes/teamMembers"));

// Client Management Module
app.use("/app/clients", require("./routes/clients"));
app.use("/app/reports", require("./routes/reports"));
app.use("/app/expenses", require("./routes/expenses"));
app.use("/app/documents", require("./routes/documents"));
app.use("/app/aichat", require("./routes/aichatroute"));
app.use("/api/ai", require("./routes/aichatroute"));

app.use((err, req, res, next) => {
  const logMessage = `[${new Date().toISOString()}] Middleware Error: ${err.stack || err}\n\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'error.log'), logMessage);
  } catch (e) {
    console.error('Failed to write to error.log', e);
  }
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SERVER IS RUNNING at http://127.0.0.1:${PORT}`);
});

// Ensure Node.js event loop stays active for HTTP server
setInterval(() => { }, 1000 * 60 * 60);