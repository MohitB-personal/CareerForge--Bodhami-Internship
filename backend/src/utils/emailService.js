const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_APP_PASSWORD,
    },
});

const { getFrontendUrl } = require('./urlHelper');

const buildEmailVerificationUrl = (email, role = 'candidate') => {
    const frontendUrl = getFrontendUrl();
    const searchParams = new URLSearchParams();
    if (email) searchParams.set('email', email);
    if (role) searchParams.set('role', role);
    const query = searchParams.toString();
    return `${frontendUrl}/verify-email${query ? `?${query}` : ''}`;
};

const sendOTPEmail = async (email, otp, role = 'candidate') => {
    const verificationUrl = buildEmailVerificationUrl(email, role);
    const mailOptions = {
        from: `"CareerForge" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "CareerForge - Email Verification OTP",
        text: `Your CareerForge verification OTP is ${otp}. This OTP is valid for 5 minutes. Do not share this OTP with anyone.\n\nYou can also verify directly at: ${verificationUrl}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #333;">CareerForge Email Verification</h2>

        <p>Thank you for registering with CareerForge.</p>

        <p>Your verification OTP is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 15px;
          text-align: center;
          background: #f5f5f5;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>This OTP is valid for <strong>5 minutes</strong>.</p>

        <p style="margin: 20px 0;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </p>

        <p style="font-size: 13px; color: #555;">
          Or copy and paste this verification link into your browser:<br>
          <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
        </p>

        <p>If you did not request this verification, you can safely ignore this email.</p>

        <hr>

        <p style="font-size: 12px; color: #777;">
          This is an automated email from CareerForge. Please do not reply.
        </p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, name, role) => {
    const displayName =
        role === "company"
            ? name
            : name || "there";

    const accountType =
        role === "company"
            ? "company account"
            : "candidate account";

    const mailOptions = {
        from: `"CareerForge" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Welcome to CareerForge!",
        text: `Hi ${displayName},

Thank you for registering with CareerForge!

Your email address has been successfully verified and your ${accountType} is now ready to use.

We're excited to have you with us.

Best regards,
The CareerForge Team`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h2 style="color: #333;">Welcome to CareerForge! 🎉</h2>

        <p>Hi <strong>${displayName}</strong>,</p>

        <p>
          Thank you for registering with CareerForge!
        </p>

        <p>
          Your email address has been successfully verified and your
          <strong>${accountType}</strong> is now ready to use.
        </p>

        <p>
          We're excited to have you with us.
        </p>

        <br>

        <p>
          Best regards,<br>
          <strong>The CareerForge Team</strong>
        </p>

        <hr>

        <p style="font-size: 12px; color: #777;">
          This is an automated email from CareerForge. Please do not reply.
        </p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendDocumentVerificationEmail = async (to, {
    companyName,
    docName,
    docType,
    uploadDate,
    viewUrl,
    verifyUrl,
    rejectUrl,
}) => {
    const safeCompanyName = escapeHtml(companyName);
    const safeDocName = escapeHtml(docName);
    const safeDocType = escapeHtml(docType);
    const formattedUploadDate = new Date(uploadDate).toLocaleString();

    await transporter.sendMail({
        from: `"CareerForge" <${process.env.MAIL_USER}>`,
        to,
        subject: `Document verification required: ${docName}`,
        text: `A company verification document needs review.\n\nCompany: ${companyName}\nDocument: ${docName}\nType: ${docType}\nUploaded: ${formattedUploadDate}\n\nView document: ${viewUrl}\nVerify: ${verifyUrl}\nReject: ${rejectUrl}\n\nThe verification links expire in 24 hours and can only be used once.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
            <h2>Document verification required</h2>
            <p>A company has uploaded a document for review.</p>
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
              <tr><td style="padding: 8px; font-weight: bold;">Company</td><td style="padding: 8px;">${safeCompanyName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Document</td><td style="padding: 8px;">${safeDocName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Type</td><td style="padding: 8px;">${safeDocType}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Uploaded</td><td style="padding: 8px;">${escapeHtml(formattedUploadDate)}</td></tr>
            </table>
            <p><a href="${viewUrl}" style="color: #2563eb;">View document</a></p>
            <p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 10px 16px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 4px;">Verify document</a>
              <a href="${rejectUrl}" style="display: inline-block; padding: 10px 16px; margin-left: 8px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 4px;">Reject document</a>
            </p>
            <p style="font-size: 12px; color: #777;">These verification links expire in 24 hours and can only be used once.</p>
          </div>
        `,
    });
};

const sendPasswordResetOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"CareerForge" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "CareerForge - Password Reset OTP",
        text: `Your CareerForge password reset verification code is ${otp}. This code is valid for 5 minutes. Do not share this code with anyone. If you did not request a password reset, please ignore this email.`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h2 style="color: #1e3a8a;">Password Reset Request</h2>
        <p>We received a request to reset your password for your CareerForge account.</p>
        <p>Your password reset verification code is:</p>
        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 15px;
          text-align: center;
          background: #f1f5f9;
          border-radius: 8px;
          margin: 20px 0;
          color: #0f172a;
        ">
          ${otp}
        </div>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 0.9rem;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">
          This is an automated security email from CareerForge. Please do not reply.
        </p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendDocumentVerificationEmail,
    sendPasswordResetOTPEmail,
    buildEmailVerificationUrl,
    getFrontendUrl,
};
