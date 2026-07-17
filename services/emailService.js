const nodemailer = require('nodemailer');

// Helper to create the transporter instance
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

// --- Email Functions ---

const sendWelcomeEmail = async (userData) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[SIMULATION] Welcome email sent to: ${userData.email}`);
        return;
    }

    const transporter = createTransporter();
    const mailOptions = {
        from: `"Rebirth of a Queen" <${process.env.EMAIL_USER}>`,
        to: userData.email,
        subject: 'Welcome to the Rebirth of a Queen Family!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h1 style="color: #522D59;">Welcome, ${userData.name}!</h1>
                <p>We are absolutely thrilled to welcome you to the <strong>Rebirth of a Queen</strong> family.</p>
                <p>Your journey to transformation and empowerment starts here.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.BASE_URL}" style="background: #522D59; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Your Portal</a>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetUrl) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[SIMULATION] Password reset email sent to: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        return;
    }

    const transporter = createTransporter();
    const mailOptions = {
        from: `"Rebirth of a Queen" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password - Rebirth of a Queen',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                <h2 style="color: #522D59;">Password Reset Request</h2>
                <p>To reset your password, please click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #522D59; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

const sendInquiryEmail = async (inquiry) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('--- Inquiry Received (Simulation Mode) ---');
        console.log(`From: ${inquiry.name} (${inquiry.email})`);
        console.log(`Interest: ${inquiry.interest}`);
        return;
    }

    const transporter = createTransporter();
    await transporter.sendMail({
        from: '"Rebirth of a Queen" <info@therebirthofaqueen.com>',
        to: 'your-admin-email@example.com',
        subject: `New ${inquiry.interest} Inquiry from ${inquiry.name}`,
        text: `You have a new inquiry:\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nInterest: ${inquiry.interest}`
    });
};

module.exports = { 
    sendPasswordResetEmail, 
    sendWelcomeEmail, 
    sendInquiryEmail 
};