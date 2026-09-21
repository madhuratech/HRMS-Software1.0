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

let resendClient = null;
function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      resendClient = new Resend(process.env.RESEND_API_KEY);
    } catch (e) {
      console.warn('Resend package not available, falling back to SMTP:', e.message);
    }
  }
  return resendClient;
}

exports.sendOtpEmail = async ({ toEmail, recipientName, otpCode }) => {
  if (!toEmail) {
    throw new Error('Destination email is required for OTP dispatch.');
  }

  const targetEmail = toEmail.trim();
  const nameDisplay = recipientName || 'User';
  const resend = getResendClient();

  const emailSubject = 'Madhura HRMS - 6-Digit Email Verification Code';
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 28px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Madhura HRMS</h1>
        <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 13px; font-weight: 500;">Secure Identity Verification</p>
      </div>
      <div style="padding: 32px 24px; color: #334155;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Email Verification Code</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hello <strong>${nameDisplay}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Please use the following 6-digit verification code to complete your registration on Madhura HRMS:</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 28px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; font-family: monospace;">${otpCode}</span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code is valid for <strong>10 minutes</strong>. Never share your verification code with anyone.</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not request this verification, you can safely ignore this email.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; 2026 Madhura Technologies. All rights reserved. • hrm.madhuratech.com
      </div>
    </div>
  `;

  // 1. Try sending via Resend API (Domain: hrm.madhuratech.com)
  if (resend) {
    try {
      const fromAddress = (process.env.RESEND_FROM || 'Madhura HRMS <noreply@hrm.madhuratech.com>').trim();
      console.log(`[RESEND DISPATCH] Sending OTP email to ${targetEmail} via Resend (${fromAddress})...`);
      
      const resendRes = await resend.emails.send({
        from: fromAddress,
        to: [targetEmail],
        subject: emailSubject,
        html: emailHtml
      });

      if (resendRes.error) {
        console.error('[RESEND API ERROR]:', resendRes.error);
        throw new Error(resendRes.error.message || 'Resend API dispatch failed');
      }

      console.log(`[RESEND DISPATCH SUCCESS] OTP successfully delivered to ${targetEmail} | ID: ${resendRes.data?.id}`);
      return resendRes.data;
    } catch (resendError) {
      console.error('[RESEND DISPATCH FAILED - ATTEMPTING SMTP FALLBACK]:', resendError.message);
      // Fall through to SMTP if Resend fails
    }
  }

  // 2. Fallback to Nodemailer SMTP
  try {
    const transporter = await getTransporter();
    const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const fromEmail = smtpUser || 'noreply@madhuratech.com';
    const fromName = process.env.SMTP_FROM || `"Madhura HRMS" <${fromEmail}>`;

    const mailOptions = {
      from: fromName,
      to: targetEmail,
      subject: emailSubject,
      text: `Hello ${nameDisplay},\n\nYour 6-digit HRMS verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nRegards,\nMadhura HRMS`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP DISPATCH SUCCESS] Verification OTP sent to ${targetEmail} | Message ID: ${info.messageId}`);
    return info;
  } catch (smtpError) {
    console.error('[SMTP DISPATCH ERROR]:', smtpError);
    throw new Error('Failed to send verification email. Please try again.');
  }
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
