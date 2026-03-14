import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'abhimanyu.17.patel@gmail.com',
        pass: 'pwwa gttg mptl unxx'
    }
});

const sendEmail = async (subject, text, html) => {
    try {
        const mailOptions = {
            from: 'abhimanyu.17.patel@gmail.com',
            to: 'abhimanyu.17.patel@gmail.com',
            subject: subject,
            text: text,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export default { sendEmail };
