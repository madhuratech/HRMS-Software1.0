const Openai = require("openai");
const db = require("../config/database");
const fs = require("fs");
const path = require("path");

let openai;

function getOpenAIClient() {
  if (!openai) {
    const isGroq = !!process.env.GROQ_API_KEY;
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    const baseURL = isGroq ? "https://api.groq.com/openai/v1" : "https://openrouter.ai/api/v1";

    openai = new Openai({
      apiKey,
      baseURL,
    });
  }
  return openai;
}

function getAIModel() {
  return process.env.GROQ_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b";
}

// Helper to wrap db.query in a Promise
function queryDB(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Helper to resolve employee name/ID to a single ID
async function resolveEmployeeId(args) {
  if (args.employee_id) {
    return { id: Number(args.employee_id), error: null };
  }
  if (args.employee_name) {
    const rows = await queryDB(`
      SELECT id, name, email FROM employees WHERE name LIKE ?
    `, [`%${args.employee_name}%`]);

    if (rows.length === 0) {
      return { id: null, error: `Employee named "${args.employee_name}" not found.` };
    }
    if (rows.length > 1) {
      return {
        id: null,
        error: `Multiple employees matched "${args.employee_name}": ${rows.map(r => `${r.name} (ID: ${r.id}, Email: ${r.email})`).join(', ')}. Please specify the exact employee ID.`
      };
    }
    return { id: rows[0].id, name: rows[0].name, error: null };
  }
  return { id: null, error: "Please provide either employee_id or employee_name." };
}

// Helper to resolve department name/ID to a single ID
async function resolveDepartmentId(args) {
  if (args.department_id) {
    return { id: Number(args.department_id), error: null };
  }
  if (args.department_name) {
    const rows = await queryDB(`
      SELECT id, dept_name FROM departments WHERE dept_name LIKE ?
    `, [`%${args.department_name}%`]);

    if (rows.length === 0) {
      return { id: null, error: `Department named "${args.department_name}" not found.` };
    }
    if (rows.length > 1) {
      return {
        id: null,
        error: `Multiple departments matched "${args.department_name}": ${rows.map(r => `${r.dept_name} (ID: ${r.id})`).join(', ')}. Please specify the exact department ID.`
      };
    }
    return { id: rows[0].id, name: rows[0].dept_name, error: null };
  }
  return { id: null, error: "Please provide either department_id or department_name." };
}

// Check if user is authorized for sensitive info (payroll)
async function isAuthorizedForPayroll(userId) {
  if (!userId) return false;
  try {
    const userRows = await queryDB(`
      SELECT r.name as role
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      WHERE e.id = ?
    `, [userId]);
    const userRole = (userRows[0]?.role || '').toUpperCase();
    return userRole === 'SUPER_ADMIN' || userRole === 'SUPER_ADMINISTRATOR' || userRole === 'HR_ADMIN' || userRole === 'HR_MANAGER';
  } catch (e) {
    console.error("Auth check failed:", e);
    return false;
  }
}

// MCP Tools definitions
const tools = [
  {
    type: "function",
    function: {
      name: "get_employees",
      description: "Get list of active employees including their basic details, department, and role.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee_count",
      description: "Get the total count of active employees.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee",
      description: "Get detailed profile information for a specific employee by ID or name.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "number", description: "The ID of the employee" },
          employee_name: { type: "string", description: "The name of the employee" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_employee",
      description: "Search for employees by name, email, phone, or exact employee ID code.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term (name, email, phone, or ID)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_attendance",
      description: "Get today's daily attendance stats and lists of check-ins/outs.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee_attendance",
      description: "Get attendance log records for a specific employee by ID or name.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "number", description: "The ID of the employee" },
          employee_name: { type: "string", description: "The name of the employee" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_leave_balance",
      description: "Get remaining leave balances for a specific employee by ID or name.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "number", description: "The ID of the employee" },
          employee_name: { type: "string", description: "The name of the employee" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_leave_requests",
      description: "Get leave requests/applications list. Can be filtered optionally by employee ID or name.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "number", description: "Optional employee ID to filter applications" },
          employee_name: { type: "string", description: "Optional employee name to filter applications" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_departments",
      description: "Get list of all HR departments.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_department_employees",
      description: "Get list of employees in a department by its ID or name.",
      parameters: {
        type: "object",
        properties: {
          department_id: { type: "number" },
          department_name: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_designations",
      description: "Get list of designations/roles available in the organization.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_holidays",
      description: "Get list of company holidays. Note: This reports setup context when DB doesn't have a holiday table.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_payroll_summary",
      description: "Get payroll summary details (requires admin role authorization).",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee_payroll",
      description: "Get salary slips / payroll details for a specific employee ID or name (requires authorization).",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "number" },
          employee_name: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_job_positions",
      description: "Get list of current job position vacancies and requirements.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_candidates",
      description: "Get list of recruitment candidates and applicants.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_interview_schedules",
      description: "Get list of scheduled candidate interviews.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_company_profile",
      description: "Get official organization profiles, contact, shift policies and settings.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "Get list of project boards.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_tasks",
      description: "Get list of project tasks.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_support_tickets",
      description: "Get list of support tickets filed by employees.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current or external information (e.g. latest version of software, today's news, current exchange rates, weather, general information that needs current data).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The web search query string." }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluate math calculations accurately (e.g. basic arithmetic, percentages, multiplications).",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "The mathematical expression to calculate (e.g. '125 * 48')." }
        },
        required: ["expression"]
      }
    }
  }
];

// Execute actual DB queries corresponding to tool calls
async function executeTool(name, args, userId) {
  let result;
  let summary = "";

  // Authorization checks
  if (name === "get_payroll_summary" || name === "get_employee_payroll") {
    const authorized = await isAuthorizedForPayroll(userId);
    if (!authorized) {
      throw new Error("Forbidden: Insufficient permissions to view sensitive payroll or salary data.");
    }
  }

  switch (name) {
    case "get_employees": {
      const rows = await queryDB(`
        SELECT e.id, e.name, e.email, e.phone, e.status, dept.dept_name as department, desg.role_name as role
        FROM employees e
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        WHERE e.status = 'Active'
      `);
      result = rows;
      summary = `Fetched active employees list (${rows.length} records)`;
      break;
    }
    case "get_employee_count": {
      const rows = await queryDB("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'");
      result = { count: rows[0].count };
      summary = `Fetched total count of active employees (${rows[0].count})`;
      break;
    }
    case "get_employee": {
      const { id, error } = await resolveEmployeeId(args);
      if (error) {
        result = { error };
        summary = error;
        break;
      }
      const rows = await queryDB(`
        SELECT e.id, e.name, e.email, e.phone, e.dob, e.join_date, e.status, e.gender, e.employment_type, e.salary, e.address,
               b.branch_name, dept.dept_name as department, desg.role_name as role, m.name as manager_name
        FROM employees e
        LEFT JOIN branches b ON e.branch_id = b.id
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        LEFT JOIN employees m ON e.manager_id = m.id
        WHERE e.id = ?
      `, [id]);
      result = rows[0] || null;
      summary = result ? `Fetched details for employee ID ${id}` : `Employee ID ${id} not found`;
      break;
    }
    case "search_employee": {
      const q = `%${args.query}%`;
      const rows = await queryDB(`
        SELECT e.id, 
               COALESCE(e.employee_code, e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as employee_code,
               e.name, e.email, e.phone, e.status, dept.dept_name as department, desg.role_name as role
        FROM employees e
        LEFT JOIN departments dept ON e.department_id = dept.id
        LEFT JOIN designations desg ON e.designation_id = desg.id
        WHERE e.name LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR e.employee_code LIKE ? OR e.employee_id LIKE ? OR CONCAT('EMP', LPAD(e.id, 4, '0')) = ?
      `, [q, q, q, q, q, args.query]);
      result = rows;
      summary = `Searched employees with query "${args.query}" (${rows.length} matches)`;
      break;
    }
    case "get_attendance": {
      const rows = await queryDB(`
        SELECT e.name, a.punch_type, a.punch_time
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE DATE(a.punch_time) = CURDATE()
        ORDER BY a.punch_time DESC
      `);
      result = rows;
      summary = `Fetched today's attendance logs (${rows.length} entries)`;
      break;
    }
    case "get_employee_attendance": {
      const { id, error } = await resolveEmployeeId(args);
      if (error) {
        result = { error };
        summary = error;
        break;
      }
      const rows = await queryDB(`
        SELECT punch_type, punch_time
        FROM attendance
        WHERE employee_id = ?
        ORDER BY punch_time DESC
        LIMIT 20
      `, [id]);
      result = rows;
      summary = `Fetched attendance history for employee ID ${id} (${rows.length} entries)`;
      break;
    }
    case "get_leave_balance": {
      const { id, error } = await resolveEmployeeId(args);
      if (error) {
        result = { error };
        summary = error;
        break;
      }
      const rows = await queryDB(`
        SELECT lb.days_remaining, lt.name as leave_name, lt.code as leave_code
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE lb.employee_id = ?
      `, [id]);
      result = rows;
      summary = `Fetched leave balances for employee ID ${id}`;
      break;
    }
    case "get_leave_requests": {
      let id = null;
      if (args.employee_id || args.employee_name) {
        const { id: resolvedId, error } = await resolveEmployeeId(args);
        if (error) {
          result = { error };
          summary = error;
          break;
        }
        id = resolvedId;
      }
      let sql = `
        SELECT la.id, la.start_date, la.end_date, la.reason, la.status, e.name as employee_name, lt.name as leave_name
        FROM leave_applications la
        JOIN employees e ON la.employee_id = e.id
        JOIN leave_types lt ON la.leave_type_id = lt.id
      `;
      const params = [];
      if (id) {
        sql += " WHERE la.employee_id = ?";
        params.push(id);
      }
      sql += " ORDER BY la.applied_on DESC LIMIT 30";
      const rows = await queryDB(sql, params);
      result = rows;
      summary = `Fetched leave applications list (${rows.length} records)`;
      break;
    }
    case "get_departments": {
      const rows = await queryDB("SELECT id, dept_name FROM departments ORDER BY dept_name");
      result = rows;
      summary = `Fetched departments list (${rows.length} records)`;
      break;
    }
    case "get_department_employees": {
      const { id, error } = await resolveDepartmentId(args);
      if (error) {
        result = { error };
        summary = error;
        break;
      }
      const rows = await queryDB(`
        SELECT e.id, e.name, e.email, e.phone, e.status, desg.role_name as role
        FROM employees e
        LEFT JOIN designations desg ON e.designation_id = desg.id
        WHERE e.department_id = ?
      `, [id]);
      result = rows;
      summary = `Fetched employees in department ID ${id} (${rows.length} records)`;
      break;
    }
    case "get_designations": {
      const rows = await queryDB("SELECT id, role_code, role_name FROM designations ORDER BY role_name");
      result = rows;
      summary = `Fetched designations list (${rows.length} records)`;
      break;
    }
    case "get_holidays": {
      // Holidays are frontend-only, let's inform the model clearly
      result = {
        message: "Holidays are configured on the frontend only. No holidays database table exists in this installation.",
        holidays: [
          { date: '01 Jan 2026', day: 'Thu', name: 'New Year', occasion: 'New Year Celebration', location: 'All', type: 'Gazetted', status: 'Active' },
          { date: '26 Jan 2026', day: 'Mon', name: 'Republic Day', occasion: 'National Holiday', location: 'All', type: 'Gazetted', status: 'Active' },
          { date: '15 Aug 2026', day: 'Sat', name: 'Independence Day', occasion: 'National Holiday', location: 'All', type: 'Gazetted', status: 'Active' },
          { date: '02 Oct 2026', day: 'Fri', name: 'Gandhi Jayanti', occasion: 'National Holiday', location: 'All', type: 'Gazetted', status: 'Active' },
          { date: '25 Dec 2026', day: 'Fri', name: 'Christmas', occasion: 'Christian Festival', location: 'All', type: 'Optional', status: 'Active' }
        ]
      };
      summary = "Holidays list (resolved from static frontend holiday configurations)";
      break;
    }
    case "get_payroll_summary": {
      const runs = await queryDB("SELECT * FROM payroll_runs ORDER BY period_year DESC, period_month DESC LIMIT 10");
      const stats = await queryDB("SELECT SUM(net_salary) as total_payout, COUNT(*) as payslips_count FROM payslips");
      result = { runs, stats: stats[0] };
      summary = `Fetched payroll summary stats (${runs.length} runs)`;
      break;
    }
    case "get_employee_payroll": {
      const { id, error } = await resolveEmployeeId(args);
      if (error) {
        result = { error };
        summary = error;
        break;
      }
      const rows = await queryDB(`
        SELECT p.*, r.period_month, r.period_year
        FROM payslips p
        JOIN payroll_runs r ON p.payroll_run_id = r.id
        WHERE p.employee_id = ?
        ORDER BY r.period_year DESC, r.period_month DESC
      `, [id]);
      result = rows;
      summary = `Fetched payslip history for employee ID ${id} (${rows.length} records)`;
      break;
    }
    case "get_job_positions": {
      const rows = await queryDB(`
        SELECT r.*, d.dept_name as department, des.role_name as designation
        FROM requirements r
        LEFT JOIN departments d ON r.department_id = d.id
        LEFT JOIN designations des ON r.designation_id = des.id
        WHERE r.deleted_at IS NULL
        ORDER BY r.created_at DESC
      `);
      result = rows;
      summary = `Fetched job positions vacancies (${rows.length} open/draft requirements)`;
      break;
    }
    case "get_candidates": {
      const rows = await queryDB(`
        SELECT c.*, d.dept_name as department
        FROM candidates c
        LEFT JOIN departments d ON c.department_id = d.id
        ORDER BY c.created_at DESC
      `);
      result = rows;
      summary = `Fetched candidates list (${rows.length} applicants)`;
      break;
    }
    case "get_interview_schedules": {
      const rows = await queryDB(`
        SELECT i.*, c.candidate_name, e.name as interviewer_name
        FROM interview_schedules i
        JOIN candidates c ON i.candidate_id = c.id
        JOIN employees e ON i.interviewer_id = e.id
        ORDER BY i.interview_date DESC, i.interview_time DESC
      `);
      result = rows;
      summary = `Fetched interview schedules (${rows.length} entries)`;
      break;
    }
    case "get_company_profile": {
      const rows = await queryDB("SELECT * FROM company_profile LIMIT 1");
      result = rows[0] || null;
      summary = result ? `Fetched profile settings for "${result.company_name}"` : "Company profile settings not found";
      break;
    }
    case "get_projects": {
      const rows = await queryDB("SELECT * FROM projects ORDER BY start_date DESC");
      result = rows;
      summary = `Fetched active projects (${rows.length} boards)`;
      break;
    }
    case "get_tasks": {
      const rows = await queryDB(`
        SELECT t.*, p.name as project_name, e.name as assignee_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN employees e ON t.assignee_id = e.id
        ORDER BY t.due_date DESC
      `);
      result = rows;
      summary = `Fetched sprint tasks (${rows.length} items)`;
      break;
    }
    case "get_support_tickets": {
      const rows = await queryDB(`
        SELECT t.*, e.name as employee_name, cat.name as category, pri.name as priority
        FROM tickets t
        JOIN employees e ON t.employee_id = e.id
        LEFT JOIN ticket_categories cat ON t.category_id = cat.id
        LEFT JOIN ticket_priorities pri ON t.priority_id = pri.id
        ORDER BY t.created_at DESC
      `);
      result = rows;
      summary = `Fetched help desk support tickets (${rows.length} reports)`;
      break;
    }
    case "web_search": {
      const { query } = args;
      const searchResults = await performWebSearch(query);
      result = searchResults;
      summary = `Searched web for "${query}" (${searchResults.length} results)`;
      break;
    }
    case "calculator": {
      const { expression } = args;
      try {
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
          throw new Error("Invalid characters in math expression");
        }
        const evalResult = Function(`"use strict"; return (${expression})`)();
        result = { expression, result: evalResult };
        summary = `Calculated expression "${expression}" = ${evalResult}`;
      } catch (err) {
        result = { expression, error: err.message };
        summary = `Failed to calculate expression "${expression}": ${err.message}`;
      }
      break;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return { result, summary };
}

// Main generation function executing OpenAI tool calling flow with conversation memory
// AI routing helper using LLM
async function routeIntent(message, conversationId, dbMessages) {
  const client = getOpenAIClient();

  // Format recent chat history context for the router
  let historyContext = "";
  if (dbMessages && dbMessages.length > 0) {
    historyContext = dbMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }

  const routerPrompt = `You are an AI Routing Assistant for an enterprise HRMS chat assistant.
Analyze the user's current message and determine the single most appropriate intent.
If the current message contains references/pronouns (like "his designation", "their leaves", "him", "show it", "what is his casual leave balance?"), resolve who or what is being referred to by looking at the Chat History.

Available intents:
1. HRMS - Queries requiring specific data from the database/HRMS app (e.g. searching/listing employees, designations, departments, viewing attendance logs, leave balances, leave requests, holiday list, payroll/salary details, recruitment, candidates, schedules, company profile details, projects, tasks, support tickets).
2. POLICY/RAG - Questions asking about general company policy rules, guidelines, leave policies (e.g., maternity leave, work from home, attendance rules, dress code, leave days provided, or generic policies).
3. CURRENT_EXTERNAL - Current events, weather, exchange rates, politics, news, latest software releases, or facts that require external/live web search (e.g., current Tamil Nadu CM, current PM, today's news, latest React version, USD to INR rate).
4. CASUAL - Casual conversations, greetings, small talk, testing, thank you, good morning, check ins (e.g., "Hi", "Hello", "Saptiya?", "How are you?").
5. GENERAL - Non-current general knowledge, programming theory, education, explanations, math (e.g., "What is Python?", "Explain React", "What is machine learning?", "How does an API work?").

Chat History:
${historyContext || "None"}

User Message: "${message}"

Respond strictly with a JSON object in this format (no markdown formatting blocks, just raw JSON text):
{
  "intent": "HRMS" | "POLICY/RAG" | "CURRENT_EXTERNAL" | "CASUAL" | "GENERAL",
  "reasoning": "Why this intent was selected based on the message and history context"
}`;

  try {
    const response = await client.chat.completions.create({
      model: getAIModel(),
      messages: [
        { role: "system", content: "You are a precise classifier. Return only the JSON object." },
        { role: "user", content: routerPrompt }
      ],
      max_tokens: 200,
      temperature: 0.0
    });

    let text = response.choices[0].message.content || '';
    text = text.replace(/```json/i, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);
    console.log(`[AI ROUTER] Classified: "${message}" -> ${result.intent}. Reasoning: ${result.reasoning}`);
    return result.intent || 'GENERAL';
  } catch (e) {
    console.error("Router error, fallback to keyword router:", e);
    if (isHRMSQuestion(message)) return 'HRMS';
    if (requiresCurrentInformation(message)) return 'CURRENT_EXTERNAL';
    if (message.toLowerCase().includes('policy') || message.toLowerCase().includes('maternity') || message.toLowerCase().includes('work-from-home') || message.toLowerCase().includes('wfh')) return 'POLICY/RAG';
    const m = message.toLowerCase();
    if (m === 'hi' || m === 'hello' || m.includes('morning') || m.includes('thank') || m.includes('saptiya')) return 'CASUAL';
    return 'GENERAL';
  }
}

// Local RAG retriever
function retrievePolicyContext(query) {
  try {
    const filePath = path.join(__dirname, '../data/policies.json');
    if (!fs.existsSync(filePath)) {
      console.warn("policies.json not found at:", filePath);
      return "";
    }
    const policies = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const q = query.toLowerCase();
    let matches = [];
    for (const policy of policies) {
      const keywords = policy.title.toLowerCase().split(/\s+/).concat(policy.category.toLowerCase().split(/\s+/));
      const hasKeyword = keywords.some(kw => kw.length > 3 && q.includes(kw)) || q.includes('policy');
      if (hasKeyword || q.includes(policy.title.toLowerCase().split(' ')[0])) {
        matches.push(policy);
      }
    }
    if (matches.length === 0) {
      matches = policies;
    }
    return matches.map(m => `Category: ${m.category}\nTitle: ${m.title}\nContent: ${m.content}`).join('\n\n');
  } catch (e) {
    console.error("RAG retrieval error:", e);
    return "";
  }
}

function sanitizeConversationHistory(dbMessages, isToolEnabled) {
  const messages = [];

  if (!isToolEnabled) {
    for (const msg of dbMessages) {
      if ((msg.role === 'user' || msg.role === 'assistant') && !msg.tool_call_id) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
    return messages;
  }

  const dbMsgs = [];
  for (const msg of dbMessages) {
    if (msg.role === 'assistant' && msg.tool_call_id) {
      const prev = dbMsgs[dbMsgs.length - 1];
      if (prev && prev.role === 'assistant' && prev.tool_calls) {
        prev.tool_calls.push({
          id: msg.tool_call_id,
          type: 'function',
          function: {
            name: msg.tool_name,
            arguments: msg.content
          }
        });
      } else {
        dbMsgs.push({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: msg.tool_call_id,
              type: 'function',
              function: {
                name: msg.tool_name,
                arguments: msg.content
              }
            }
          ]
        });
      }
    } else if (msg.role === 'tool') {
      dbMsgs.push({
        role: 'tool',
        name: msg.tool_name,
        tool_call_id: msg.tool_call_id,
        content: msg.content
      });
    } else {
      dbMsgs.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  const pendingToolCalls = new Map();
  for (const msg of dbMsgs) {
    if (msg.role === 'user') {
      pendingToolCalls.clear();
      messages.push(msg);
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls) {
        const validToolCalls = msg.tool_calls.filter(tc =>
          tc.id && tc.type === 'function' && tc.function && tc.function.name && tc.function.arguments
        );
        if (validToolCalls.length > 0) {
          const validMsg = { ...msg, tool_calls: validToolCalls };
          validToolCalls.forEach(tc => pendingToolCalls.set(tc.id, tc));
          messages.push(validMsg);
        } else {
          console.warn("Skipping malformed assistant tool-call message in history.");
        }
      } else {
        pendingToolCalls.clear();
        messages.push(msg);
      }
    } else if (msg.role === 'tool') {
      if (msg.tool_call_id && pendingToolCalls.has(msg.tool_call_id)) {
        messages.push(msg);
        pendingToolCalls.delete(msg.tool_call_id);
      } else {
        console.warn(`Skipping orphaned or undefined tool response for call_id: ${msg.tool_call_id}`);
      }
    }
  }

  return messages;
}

// Main generation function executing OpenAI tool calling flow with conversation memory
async function generateResponse(message, conversationId, userId) {
  try {
    const client = getOpenAIClient();

    // 1. Ensure conversation exists
    const convs = await queryDB("SELECT id FROM ai_conversations WHERE conversation_id = ?", [conversationId]);
    if (convs.length === 0) {
      let title = message.trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + "...";
      }
      await queryDB(
        "INSERT INTO ai_conversations (conversation_id, user_id, title) VALUES (?, ?, ?)",
        [conversationId, userId, title]
      );
    }

    // 2. Load previous messages from DB (limit 30) for history and context
    const dbMessages = await queryDB(`
    SELECT role, content, tool_name, tool_call_id FROM (
      SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 30
    ) sub ORDER BY id ASC
  `, [conversationId]);

    // 3. Save User Message to DB
    await queryDB(
      "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)",
      [conversationId, message]
    );

    // 4. Determine user message intent using AI routing layer
    const intent = await routeIntent(message, conversationId, dbMessages);

    // 5. Handle intent routing
    if (intent === 'CASUAL') {
      console.log('[AI] Route: CASUAL');
      console.log('[AI] Tools enabled: false');
      console.log('[AI] Calling OpenRouter without tools');

      const sysPrompt = `You are a friendly AI HR Assistant. Answer the user's greeting or casual message naturally and concisely. Do NOT call any tools.`;
      const response = await client.chat.completions.create({
        model: getAIModel(),
        messages: [
          { role: "system", content: sysPrompt },
          ...sanitizeConversationHistory(dbMessages, false),
          { role: "user", content: message }
        ],
        max_tokens: 1000
      });
      console.log('[AI] Response received successfully');

      const replyText = response.choices[0].message.content || '';
      const { cleanText, suggestions } = parseSuggestionsFromText(replyText);

      await queryDB(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [conversationId, cleanText]
      );

      return {
        text: cleanText,
        toolUsed: null,
        structuredData: { type: 'casual' },
        suggestions: suggestions || []
      };
    }

    if (intent === 'GENERAL') {
      console.log('[AI] Route: GENERAL');
      console.log('[AI] Tools enabled: false');
      console.log('[AI] Calling OpenRouter without tools');

      const sysPrompt = `You are the AI HR Assistant. Answer general knowledge or theory questions (e.g. programming, math, tech explanations) naturally and theoretically. Do NOT call HRMS tools or search the web.`;
      const response = await client.chat.completions.create({
        model: getAIModel(),
        messages: [
          { role: "system", content: sysPrompt },
          ...sanitizeConversationHistory(dbMessages, false),
          { role: "user", content: message }
        ],
        max_tokens: 2000
      });
      console.log('[AI] Response received successfully');

      const replyText = response.choices[0].message.content || '';
      const { cleanText, suggestions } = parseSuggestionsFromText(replyText);

      await queryDB(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [conversationId, cleanText]
      );

      return {
        text: cleanText,
        toolUsed: null,
        structuredData: { type: 'theory' },
        suggestions: suggestions || []
      };
    }

    if (intent === 'POLICY/RAG') {
      console.log('[AI] Route: POLICY/RAG');
      console.log('[AI] Tools enabled: false');
      console.log('[AI] Calling OpenRouter without tools');

      const policyContext = retrievePolicyContext(message);
      const sysPrompt = `You are the AI HR Assistant. Answer company-specific policy questions strictly using the provided policy documents context below.
If the provided context does not contain the answer, say "I'm sorry, but that information is unavailable in our company policy documents."
Do NOT invent or assume any policies.

Company Policy Documents:
${policyContext || "None available."}`;

      const response = await client.chat.completions.create({
        model: getAIModel(),
        messages: [
          { role: "system", content: sysPrompt },
          ...sanitizeConversationHistory(dbMessages, false),
          { role: "user", content: message }
        ],
        max_tokens: 2000
      });
      console.log('[AI] Response received successfully');

      const replyText = response.choices[0].message.content || '';
      const { cleanText, suggestions } = parseSuggestionsFromText(replyText);

      await queryDB(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [conversationId, cleanText]
      );

      return {
        text: cleanText,
        toolUsed: null,
        structuredData: { type: 'theory' },
        suggestions: suggestions || []
      };
    }

    if (intent === 'CURRENT_EXTERNAL') {
      const searchResults = await performWebSearch(message);
      const sysPrompt = `You are the AI HR Assistant. Answer current/external questions using the provided web search results.
Always prioritize search results over training memory. If the search results do not contain the answer, say you don't know rather than speculating.
Web Search Results:
${JSON.stringify(searchResults)}`;

      const response = await client.chat.completions.create({
        model: getAIModel(),
        messages: [
          { role: "system", content: sysPrompt },
          ...sanitizeConversationHistory(dbMessages, false),
          { role: "user", content: message }
        ],
        max_tokens: 2000
      });

      const replyText = response.choices[0].message.content || '';
      const { cleanText, suggestions } = parseSuggestionsFromText(replyText);

      await queryDB(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [conversationId, cleanText]
      );

      return {
        text: cleanText,
        toolUsed: {
          name: "Web Search Tool",
          status: "Success",
          description: `Searched web for "${message}"`
        },
        structuredData: { type: 'web_answer', query: message, results: searchResults },
        suggestions: suggestions || []
      };
    }

    console.log('[AI] Route: HRMS');
    console.log('[AI] Tools enabled: true');

    const messages = [
      {
        role: "system",
        content: `You are the AI HR Assistant for a human resource management system (HRMS).
You answer questions related to employees, leave management, attendance, payroll, departments, designations, holidays, recruitment, projects, and company information by executing tools.
Never guess or invent numbers or names.
Max 5 tool iterations per response.

PRONOUN RESOLUTION & HISTORY:
Always analyze the conversation history to resolve pronouns like "he", "she", "his", "her", "them", "it". For example, if the user previously searched for "Super Admin" or "John Doe" and now asks "What is his designation?", resolve "his" to "Super Admin" or "John Doe", and execute the search_employee tool or appropriate details tool to retrieve the information. Do not ask the user for details that are already present in the chat history.

FOLLOW-UP SUGGESTIONS:
After answering, append this JSON suffix to your final text response:
SUGGESTIONS:["suggestion 1","suggestion 2","suggestion 3"]`
      },
      ...sanitizeConversationHistory(dbMessages, true),
      {
        role: "user",
        content: message
      }
    ];

    let toolUsed = null;
    let structuredData = null; // holds typed result for rich frontend rendering
    const MAX_TOOL_ITERATIONS = 5;

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const response = await client.chat.completions.create({
        model: getAIModel(),
        messages,
        tools: tools.filter(t => t.function.name !== 'web_search'),
        tool_choice: "auto",
        max_tokens: 4096
      });

      const responseMessage = response.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          console.log('[AI] Tool call: ' + toolCall.function.name);
          console.log('[AI] Tool call ID: ' + toolCall.id);

          await queryDB(
            "INSERT INTO ai_messages (conversation_id, role, content, tool_name, tool_call_id) VALUES (?, 'assistant', ?, ?, ?)",
            [conversationId, toolCall.function.arguments, toolCall.function.name, toolCall.id]
          );
        }

        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          let functionArgs = {};
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error("Error parsing function arguments:", e);
          }

          const toolTitles = {
            get_employees: "Employee List Tool",
            get_employee_count: "Employee Count Tool",
            get_employee: "Employee Detail Tool",
            search_employee: "Employee Search Tool",
            get_attendance: "Attendance Tool",
            get_employee_attendance: "Attendance Detail Tool",
            get_leave_balance: "Leave Balance Tool",
            get_leave_requests: "Leave Request Tool",
            get_departments: "Department Tool",
            get_department_employees: "Department Employees Tool",
            get_designations: "Designation Tool",
            get_holidays: "Holiday Tool",
            get_payroll_summary: "Payroll Summary Tool",
            get_employee_payroll: "Employee Payroll Tool",
            get_job_positions: "Recruitment Vacancy Tool",
            get_candidates: "Candidate Applicants Tool",
            get_interview_schedules: "Interview Schedule Tool",
            get_company_profile: "Company Profile Tool",
            get_projects: "Project Boards Tool",
            get_tasks: "Sprint Tasks Tool",
            get_support_tickets: "Support Helpdesk Tool",
            calculator: "Calculator Tool"
          };

          try {
            const { result, summary } = await executeTool(functionName, functionArgs, userId);

            console.log('[AI] Tool result received');

            toolUsed = {
              name: toolTitles[functionName] || functionName,
              status: "Success",
              description: summary
            };

            if (functionName === 'get_employees' && Array.isArray(result)) {
              structuredData = { type: 'employee_list', employees: result };
            } else if (functionName === 'get_employee' && result && !result.error) {
              structuredData = { type: 'employee_profile', employee: result };
            } else if ((functionName === 'search_employee' || functionName === 'get_employee_count') && result && !result.error) {
              if (Array.isArray(result) && result.length === 1) {
                structuredData = { type: 'employee_profile', employee: result[0] };
              } else if (Array.isArray(result) && result.length > 1) {
                structuredData = { type: 'employee_list', employees: result };
              }
            } else if (functionName === 'get_attendance' && Array.isArray(result)) {
              structuredData = { type: 'attendance_summary', attendance: result };
            } else if (functionName === 'get_employee_attendance' && Array.isArray(result)) {
              structuredData = { type: 'employee_attendance', attendance: result, employee_name: functionArgs.employee_name };
            } else if (functionName === 'get_leave_balance' && Array.isArray(result)) {
              structuredData = { type: 'leave_balance', balances: result, employee_name: functionArgs.employee_name || String(functionArgs.employee_id || '') };
            } else if (functionName === 'get_leave_requests' && Array.isArray(result)) {
              structuredData = { type: 'leave_request_list', requests: result };
            } else if (functionName === 'get_departments' && Array.isArray(result)) {
              structuredData = { type: 'department_list', departments: result };
            } else if (functionName === 'get_department_employees' && Array.isArray(result)) {
              structuredData = { type: 'department_employees', employees: result, department_name: functionArgs.department_name };
            } else if (functionName === 'get_designations' && Array.isArray(result)) {
              structuredData = { type: 'designation_list', designations: result };
            } else if (functionName === 'get_holidays' && result) {
              structuredData = { type: 'holiday_list', holidays: Array.isArray(result) ? result : (result.holidays || []) };
            } else if (functionName === 'get_payroll_summary' && result) {
              structuredData = { type: 'payroll_summary', summary: result };
            } else if (functionName === 'get_employee_payroll' && Array.isArray(result)) {
              structuredData = { type: 'employee_payroll', payroll: result, employee_name: functionArgs.employee_name };
            } else if (functionName === 'get_job_positions' && Array.isArray(result)) {
              structuredData = { type: 'job_positions', positions: result };
            } else if (functionName === 'get_candidates' && Array.isArray(result)) {
              structuredData = { type: 'candidates', candidates: result };
            } else if (functionName === 'get_interview_schedules' && Array.isArray(result)) {
              structuredData = { type: 'interview_schedules', schedules: result };
            } else if (functionName === 'get_company_profile' && result) {
              structuredData = { type: 'company_profile', profile: result };
            } else if (functionName === 'get_projects' && Array.isArray(result)) {
              structuredData = { type: 'projects', projects: result };
            } else if (functionName === 'get_tasks' && Array.isArray(result)) {
              structuredData = { type: 'tasks', tasks: result };
            } else if (functionName === 'get_support_tickets' && Array.isArray(result)) {
              structuredData = { type: 'support_tickets', tickets: result };
            } else if (functionName === 'calculator' && result) {
              structuredData = { type: 'theory', calculation: result };
            }

            await queryDB(
              "INSERT INTO ai_messages (conversation_id, role, content, tool_name, tool_call_id) VALUES (?, 'tool', ?, ?, ?)",
              [conversationId, JSON.stringify(result), functionName, toolCall.id]
            );

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify(result)
            });

          } catch (toolError) {
            console.error("Error executing tool:", toolError);
            toolUsed = {
              name: toolTitles[functionName] || functionName,
              status: "Failed",
              description: `Failed to query: ${toolError.message}`
            };

            await queryDB(
              "INSERT INTO ai_messages (conversation_id, role, content, tool_name, tool_call_id) VALUES (?, 'tool', ?, ?, ?)",
              [conversationId, JSON.stringify({ error: toolError.message }), functionName, toolCall.id]
            );

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify({ error: toolError.message })
            });
          }
        }
      } else {
        console.log('[AI] Final response received');
        const { cleanText: rawText, suggestions: rawSugs } = parseSuggestionsFromText(responseMessage.content || '');

        await queryDB(
          "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
          [conversationId, rawText]
        );

        return {
          text: rawText,
          toolUsed,
          structuredData,
          suggestions: rawSugs
        };
      }
    }

    const finalResponse = await client.chat.completions.create({
      model: getAIModel(),
      messages,
      max_tokens: 4096
    });

    const { cleanText: fbText, suggestions: fbSugs } = parseSuggestionsFromText(finalResponse.choices[0].message.content || '');
    await queryDB(
      "INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
      [conversationId, fbText]
    );

    return {
      text: fbText,
      toolUsed,
      structuredData,
      suggestions: fbSugs
    };
  } catch (err) {
    console.warn("AI model execution issue, falling back to local HRMS intelligence engine:", err.message);
    return await handleOfflineFallback(message, conversationId, userId, err);
  }
}

// Resilient Fallback Engine for handling requests when upstream LLM is unreachable or errors
async function handleOfflineFallback(message, conversationId, userId, originalError) {
  try {
    const q = (message || '').toLowerCase().trim();

    // 1. GREETINGS & CASUAL TALK
    const greetings = ['hi', 'hai', 'haii', 'hello', 'hey', 'heyy', 'hola', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'yo', 'saptiya', 'vanakkam', 'namaste'];
    const isGreeting = greetings.some(g => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g) || q.includes('bro') || q.includes('how are you'));

    if (isGreeting) {
      const reply = "Hello! 👋 I'm your HRMS AI Assistant. I can help you search employees, view attendance reports, check leave balances, list departments, and answer company HR policies. How can I help you today?";
      const suggestions = ["Show employee list", "View attendance summary", "Check leave balances", "Show departments"];
      await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
      return {
        text: reply,
        toolUsed: null,
        structuredData: null,
        suggestions
      };
    }

    // 2. MATH / CALCULATOR
    if (isCalculation(message)) {
      try {
        const { result, summary } = await executeTool('calculator', { expression: message.replace(/calculate/i, '').trim() }, userId);
        const reply = `Result: ${result.result}`;
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Calculator Tool", status: "Success", description: summary },
          structuredData: null,
          suggestions: ["Show employee list", "View attendance summary"]
        };
      } catch (calcErr) {
        // continue
      }
    }

    // 3. ATTENDANCE
    if (q.includes('attendance') || q.includes('present') || q.includes('absent') || q.includes('check in') || q.includes('check out') || q.includes('who is in')) {
      try {
        const { result, summary } = await executeTool('get_attendance', {}, userId);
        const reply = "Here is the attendance summary records from the system:";
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Attendance Tool", status: "Success", description: summary },
          structuredData: { type: 'attendance_summary', attendance: result },
          suggestions: ["Show employee list", "Check leave balances", "Show departments"]
        };
      } catch (attErr) {
        console.error("Fallback attendance tool error:", attErr);
      }
    }

    // 4. EMPLOYEES & DIRECTORY
    if (q.includes('employee') || q.includes('staff') || q.includes('worker') || q.includes('colleague') || q.includes('team member')) {
      try {
        const nameMatch = message.match(/(?:for|of|named|employee)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
        if (q.includes('search') || (nameMatch && !q.includes('list') && !q.includes('all') && !q.includes('show me'))) {
          const searchParam = nameMatch ? nameMatch[1] : message.replace(/employee|search|find|details|profile|info/gi, '').trim();
          if (searchParam && searchParam.length > 1) {
            const { result, summary } = await executeTool('search_employee', { query: searchParam }, userId);
            if (result && !result.error && result.length > 0) {
              const reply = `Found matching employee details for "${searchParam}":`;
              await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
              return {
                text: reply,
                toolUsed: { name: "Employee Search Tool", status: "Success", description: summary },
                structuredData: result.length === 1 ? { type: 'employee_profile', employee: result[0] } : { type: 'employee_list', employees: result },
                suggestions: ["View attendance summary", "Check leave balances", "Show departments"]
              };
            }
          }
        }

        const { result, summary } = await executeTool('get_employees', {}, userId);
        const reply = `Here is the organization employee directory (${Array.isArray(result) ? result.length : 0} active employees):`;
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Employee List Tool", status: "Success", description: summary },
          structuredData: { type: 'employee_list', employees: result },
          suggestions: ["View attendance summary", "Check leave balances", "Show departments"]
        };
      } catch (empErr) {
        console.error("Fallback employee tool error:", empErr);
      }
    }

    // 5. LEAVES & VACATIONS
    if (q.includes('leave') || q.includes('vacation')) {
      try {
        if (q.includes('request') || q.includes('pending') || q.includes('applied') || q.includes('application')) {
          const { result, summary } = await executeTool('get_leave_requests', {}, userId);
          const reply = "Here are the recent leave requests:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Leave Request Tool", status: "Success", description: summary },
            structuredData: { type: 'leave_request_list', requests: result },
            suggestions: ["Check leave balances", "Show employee list", "View attendance summary"]
          };
        } else {
          const { result, summary } = await executeTool('get_leave_balance', {}, userId);
          const reply = "Here is the leave balance details:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Leave Balance Tool", status: "Success", description: summary },
            structuredData: { type: 'leave_balance', balances: result },
            suggestions: ["Show leave requests", "View attendance summary", "Show employee list"]
          };
        }
      } catch (leaveErr) {
        console.error("Fallback leave tool error:", leaveErr);
      }
    }

    // 6. DEPARTMENTS
    if (q.includes('department') || q.includes('dept')) {
      try {
        const { result, summary } = await executeTool('get_departments', {}, userId);
        const reply = "Here is the list of departments in the organization:";
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Department Tool", status: "Success", description: summary },
          structuredData: { type: 'department_list', departments: result },
          suggestions: ["Show employee list", "View designations", "View attendance summary"]
        };
      } catch (deptErr) {
        console.error("Fallback department tool error:", deptErr);
      }
    }

    // 7. DESIGNATIONS & ROLES
    if (q.includes('designation') || q.includes('roles') || q.includes('job title')) {
      try {
        const { result, summary } = await executeTool('get_designations', {}, userId);
        const reply = "Here are the designations available in the organization:";
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Designation Tool", status: "Success", description: summary },
          structuredData: { type: 'designation_list', designations: result },
          suggestions: ["Show departments", "Show employee list", "View attendance summary"]
        };
      } catch (desigErr) {
        console.error("Fallback designation tool error:", desigErr);
      }
    }

    // 8. HOLIDAYS
    if (q.includes('holiday') || q.includes('festival') || q.includes('day off')) {
      try {
        const { result, summary } = await executeTool('get_holidays', {}, userId);
        const reply = "Here is the company holiday calendar:";
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Holiday Tool", status: "Success", description: summary },
          structuredData: { type: 'holiday_list', holidays: Array.isArray(result) ? result : (result.holidays || []) },
          suggestions: ["Check leave balances", "Show employee list", "View attendance summary"]
        };
      } catch (holErr) {
        console.error("Fallback holiday tool error:", holErr);
      }
    }

    // 9. RECRUITMENT & CANDIDATES
    if (q.includes('candidate') || q.includes('interview') || q.includes('recruitment') || q.includes('job opening') || q.includes('applicant')) {
      try {
        if (q.includes('interview') || q.includes('schedule')) {
          const { result, summary } = await executeTool('get_interview_schedules', {}, userId);
          const reply = "Here are the upcoming interview schedules:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Interview Schedule Tool", status: "Success", description: summary },
            structuredData: { type: 'interview_schedules', schedules: result },
            suggestions: ["View candidates", "Show job openings", "Show employee list"]
          };
        } else if (q.includes('opening') || q.includes('position') || q.includes('vacancy')) {
          const { result, summary } = await executeTool('get_job_positions', {}, userId);
          const reply = "Here are the active job positions:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Recruitment Vacancy Tool", status: "Success", description: summary },
            structuredData: { type: 'job_positions', positions: result },
            suggestions: ["View candidates", "Show employee list"]
          };
        } else {
          const { result, summary } = await executeTool('get_candidates', {}, userId);
          const reply = "Here are the candidate applicants:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Candidate Applicants Tool", status: "Success", description: summary },
            structuredData: { type: 'candidates', candidates: result },
            suggestions: ["Interview schedules", "Job openings", "Show employee list"]
          };
        }
      } catch (recErr) {
        console.error("Fallback recruitment tool error:", recErr);
      }
    }

    // 10. PROJECTS & TASKS
    if (q.includes('project') || q.includes('task') || q.includes('sprint') || q.includes('board')) {
      try {
        if (q.includes('task') || q.includes('sprint')) {
          const { result, summary } = await executeTool('get_tasks', {}, userId);
          const reply = "Here are the current tasks in the system:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Sprint Tasks Tool", status: "Success", description: summary },
            structuredData: { type: 'tasks', tasks: result },
            suggestions: ["View projects", "Show employee list"]
          };
        } else {
          const { result, summary } = await executeTool('get_projects', {}, userId);
          const reply = "Here are the active project boards:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Project Boards Tool", status: "Success", description: summary },
            structuredData: { type: 'projects', projects: result },
            suggestions: ["View tasks", "Show employee list"]
          };
        }
      } catch (projErr) {
        console.error("Fallback project tool error:", projErr);
      }
    }

    // 11. SUPPORT TICKETS
    if (q.includes('ticket') || q.includes('support') || q.includes('helpdesk')) {
      try {
        const { result, summary } = await executeTool('get_support_tickets', {}, userId);
        const reply = "Here are the recent support tickets:";
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: { name: "Support Helpdesk Tool", status: "Success", description: summary },
          structuredData: { type: 'support_tickets', tickets: result },
          suggestions: ["Show employee list", "View attendance summary"]
        };
      } catch (tickErr) {
        console.error("Fallback ticket tool error:", tickErr);
      }
    }

    // 12. COMPANY POLICIES (RAG from policies.json)
    if (q.includes('policy') || q.includes('policies') || q.includes('maternity') || q.includes('wfh') || q.includes('work from home') || q.includes('dress code') || q.includes('code of conduct') || q.includes('leave policy')) {
      const policyText = retrievePolicyContext(message);
      if (policyText && policyText.trim()) {
        const reply = `**HR Policies Information:**\n\n${policyText.split('\n\n').slice(0, 3).join('\n\n---\n\n')}`;
        await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
        return {
          text: reply,
          toolUsed: null,
          structuredData: { type: 'theory' },
          suggestions: ["Check leave balances", "Show employee list", "View attendance summary"]
        };
      }
    }

    // 13. PAYROLL
    if (q.includes('payroll') || q.includes('salary') || q.includes('payslip')) {
      try {
        const authorized = await isAuthorizedForPayroll(userId);
        if (authorized) {
          const { result, summary } = await executeTool('get_payroll_summary', {}, userId);
          const reply = "Here is the payroll summary overview:";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: { name: "Payroll Summary Tool", status: "Success", description: summary },
            structuredData: { type: 'payroll_summary', summary: result },
            suggestions: ["Show employee list", "View attendance summary"]
          };
        } else {
          const reply = "Payroll and salary details are confidential and restricted to Super Administrators and HR Managers.";
          await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
          return {
            text: reply,
            toolUsed: null,
            structuredData: null,
            suggestions: ["Show employee list", "View attendance summary", "Check leave balances"]
          };
        }
      } catch (payErr) {
        console.error("Fallback payroll tool error:", payErr);
      }
    }

    // 14. DEFAULT GRACEFUL RESPONSE
    const reply = `I received your message: "${message}".\n\nI am currently operating in direct HRMS mode. You can ask me to view employee records, attendance summaries, leave balances, company policies, departments, and holidays using the buttons below:`;
    const suggestions = ["Show employee list", "View attendance summary", "Check leave balances", "Show departments", "Company holidays"];
    await queryDB("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conversationId, reply]);
    return {
      text: reply,
      toolUsed: null,
      structuredData: null,
      suggestions
    };
  } catch (fallbackError) {
    console.error("Fallback handler error:", fallbackError);
    const reply = "I'm your HRMS Assistant. How can I assist you with employee records, attendance, or leave balances today?";
    return {
      text: reply,
      toolUsed: null,
      structuredData: null,
      suggestions: ["Show employee list", "View attendance summary", "Check leave balances"]
    };
  }
}

// Helper to extract follow-up suggestions from LLM text suffix
function parseSuggestionsFromText(text) {
  const marker = 'SUGGESTIONS:';
  const idx = text.lastIndexOf(marker);
  if (idx === -1) return { cleanText: text.trim(), suggestions: [] };
  try {
    const rawJson = text.slice(idx + marker.length).trim();
    const suggestions = JSON.parse(rawJson);
    const cleanText = text.slice(0, idx).trim();
    return { cleanText, suggestions: Array.isArray(suggestions) ? suggestions : [] };
  } catch {
    return { cleanText: text.trim(), suggestions: [] };
  }
}

// Helper to perform live DuckDuckGo HTML web search
async function performWebSearch(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`DuckDuckGo request failed: ${response.status}`);
    const html = await response.text();

    const results = [];
    const regex = /<a class="result__snippet"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null && results.length < 5) {
      let rawUrl = match[1];
      let title = match[2].replace(/<[^>]*>/g, '').trim();

      let cleanUrl = rawUrl;
      if (rawUrl.includes('uddg=')) {
        const parts = rawUrl.split('uddg=');
        if (parts[1]) {
          const encUrl = parts[1].split('&')[0];
          cleanUrl = decodeURIComponent(encUrl);
        }
      } else if (rawUrl.startsWith('//')) {
        cleanUrl = 'https:' + rawUrl;
      }

      results.push({ title, url: cleanUrl });
    }

    return results;
  } catch (error) {
    console.error("Web search error:", error);
    return [{ title: `Failed to search the web: ${error.message}`, url: 'https://duckduckgo.com' }];
  }
}

function isHRMSQuestion(message) {
  const m = message.toLowerCase();
  const hrmsKeywords = [
    'employee', 'absent', 'attendance', 'leave', 'holiday',
    'payroll', 'payslip', 'salary', 'designation', 'department',
    'candidate', 'recruitment', 'interview', 'timesheet',
    'sprint', 'task', 'project', 'support ticket', 'ticket'
  ];
  return hrmsKeywords.some(k => m.includes(k));
}

function requiresCurrentInformation(message) {
  const m = message.toLowerCase();
  const keywords = [
    'current', 'today', 'latest', 'now', 'present', 'this year',
    'who is the current', 'what is the latest', 'recent',
    'recent news', "today's news", 'current government',
    'current minister', 'current cm', 'current pm', 'current president',
    'current price', 'current weather', 'latest version', 'latest release',
    'yesterday', 'tomorrow'
  ];
  if (isHRMSQuestion(message)) {
    return false;
  }
  return keywords.some(k => m.includes(k)) || m.includes('cm') || m.includes('pm') || m.includes('minister') || m.includes('president') || m.includes('news');
}

function isCalculation(message) {
  const m = message.replace(/calculate/i, '').trim();
  return /^[0-9+\-*/().\s]+$/.test(m) && /[\+\-\*\/]/.test(m);
}

module.exports = { generateResponse };
