const nodemailer = require("nodemailer");
const path = require('path');

let AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.SES_KEY,
    secretAccessKey: process.env.SES_KEY_SECRET,
    region: process.env.SES_REGION,
});

// Nodemailer SES transporter
const mailTransport = {
    SES: new AWS.SES({
        apiVersion: '2010-12-01'
    })
};

let mailMessage = {
    from: process.env.MAIL_FROM_ADDRESS, // verified in Amazon AWS SES
    to: process.env.EMAIL_FOR_NOTIFICATIONS,
    subject: 'Info del procesador',
    text: 'hello',
    // html: '<p><b>hello</b></p>' +
    //       'test'
};

let transporter = nodemailer.createTransport(mailTransport);

let notificationsActivated = process.env.NOTIFICATIONS || "false";

const sendNotification = (message, attachments = false) => {
    if (notificationsActivated != "false") {
        mailMessage.text = 'Info del procesador:' + message;

        if (attachments) {
            mailMessage.html = `
            <h1>Info del procesador:</h1>
            <p>${message}</p>
            <br>
            <br>
            <img src="cid:${attachments}"/>
            `;
            mailMessage.attachments = [
                {
                    path: path.resolve(__dirname, attachments),
                    cid: attachments
                } 
            ]
        }

        transporter.sendMail(mailMessage, function (error) {
            if (error) {
                console.log("Hubo un error al intentar enviar el mensaje.", error);
            } else {
                console.log("Correo enviado con éxito!");
            }
        });
    } else {
        console.log(message, err);
    }
}

module.exports = sendNotification;