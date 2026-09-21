require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/database");

// Programmatic Knex Migration Runner on Startup
const knex = require('knex');
const knexConfig = require('./knexfile');
const knexInstance = knex(knexConfig.development);
knexInstance.migrate.latest()
  .then(() => {
    console.log('✅ Cloud database schemas/migrations verified and updated.');
  })
  .catch(err => {
    console.error('❌ Programmatic Knex migration runner failed:', err);
  });

const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("HRM Backend Running");
});

app.use("/api/attendance", require("./routes/attendanceRoute"));
app.use("/app/attendance", require("./routes/attendanceRoute"));
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
app.use("/app/payroll", require("./routes/payroll"));
app.use("/app/tickets", require("./routes/tickets"));

// Projects Management Module
app.use("/app/projects", require("./routes/projects"));
app.use("/app/tasks", require("./routes/tasks"));
app.use("/app/sprints", require("./routes/sprints"));
app.use("/app/timesheets", require("./routes/timesheets"));
app.use("/app/milestones", require("./routes/milestones"));
app.use("/app/project-team", require("./routes/teamMembers"));
app.use("/app/reports", require("./routes/reports"));
app.use("/app/expenses", require("./routes/expenses"));
app.use("/app/documents", require("./routes/documents"));
app.use("/app/aichat", require("./routes/aichatroute"));

app.use((err, req, res, next) => {
  const fs = require('fs');
  const path = require('path');
  const logMessage = `[${new Date().toISOString()}] Uncaught Error: ${err.stack || err}\n\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'error.log'), logMessage);
  } catch (e) {
    console.error('Failed to write to error.log', e);
  }
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING at http://localhost:${PORT}`);
});