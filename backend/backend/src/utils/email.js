import nodemailer from "nodemailer";

export const sendResetEmail = async (to, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Bubbistix Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Bubbistix password",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 15 minutes.</p>
    `
  });
};