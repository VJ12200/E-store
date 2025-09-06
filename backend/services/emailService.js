import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = null;
        this.etherealAccount = null;
        this.initializationAttempted = false;
        this.initialized = false;
    }

    async initialize() {
        try {
            this.initializationAttempted = true;
            // Create Ethereal test account using nodemailer
            this.etherealAccount = await nodemailer.createTestAccount();
            
            // Create transporter using Ethereal SMTP
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: this.etherealAccount.user, // generated ethereal user
                    pass: this.etherealAccount.pass, // generated ethereal password
                },
            });

            // Verify connection configuration
            await this.transporter.verify();
            this.initialized = true;
            console.log('Email service initialized successfully');
            console.log('Ethereal test account created:');
            console.log(`   Email: ${this.etherealAccount.user}`);
            console.log(`   Password: ${this.etherealAccount.pass}`);
            console.log(`   Web URL: https://ethereal.email/message/${this.etherealAccount.user}`);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize email service:', error);
            this.initialized = false;
            this.transporter = null;
            return false;
        }
    }

    async ensureReady() {
        if (this.transporter) return true;
        // Attempt lazy initialization
        const ok = await this.initialize();
        return !!ok && !!this.transporter;
    }

    async sendPasswordResetEmail(email, resetToken, userName) {
        if (!await this.ensureReady()) {
            console.warn('Email service unavailable; skipping password reset email');
            return { success: true, skipped: true, messageId: null, previewUrl: null };
        }

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset.html?token=${resetToken}`;
        
        const mailOptions = {
            from: `"E-Store Support" <${this.etherealAccount.user}>`,
            to: email,
            subject: 'Password Reset Request - E-Store',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 8px 8px;
                        }
                        .button {
                            display: inline-block;
                            background: #2196F3;
                            color: white;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .button:hover {
                            background: #1976D2;
                        }
                        .footer {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #666;
                        }
                        .warning {
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            color: #856404;
                            padding: 15px;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Password Reset Request</h1>
                        <p>E-Store Account Security</p>
                    </div>
                    
                    <div class="content">
                        <h2>Hello ${userName || 'Valued Customer'},</h2>
                        
                        <p>We received a request to reset your password for your E-Store account. If you made this request, click the button below to reset your password:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset My Password</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                            ${resetUrl}
                        </p>
                        
                        <div class="warning">
                            <strong>Important Security Information:</strong>
                            <ul>
                                <li>This link will expire in 1 hour for security reasons</li>
                                <li>If you didn't request this password reset, please ignore this email</li>
                                <li>Never share this link with anyone</li>
                                <li>Your password will not be changed until you click the link above</li>
                            </ul>
                        </div>
                        
                        <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
                        
                        <p>Best regards,<br>
                        The E-Store Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>If you have any questions, please contact our support team.</p>
                    </div>
                </body>
                </html>
            `,
            text: `
                Password Reset Request - E-Store
                
                Hello ${userName || 'Valued Customer'},
                
                We received a request to reset your password for your E-Store account.
                
                To reset your password, please visit the following link:
                ${resetUrl}
                
                This link will expire in 1 hour for security reasons.
                
                If you didn't request this password reset, please ignore this email.
                
                Best regards,
                The E-Store Team
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent successfully');
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            
            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            throw error;
        }
    }

    async sendWelcomeEmail(email, userName) {
        if (!await this.ensureReady()) {
            console.warn('Email service unavailable; skipping welcome email');
            return { success: true, skipped: true, messageId: null, previewUrl: null };
        }

        const mailOptions = {
            from: `"E-Store Welcome" <${this.etherealAccount.user}>`,
            to: email,
            subject: 'Welcome to E-Store!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to E-Store</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 8px 8px;
                        }
                        .button {
                            display: inline-block;
                            background: #4CAF50;
                            color: white;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .button:hover {
                            background: #45a049;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Welcome to E-Store!</h1>
                        <p>Your account has been created successfully</p>
                    </div>
                    
                    <div class="content">
                        <h2>Hello ${userName},</h2>
                        
                        <p>Welcome to E-Store! We're excited to have you as part of our community.</p>
                        
                        <p>Your account is now ready and you can start shopping right away. Here's what you can do:</p>
                        
                        <ul>
                            <li>Browse our extensive product catalog</li>
                            <li>Add items to your cart and checkout securely</li>
                            <li>Leave reviews for products you've purchased</li>
                            <li>Track your orders and manage your account</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products.html" class="button">Start Shopping</a>
                        </div>
                        
                        <p>If you have any questions or need assistance, don't hesitate to contact our support team.</p>
                        
                        <p>Happy shopping!<br>
                        The E-Store Team</p>
                    </div>
                </body>
                </html>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Welcome email sent successfully');
            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            throw error;
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
