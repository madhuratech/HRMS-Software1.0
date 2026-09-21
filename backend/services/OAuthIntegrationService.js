const db = require('../config/database');

class OAuthIntegrationService {

  /**
   * Saves or updates LinkedIn OAuth token in database
   */
  static async saveLinkedInToken({ accessToken, refreshToken, expiresIn, scope, memberUrn, orgUrn, accountName }) {
    return new Promise((resolve, reject) => {
      const expiresInSec = parseInt(expiresIn, 10) || 5184000; // default 60 days
      const expiresAt = new Date(Date.now() + expiresInSec * 1000);

      const sql = `
        INSERT INTO oauth_integrations (
          provider, access_token, refresh_token, token_type, scope, expires_at,
          member_urn, organization_urn, account_name, status, connected_at
        ) VALUES (
          'LINKEDIN', ?, ?, 'Bearer', ?, ?,
          ?, ?, ?, 'CONNECTED', NOW()
        )
        ON DUPLICATE KEY UPDATE
          access_token = VALUES(access_token),
          refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
          scope = COALESCE(VALUES(scope), scope),
          expires_at = VALUES(expires_at),
          member_urn = COALESCE(VALUES(member_urn), member_urn),
          organization_urn = COALESCE(VALUES(organization_urn), organization_urn),
          account_name = COALESCE(VALUES(account_name), account_name),
          status = 'CONNECTED',
          connected_at = NOW(),
          updated_at = NOW()
      `;

      const params = [
        accessToken,
        refreshToken || null,
        scope || null,
        expiresAt,
        memberUrn || null,
        orgUrn || null,
        accountName || null
      ];

      db.query(sql, params, (err, result) => {
        if (err) {
          console.error('[OAuthIntegrationService.saveLinkedInToken] DB Error:', err);
          return reject(err);
        }
        resolve({ success: true, expiresAt });
      });
    });
  }

  /**
   * Retrieves LinkedIn OAuth token and status from database
   */
  static async getLinkedInIntegration() {
    return new Promise((resolve) => {
      const sql = "SELECT * FROM oauth_integrations WHERE provider = 'LINKEDIN' LIMIT 1";
      db.query(sql, (err, rows) => {
        if (err || !rows || rows.length === 0) {
          // Fallback to process.env if database record doesn't exist yet
          const envToken = process.env.LINKEDIN_ACCESS_TOKEN;
          const envOrgId = process.env.LINKEDIN_ORGANIZATION_ID || '109901015';
          const envExpiresAt = process.env.LINKEDIN_TOKEN_EXPIRES_AT;
          const isExpired = envExpiresAt ? new Date(envExpiresAt) < new Date() : false;

          return resolve({
            hasToken: !!(envToken && envToken.length > 20 && !isExpired),
            isExpired,
            accessToken: envToken || null,
            expiresAt: envExpiresAt ? new Date(envExpiresAt) : null,
            memberUrn: null,
            organizationUrn: envOrgId ? `urn:li:organization:${envOrgId}` : null,
            accountName: null,
            scope: null,
            status: (envToken && !isExpired) ? 'CONNECTED' : 'NOT_CONNECTED',
            connectedAt: null
          });
        }

        const row = rows[0];
        const hasRawToken = !!(row.access_token && row.access_token.length > 20);
        const isExpired = hasRawToken && row.expires_at ? new Date(row.expires_at) < new Date() : false;
        const hasToken = hasRawToken && !isExpired;
        const status = hasToken ? 'CONNECTED' : (hasRawToken && isExpired ? 'EXPIRED' : 'NOT_CONNECTED');

        resolve({
          hasToken,
          isExpired,
          accessToken: row.access_token,
          expiresAt: row.expires_at,
          memberUrn: row.member_urn,
          organizationUrn: row.organization_urn || (process.env.LINKEDIN_ORGANIZATION_ID ? `urn:li:organization:${process.env.LINKEDIN_ORGANIZATION_ID}` : null),
          accountName: row.account_name,
          scope: row.scope,
          status,
          connectedAt: row.connected_at
        });
      });
    });
  }

  /**
   * Disconnects LinkedIn by clearing stored token
   */
  static async disconnectLinkedIn() {
    return new Promise((resolve) => {
      const sql = "UPDATE oauth_integrations SET status = 'NOT_CONNECTED', access_token = NULL WHERE provider = 'LINKEDIN'";
      db.query(sql, (err) => {
        if (err) console.error('[OAuthIntegrationService.disconnectLinkedIn] Error:', err);
        process.env.LINKEDIN_ACCESS_TOKEN = '';
        resolve({ success: true });
      });
    });
  }

}

module.exports = OAuthIntegrationService;
