const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
require('dotenv').config();

// Configure providers only when credentials exist so offline/test imports do
// not trigger SDK configuration errors.
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure Twilio Client (guarded)
let twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function enrollmentConfirmationEmail({ name, courseName }) {
  const learnerName = String(name || 'Learner');
  const title = String(courseName || 'your course');
  return {
    subject: `Enrollment confirmed: ${title}`,
    text: `Hello ${learnerName}, your enrollment in ${title} is confirmed.`,
    html: `<p>Hello ${escapeHtml(learnerName)},</p><p>Your enrollment in <strong>${escapeHtml(title)}</strong> is confirmed.</p>`,
  };
}

function certificateEmail({ name, courseName, certificateId, certificateUrl }) {
  const learnerName = String(name || 'Learner');
  const title = String(courseName || 'your course');
  const identifier = String(certificateId || '');
  const verificationUrl = String(certificateUrl || '');
  return {
    subject: `Certificate awarded: ${title}`,
    text: `Hello ${learnerName}, your certificate for ${title} is ready. Certificate ID: ${identifier}. Verify it at ${verificationUrl}`,
    html: `<p>Hello ${learnerName},</p><p>Your certificate for <strong>${escapeHtml(title)}</strong> is ready.</p><p>Certificate ID: <strong>${escapeHtml(identifier)}</strong></p><p><a href="${escapeHtml(verificationUrl)}">Verify certificate</a></p>`,
  };
}

// Function to send a test email via SendGrid
async function sendTestEmail(toEmail) {
  const msg = {
    to: toEmail,
    from: process.env.FROM_EMAIL,
    subject: 'Live Demo Test Email',
    text: "Janadeep's SendGrid email test notification.",
  };
  return sgMail.send(msg);
}

// Function to send a test SMS via Twilio
async function sendTestSMS(toPhone) {
  if (!twilioClient) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      throw new Error('Twilio is not configured.');
    }
  }
  return twilioClient.messages.create({
    body: "Janadeep's Twilio SMS notification.",
    from: process.env.TWILIO_PHONE_NUM,
    to: toPhone
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error('Recipient email is required');
  if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) {
    return { ok: true, dev: true };
  }
  return sgMail.send({ to, from: process.env.FROM_EMAIL, subject, text, ...(html ? { html } : {}) });
}

const sendEnrollmentConfirmationEmail = ({ to, ...details }) =>
  sendEmail({ to, ...enrollmentConfirmationEmail(details) });
const sendCertificateEmail = ({ to, ...details }) =>
  sendEmail({ to, ...certificateEmail(details) });

module.exports = {
  sendTestEmail,
  sendTestSMS,
  sendEmail,
  enrollmentConfirmationEmail,
  certificateEmail,
  sendEnrollmentConfirmationEmail,
  sendCertificateEmail,
};
