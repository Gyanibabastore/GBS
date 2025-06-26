const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // Your Gmail ID (set in .env)
    pass: process.env.EMAIL_PASS    // Your App Password (not your Gmail password)
  }
});

// Function to generate 6-digit OTP
exports.generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✉️ Signup OTP Email
exports.sendOtpEmail = async (email, otp, name = '', role = 'user') => {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = `Your ${capitalizedRole} Signup OTP - Gyanibaba Store`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
      <h2 style="color: #4facfe;">Hello ${name || 'User'},</h2>
      <p>You are signing up as a <strong>${capitalizedRole}</strong> on <strong>Gyanibaba Store</strong>.</p>
      <p>Your OTP for signup is:</p>
      <h1 style="color: #28a745; font-size: 28px;">${otp}</h1>
      <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
      <br/>
      <p>Thanks & Regards,<br/><strong>Gyanibaba Store Team</strong></p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
};

// ✉️ Login OTP Email
exports.sendLoginOtpEmail = async (email, otp, name = '', role = 'user') => {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = `Your ${capitalizedRole} Login OTP - Gyanibaba Store`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
      <h2 style="color: #4facfe;">Hello ${name || 'User'},</h2>
      <p>You are trying to log in as a <strong>${capitalizedRole}</strong> on <strong>Gyanibaba Store</strong>.</p>
      <p>Your OTP for login is:</p>
      <h1 style="color: #007bff; font-size: 28px;">${otp}</h1>
      <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
      <br/>
      <p>Thanks & Regards,<br/><strong>Gyanibaba Store Team</strong></p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
};
// ✉️ Forgot Password OTP Email
exports.sendForgotOtpEmail = async (email, otp, name = '', role = 'user') => {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = `Reset Your ${capitalizedRole} Password - Gyanibaba Store`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
      <h2 style="color: #f39c12;">Hello ${name || 'User'},</h2>
      <p>You have requested to reset your <strong>${capitalizedRole}</strong> password on <strong>Gyanibaba Store</strong>.</p>
      <p>Your OTP for password reset is:</p>
      <h1 style="color: #e74c3c; font-size: 28px;">${otp}</h1>
      <p>This OTP is valid for <strong>5 minutes</strong>.</p>
      <br/>
      <p>Thanks & Regards,<br/><strong>Gyanibaba Store Team</strong></p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  };

  return transporter.sendMail(mailOptions);
};
