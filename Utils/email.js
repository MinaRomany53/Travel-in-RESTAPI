const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter Object
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Create a mailOptions Object
  const mailOptions = {
    from: "Mina Romany <mina@D7k.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Use the transporter.sendMail(mailOptions) method
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
