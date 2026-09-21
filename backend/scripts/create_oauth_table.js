const db = require('../config/database');

const sql = `
CREATE TABLE IF NOT EXISTS oauth_integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  scope TEXT,
  expires_at DATETIME,
  member_urn VARCHAR(255),
  organization_urn VARCHAR(255),
  account_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'NOT_CONNECTED',
  connected_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

db.query(sql, (err) => {
  if (err) {
    console.error('Error creating oauth_integrations table:', err);
  } else {
    console.log('✅ oauth_integrations table created or verified successfully');
  }
  process.exit(0);
});
