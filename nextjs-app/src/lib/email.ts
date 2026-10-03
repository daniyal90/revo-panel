import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST;
const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || 'no-reply@revo.panel';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!host || !port || !user || !pass) {
    console.warn('Email not fully configured. EMAIL_HOST/PORT/USER/PASS required.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(opts: { to: string; subject: string; text?: string; html?: string }) {
  const t = getTransporter();
  if (!t) {
    console.log('Skipping sendEmail - transporter not configured', opts);
    return null;
  }
  const info = await t.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return info;
}
