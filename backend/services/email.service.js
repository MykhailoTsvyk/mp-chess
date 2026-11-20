import transporter from "../utils/email.js";

const SENDER_NAME = "Chess App"
const SENDER_EMAIL = process.env.EMAIL_FROM || "noreply.chess.mp@gmail.com"

// Render's free plan blocks SMTP, so production sends through Brevo's HTTP API;
// without BREVO_API_KEY (local development) Gmail SMTP through nodemailer is used
const useBrevo = Boolean(process.env.BREVO_API_KEY)

async function sendWithBrevo({to, subject, html}) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
            "accept": "application/json"
        },
        body: JSON.stringify({
            sender: {name: SENDER_NAME, email: SENDER_EMAIL},
            to: [{email: to}],
            subject,
            htmlContent: html
        })
    })

    if (!response.ok) {
        throw new Error(`Brevo responded ${response.status}: ${await response.text()}`)
    }
}

async function sendEmail({to, subject, html}) {
    if (useBrevo) {
        return sendWithBrevo({to, subject, html})
    }

    return transporter.sendMail({from: `${SENDER_NAME} <${SENDER_EMAIL}>`, to, subject, html})
}

class EmailService {
    async verify() {
        if (useBrevo) {
            console.log("Email: sending through Brevo.")
            return
        }

        transporter.verify((error) => {
            if (error) {
                console.error(error);
            } else {
                console.log("Email server is ready.");
            }
        });
    }

    async sendActivationEmail(user, verificationLink) {
        if (process.env.NODE_ENV !== "production") console.log(verificationLink)

        try {
            await sendEmail({
                to: user.email,
                subject: "Welcome to Chess App!",
                html: `
                <h2>Welcome to Chess App! ♟️</h2>

                <p>Hi ${user.username},</p>

                <p>Thank you for joining Chess App! Your account has been created successfully, and you're one step away from playing.</p>

                <p>Please verify your email address to activate your account.</p>

                <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#2d6cdf;color:#fff;text-decoration:none;border-radius:6px;">
                        Verify Email
                </a>

                <p>If you didn't create this account, you can safely ignore this email.</p>

                <p>See you on the board!</p>

                <p><strong>The Chess App Team</strong></p>
            `,
            });
        } catch (e) {
            console.error(e)
        }

    }
}

export default new EmailService();
