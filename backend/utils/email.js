import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'noreply.chess.mp@gmail.com',
        pass: process.env.GOOGLE_APP_PASS
    },
})

export default transporter