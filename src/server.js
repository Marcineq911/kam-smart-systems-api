require('dotenv').config();

const { createApp } = require('./app');
const { createMailer } = require('./mailer');

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = createApp({
  sendQuote: createMailer(process.env),
  allowedOrigins,
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`KAM Smart Systems API listening on port ${port}`);
});
