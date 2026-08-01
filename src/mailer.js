const nodemailer = require('nodemailer');

const SERVICE_LABELS = {
  monitoring: 'Monitoring i kamery',
  bramy: 'Automatyka bram',
  'kontrola-dostepu': 'Kontrola dostępu',
  'instalacje-elektryczne': 'Instalacje elektryczne',
  rozdzielnice: 'Rozdzielnice elektryczne',
  wideodomofony: 'Wideodomofony',
  inne: 'Inna usługa',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createMailer(env) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 465),
    secure: String(env.SMTP_SECURE).toLowerCase() !== 'false',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return async function sendQuote(quote) {
    const service = SERVICE_LABELS[quote.service] || quote.service;
    const safe = Object.fromEntries(
      Object.entries({ ...quote, service }).map(([key, value]) => [key, escapeHtml(value)]),
    );

    await transporter.sendMail({
      from: `Formularz KAM Smart Systems <${env.SMTP_USER}>`,
      to: env.MAIL_TO || env.SMTP_USER,
      subject: `Nowe zapytanie: ${service} — ${quote.city}`,
      text: [
        `Imię i nazwisko: ${quote.name}`,
        `Telefon: ${quote.phone}`,
        `Miejscowość: ${quote.city}`,
        `Usługa: ${service}`,
        `Kiedy zadzwonić: ${quote.callbackTime}`,
        '',
        'Opis:',
        quote.description,
      ].join('\n'),
      html: `
        <h2>Nowe zapytanie ze strony</h2>
        <table cellpadding="7" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Imię i nazwisko</strong></td><td>${safe.name}</td></tr>
          <tr><td><strong>Telefon</strong></td><td><a href="tel:${safe.phone}">${safe.phone}</a></td></tr>
          <tr><td><strong>Miejscowość</strong></td><td>${safe.city}</td></tr>
          <tr><td><strong>Usługa</strong></td><td>${safe.service}</td></tr>
          <tr><td><strong>Kiedy zadzwonić</strong></td><td>${safe.callbackTime}</td></tr>
        </table>
        <h3>Opis</h3>
        <p style="white-space:pre-wrap">${safe.description}</p>
      `,
    });
  };
}

module.exports = { createMailer };
