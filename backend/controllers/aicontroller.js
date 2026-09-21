const { generateResponse } = require('../services/aiservices');
const db = require('../config/database');

const chatwithAI = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'conversationId is required' });
    }

    const { text, toolUsed, structuredData, suggestions } = await generateResponse(message, conversationId, userId);
    const sources = (structuredData && structuredData.type === 'web_answer') ? (structuredData.results || []) : [];
    
    res.json({ success: true, message: text, toolUsed, structuredData, suggestions: suggestions || [], sources });
  } catch (error) {
    console.error('Error in chatwithAI:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI request failed'
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    db.query(
      "SELECT conversation_id, title, created_at FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, conversations: rows });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    // Check ownership
    db.query(
      "SELECT id FROM ai_conversations WHERE conversation_id = ? AND user_id = ?",
      [id, userId],
      (err, convs) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (convs.length === 0) return res.status(403).json({ success: false, message: "Forbidden" });

        db.query(
          "SELECT role, content, tool_name, tool_call_id, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC",
          [id],
          (err2, messages) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });
            res.json({ success: true, messages });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAvailableModules = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : null;
    db.query("SHOW TABLES", (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      const tables = rows.map(r => Object.values(r)[0]);
      
      const modules = {
        employees: tables.includes('employees'),
        attendance: tables.includes('attendance'),
        leaves: tables.includes('leave_applications') || tables.includes('leave_balances'),
        holidays: tables.includes('holidays'),
        departments: tables.includes('departments'),
        payroll: tables.includes('payslips') || tables.includes('salary_structures'),
        performance: tables.includes('appraisals') || tables.includes('goals') || tables.includes('kpis'),
        recruitment: tables.includes('candidates') || tables.includes('interview_schedules'),
        hr_policies: true
      };

      const permissions = {
        payroll: (userRole === 'SUPER_ADMIN'),
        salary: (userRole === 'SUPER_ADMIN')
      };

      res.json({ success: true, modules, permissions });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    db.query(
      "DELETE FROM ai_conversations WHERE conversation_id = ? AND user_id = ?",
      [id, userId],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        db.query(
          "DELETE FROM ai_messages WHERE conversation_id = ?",
          [id],
          (err2) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });
            res.json({ success: true, message: "Conversation cleared successfully" });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const clearAllConversations = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    db.query(
      "SELECT conversation_id FROM ai_conversations WHERE user_id = ?",
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        const convIds = rows.map(r => r.conversation_id);
        if (convIds.length === 0) return res.json({ success: true, message: "No conversations to clear" });
        
        db.query(
          "DELETE FROM ai_conversations WHERE user_id = ?",
          [userId],
          (err2) => {
            if (err2) return res.status(500).json({ success: false, error: err2.message });
            db.query(
              "DELETE FROM ai_messages WHERE conversation_id IN (?)",
              [convIds],
              (err3) => {
                if (err3) return res.status(500).json({ success: false, error: err3.message });
                res.json({ success: true, message: "All conversations cleared successfully" });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { chatwithAI, getConversations, getConversationMessages, getAvailableModules, deleteConversation, clearAllConversations };