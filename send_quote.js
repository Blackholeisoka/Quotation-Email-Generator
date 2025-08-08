import nodemailer from 'nodemailer';

export async function sendMail(email, path, text, subject) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your_adress@gmail.com',
      pass: process.env.PASS_EMAIL,
    },
  });

  const mailOptions = {
    from: 'your_adress@gmail.com',
    to: email,
    subject: subject,
    text: text,
    attachments: [
      {
        path: path,
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}