import nodemailer from "nodemailer";
import { APPLICATION_NAME, EMAIL_APP, EMAIL_APP_PASSWORD } from "../../../../config/config.service.js";

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = []
} = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_APP,
      pass: EMAIL_APP_PASSWORD
    },
  });

  const info = await transporter.sendMail({
    to,
    cc,
    bcc,
    subject,
    attachments,
    html,
    from: `"${APPLICATION_NAME}" <${EMAIL_APP}>'`,
  });

  console.log("Message sent:", info.messageId);
};