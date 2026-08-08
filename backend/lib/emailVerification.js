import crypto from "node:crypto";
import nodemailer from "nodemailer";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const SMTP_REQUIRED = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];
let transporter;

export const shouldBypassEmailVerification = () =>
  process.env.NODE_ENV !== "production" &&
  (!SMTP_REQUIRED.every((key) => process.env[key]?.trim()) ||
    !process.env.CLIENT_APP_URL?.trim());

const getTransporter = () => {
  if (transporter) return transporter;

  const missing = SMTP_REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Email service is not configured: missing ${missing.join(", ")}`);
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

export const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  };
};

export const hashVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const sendVerificationEmail = async ({ email, fullName, token }) => {
  const clientUrl = process.env.CLIENT_APP_URL;
  if (!clientUrl) {
    throw new Error("CLIENT_APP_URL is not configured");
  }

  const verificationUrl = new URL("/verify-email", clientUrl);
  verificationUrl.searchParams.set("token", token);
  verificationUrl.searchParams.set("email", email);
  const safeName = String(fullName).replace(/[<>]/g, "");

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Verify your ElectraStore email",
    text: `Hi ${safeName}, verify your ElectraStore account here: ${verificationUrl.toString()}. This link expires in 30 minutes.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Verify your ElectraStore account by clicking the button below.</p>
      <p><a href="${verificationUrl.toString()}">Verify email address</a></p>
      <p>This link expires in 30 minutes.</p>
    `,
  });
};
