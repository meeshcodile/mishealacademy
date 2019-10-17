const nodemailer = require("nodemailer");
const config = require("../config/mailer");
const mailGun = require("nodemailer-mailgun-transport");

// sandboxfb870c3809ad4e0ebf757491b441f1c6.mailgun.org
//24451161d7b274436e1e4277da988629-afab6073-bef37598

const auth = {
    auth: {
        api_key: '24451161d7b274436e1e4277da988629-afab6073-bef37598',
        domain: 'sandboxfb870c3809ad4e0ebf757491b441f1c6.mailgun.org'
    }
}


const transporter = nodemailer.createTransport(mailGun(auth));


const sendMail = (email, subject, text, cb) => {
    const mailOptions = {
        from: email,
        to: "ezekielmisheal4@gmail.com",
        subject,
        text
    };

    transporter.sendMail(mailOptions, err => {
        if (err) {
            cb(err, null);
        } else {
            cb(null);
        }
    });
};

module.exports = sendMail;
