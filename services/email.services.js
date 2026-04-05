const RESEND_API_URL = "https://api.resend.com/emails";

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function maskEmail(value) {
    const email = String(value || "").trim();
    if (!isValidEmail(email)) {
        return "<invalid-email>";
    }

    const atIndex = email.indexOf("@");
    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);

    const maskedLocal = local.length <= 2
        ? `${local.charAt(0) || "*"}*`
        : `${local.slice(0, 2)}***`;

    return `${maskedLocal}@${domain}`;
}

function getResendConfig() {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.EMAIL_FROM || "").trim();
    const replyTo = String(process.env.EMAIL_REPLY_TO || "").trim();

    if (!apiKey || !from) {
        return null;
    }

    return { apiKey, from, replyTo };
}

async function sendWithResend({ to, subject, text, html }) {
    const config = getResendConfig();
    if (!config) {
        console.warn("Email service: Resend not configured - missing RESEND_API_KEY or EMAIL_FROM");
        return { sent: false, reason: "Resend is not configured" };
    }

    const payload = {
        from: config.from,
        to: [to],
        subject,
        text,
        html
    };

    if (config.replyTo) {
        payload.reply_to = config.replyTo;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return {
                sent: false,
                reason: data?.message || data?.error || `Resend HTTP ${response.status}`
            };
        }

        return { sent: true, id: data?.id || "" };
    } catch (error) {
        if (error?.name === "AbortError") {
            return { sent: false, reason: "Resend request timed out" };
        }
        return { sent: false, reason: error?.message || "Resend request failed" };
    } finally {
        clearTimeout(timeout);
    }
}

export async function sendPasswordChangedEmail({ userEmail, userName, changedAt, actorEmail }) {
    const recipient = String(userEmail || "").trim();
    const maskedRecipient = maskEmail(recipient);
    if (!isValidEmail(recipient)) {
        console.warn(`Email service: Skipping password-change email due to invalid recipient '${maskedRecipient}'`);
        return { sent: false, reason: "Invalid recipient email" };
    }

    const safeName = String(userName || "User").trim() || "User";
    const changedTime = (changedAt instanceof Date ? changedAt : new Date(changedAt || Date.now())).toLocaleString();
    const changedBy = String(actorEmail || "an administrator").trim();

    console.log(`Email service: Attempting to send password change email to ${maskedRecipient}`);

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

    const result = await sendWithResend({
        to: recipient,
        subject: "Is this you? Password changed",
        text,
        html
    });

    if (result.sent) {
        console.log(`Email service: Successfully sent password change email to ${maskedRecipient}`);
        return { sent: true };
    }

    console.error(`Email service error: Failed to send to ${maskedRecipient} - ${result.reason}`);
    return { sent: false, reason: result.reason };
}

export async function sendPasswordResetCodeEmail({ userEmail, userName, code, expiresInMinutes }) {
    const recipient = String(userEmail || "").trim();
    const maskedRecipient = maskEmail(recipient);
    if (!isValidEmail(recipient)) {
        console.warn(`Email service: Skipping reset-code email due to invalid recipient '${maskedRecipient}'`);
        return { sent: false, reason: "Invalid recipient email" };
    }

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

    console.log(`Email service: Attempting to send reset code email to ${maskedRecipient}`);
    const result = await sendWithResend({
        to: recipient,
        subject: "Your password reset code",
        text,
        html
    });

    if (result.sent) {
        console.log(`Email service: Successfully sent reset code email to ${maskedRecipient}`);
        return { sent: true };
    }

    console.error(`Email service error: Failed reset code email to ${maskedRecipient} - ${result.reason}`);
    return { sent: false, reason: result.reason };
}
