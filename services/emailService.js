const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 465,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendWelcomeEmail = async (userData) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Rebirth of a Queen" <${process.env.EMAIL_USER}>`,
    to: userData.email,
    subject: 'Welcome to the Rebirth of a Queen Family!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #522D59;">Welcome, ${userData.name}!</h1>
        <p>We are absolutely thrilled to welcome you to the <strong>Rebirth of a Queen</strong> family.</p>
        <p>Your journey to transformation and empowerment starts here. We are honored to have you with us.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL}" style="background: #522D59; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Your Portal</a>
        </div>
        <p>Stay tuned for updates, inspiration, and resources designed just for you.</p>
        <p>With love and empowerment,<br>The Rebirth of a Queen Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Rebirth of a Queen" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Rebirth of a Queen',
    text: `You requested a password reset. Click this link to set a new password: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #522D59;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #522D59; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Rebirth of a Queen Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };