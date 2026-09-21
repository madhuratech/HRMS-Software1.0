const nodemailer = require('nodemailer');

async function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true'; // false for 587 STARTTLS
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

  if (!user || !pass) {
    throw new Error('SMTP credentials missing: Please ensure SMTP_USER and SMTP_PASS are configured in backend/.env');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  // Verify transporter connectivity and credentials before sending
  await transporter.verify();

  return transporter;
}

exports.sendOtpEmail = async ({ toEmail, recipientName, otpCode }) => {
  const transporter = await getTransporter();
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const fromEmail = smtpUser || 'noreply@madhuratech.com';
  const fromName = process.env.SMTP_FROM || `"HRMS Portal" <${fromEmail}>`;
  const nameDisplay = recipientName || 'Administrator';

  // Read OTP recipient explicitly from process.env.SMTP_USER
  // The entered registration email must NEVER be used as the OTP recipient
  const targetRecipient = smtpUser;

  if (!targetRecipient) {
    throw new Error('SMTP_USER environment variable is not defined. Cannot dispatch verification OTP.');
  }

  const mailOptions = {
    from: fromName,
    to: targetRecipient, // Explicitly set to process.env.SMTP_USER
    subject: 'HRMS Admin/Manager Registration - 6-Digit OTP Verification Code',
    text: `Hello ${nameDisplay},\n\nYour 6-digit HRMS verification code is:\n\n${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this verification, please ignore this email.\n\nRegards,\nHRMS Portal`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #2563eb; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">HAWKEYE NEST HRMS</h1>
        </div>
        <div style="padding: 30px 20px; color: #334155;">
          <h2 style="color: #1e293b; margin-top: 0;">Admin/Manager Registration OTP</h2>
          <p style="font-size: 15px; line-height: 1.5;">Hello <strong>${nameDisplay}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5;">A request has been initiated to register a new administrative account. Please use the following 6-digit verification code:</p>
          
          <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otpCode}</span>
          </div>

          <p style="font-size: 13px; color: #64748b;">This verification code is valid for <strong>5 minutes</strong>. Do not share this code with unauthorized personnel.</p>
          <p style="font-size: 13px; color: #64748b;">If you did not request this code, please ignore this email.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
          &copy; 2026 HRMS Portal. All rights reserved.
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EMAIL DISPATCH SUCCESS] Verification OTP successfully sent to SMTP_USER (${targetRecipient}) | Message ID: ${info.messageId}`);
  return info;
};

exports.sendOfferLetterEmail = async ({ toEmail, candidateName, jobPosition, pdfBuffer, contentText }) => {
  try {
    const transporter = await getTransporter();
    const fromName = process.env.SMTP_FROM || '"Madhura Technologies HR" <hr@madhuratech.com>';
    const nameDisplay = candidateName || 'Candidate';

    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `Offer_Letter_${nameDisplay.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    const mailOptions = {
      from: fromName,
      to: toEmail,
      subject: `Offer of Employment - ${jobPosition || 'Position'} at Madhura Technologies`,
      text: contentText || `Dear ${nameDisplay},\n\nWe are pleased to offer you the position of ${jobPosition} at Madhura Technologies. Please find your official offer letter attached.\n\nBest regards,\nHR Department\nMadhura Technologies`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #2563eb; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Madhura Technologies</h1>
            <p style="color: #e0e7ff; margin: 6px 0 0; font-size: 13px;">Official Employment Offer</p>
          </div>
          <div style="padding: 28px 20px; color: #334155; line-height: 1.6;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Offer of Employment: ${jobPosition || ''}</h2>
            <p>Dear <strong>${nameDisplay}</strong>,</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-family: monospace; white-space: pre-wrap; font-size: 13px; color: #1e293b;">
${contentText || 'Please review your attached offer letter for details.'}
            </div>
            <p>Please review the details in the attached official offer document and confirm your acceptance.</p>
            <p style="margin-top: 24px;">Sincerely,<br/><strong>Human Resources</strong><br/>Madhura Technologies</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
            &copy; 2026 Madhura Technologies. All rights reserved.
          </div>
        </div>
      `,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[OFFER EMAIL SENT] Sent to ${toEmail} | Message ID: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[OFFER EMAIL PREVIEW URL] ${previewUrl}`);
      }
    }
    return info;
  } catch (err) {
    console.error("[OFFER EMAIL SERVICE ERROR]:", err);
    throw err;
  }
};
