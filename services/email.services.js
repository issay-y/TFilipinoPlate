import nodemailer from "nodemailer";

function buildTransport() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number.parseInt(process.env.SMTP_PORT || "587", 10);

    if (!smtpUser || !smtpPass) {
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
}

export async function sendPasswordChangedEmail({ userEmail, userName, changedAt, actorEmail }) {
    const transporter = buildTransport();
    if (!transporter) {
        console.warn("Email service: SMTP not configured - no SMTP_USER or SMTP_PASS in .env");
        return { sent: false, reason: "SMTP is not configured" };
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    const displayName = process.env.SMTP_FROM_NAME || "The Filipino Plate";

    const safeName = String(userName || "User").trim() || "User";
    const changedTime = (changedAt instanceof Date ? changedAt : new Date(changedAt || Date.now())).toLocaleString();
    const changedBy = String(actorEmail || "an administrator").trim();

    console.log(`Email service: Attempting to send password change email to ${userEmail}`);

    const text = [
        `Dear ${safeName},`,
        "",
        `This is a security notice that your password was changed on ${changedTime}.`,
        `Changed by: ${changedBy}.`,
        "",
        "If this wasn't you, please contact the admin immediately.",
        ""
    ].join("\n");

    const html = `
        <p>Dear ${safeName},</p>
        <p>This is a security notice that your password was changed on <strong>${changedTime}</strong>.</p>
        <p>Changed by: <strong>${changedBy}</strong>.</p>
        <p>If this wasn't you, please contact the admin immediately.</p>
    `;

    try {
        await transporter.sendMail({
            from: `"${displayName}" <${fromAddress}>`,
            to: userEmail,
            subject: "Is this you? Password changed",
            text,
            html
        });
        console.log(`Email service: Successfully sent password change email to ${userEmail}`);
        return { sent: true };
    } catch (error) {
        console.error(`Email service error: Failed to send to ${userEmail} - ${error.message}`);
        return { sent: false, reason: error.message };
    }
}

export async function sendPasswordResetCodeEmail({ userEmail, userName, code, expiresInMinutes }) {
    const transporter = buildTransport();
    if (!transporter) {
        console.warn("Email service: SMTP not configured - no SMTP_USER or SMTP_PASS in .env");
        return { sent: false, reason: "SMTP is not configured" };
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    const displayName = process.env.SMTP_FROM_NAME || "The Filipino Plate";

    const safeName = String(userName || "User").trim() || "User";
    const safeCode = String(code || "").trim();
    const ttl = Number.parseInt(expiresInMinutes || "10", 10) || 10;

    if (!safeCode) {
        return { sent: false, reason: "Reset code is missing" };
    }

    const text = [
        `Dear ${safeName},`,
        "",
        "We received a request to reset your password.",
        `Your verification code is: ${safeCode}`,
        `This code expires in ${ttl} minutes.`,
        "",
        "If you did not request this reset, you can ignore this email.",
        ""
    ].join("\n");

    const html = `
        <p>Dear ${safeName},</p>
        <p>We received a request to reset your password.</p>
        <p>Your verification code is:</p>
        <p style="font-size: 20px; font-weight: 700; letter-spacing: 2px;">${safeCode}</p>
        <p>This code expires in <strong>${ttl} minutes</strong>.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
    `;

    try {
        await transporter.sendMail({
            from: `"${displayName}" <${fromAddress}>`,
            to: userEmail,
            subject: "Your password reset code",
            text,
            html
        });
        return { sent: true };
    } catch (error) {
        console.error(`Email service error: Failed reset code email to ${userEmail} - ${error.message}`);
        return { sent: false, reason: error.message };
    }
}
