const crypto = require('crypto');
const sendEmail = require('./sendEmail');

// Generate secure 6-digit OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email, otp, purpose = 'Account Verification') => {
  const subject = `Your SkillSwap Verification Code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 8px;">
      <h2 style="color: #0b1020; margin-bottom: 8px;">SkillSwap ${purpose}</h2>
      <p style="color: #475569; font-size: 15px;">Use the 6-digit verification code below to complete your ${purpose.toLowerCase()}.</p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #e5862c; background: #f8fafc; padding: 12px 24px; border: 2px dashed #e5862c; border-radius: 8px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
    </div>
  `;

  const sent = await sendEmail({ to: email, subject, html });
  return sent;
};

module.exports = { generateOTP, sendOtpEmail };
