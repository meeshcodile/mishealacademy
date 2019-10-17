const nodemailer = require('nodemailer');
const config = require('../config/mailer');

//Creating or building the transport object
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Making this whole file available
module.exports = {
    sendEmail(from, to, subject, html) {
        return new Promise((resolve, reject) => {
            transport.sendMail({ from, to, subject, html }, (err, info) => {
                if (err) reject(err);
                resolve(info);
            });
        });
    }
}
