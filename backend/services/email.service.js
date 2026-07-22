import transporter from "../utils/email.js";

class EmailService {
    async verify() {
        transporter.verify((error) => {
            if (error) {
                console.error(error);
            } else {
                console.log("Email server is ready.");
            }
        });
    }

    async sendActivationEmail(user, verificationLink) {
        console.log(verificationLink)
        try {
            await transporter.sendMail({
                from: "Chess App <noreply.chess.mp@gmail.com>",
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
            console.log(e)
        }

    }
}

export default new EmailService();