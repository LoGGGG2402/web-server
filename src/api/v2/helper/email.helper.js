const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text, html) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: text,
        html: html,
    };

    transporter.sendMail(mailOptions, (err, data) => {
        if (err && process.env.NODE_ENV === "development") {
            console.log(err);
        }
    });
}

module.exports = sendEmail;