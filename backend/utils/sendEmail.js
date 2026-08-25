const nodemailer = require('nodemailer');

/**
 * Sends an email if SMTP is configured via env vars (EMAIL_USER, EMAIL_PASS).
 * If not configured, this silently does nothing and returns false — the
 * calling code (forgotPassword) falls back to returning the reset link
 * directly in the API response instead, so the feature still works fully
 * without any email setup. Configure EMAIL_USER/EMAIL_PASS later to switch
 * to real emails with no other code changes needed.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `SkillSwap <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
};

module.exports = sendEmail;
