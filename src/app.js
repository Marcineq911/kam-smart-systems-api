const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const SERVICES = new Set([
  'monitoring',
  'bramy',
  'kontrola-dostepu',
  'instalacje-elektryczne',
  'rozdzielnice',
  'wideodomofony',
  'inne',
]);

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validateQuote(body) {
  const quote = {
    name: clean(body.name, 100),
    phone: clean(body.phone, 30),
    city: clean(body.city, 120),
    service: clean(body.service, 40),
    description: clean(body.description, 2000),
    callbackTime: clean(body.callbackTime, 120),
    consent: body.consent === true,
    website: clean(body.website, 200),
  };

  const errors = [];
  if (quote.name.length < 2) errors.push('Podaj imię i nazwisko.');
  if (!/^[+\d\s()-]{7,30}$/.test(quote.phone)) errors.push('Podaj prawidłowy numer telefonu.');
  if (quote.city.length < 2) errors.push('Wybierz lub wpisz miejscowość.');
  if (!SERVICES.has(quote.service)) errors.push('Wybierz rodzaj usługi.');
  if (quote.description.length < 10) errors.push('Opisz krótko zakres prac.');
  if (!quote.callbackTime) errors.push('Podaj dogodny termin kontaktu.');
  if (!quote.consent) errors.push('Zgoda na kontakt jest wymagana.');

  return { quote, errors };
}

function createApp({ sendQuote, allowedOrigins = [] }) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '20kb' }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed'));
    },
    methods: ['GET', 'POST'],
  }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'kam-smart-systems-api' });
  });

  const quoteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { ok: false, message: 'Za dużo prób. Spróbuj ponownie za kilkanaście minut.' },
  });

  app.post('/api/quote', quoteLimiter, async (req, res) => {
    const { quote, errors } = validateQuote(req.body || {});

    // Pole-pułapka pozostaje niewidoczne dla prawdziwych klientów.
    if (quote.website) return res.status(202).json({ ok: true });
    if (errors.length) return res.status(400).json({ ok: false, errors });

    try {
      await sendQuote(quote);
      return res.status(202).json({
        ok: true,
        message: 'Dziękujemy. Zapytanie zostało wysłane.',
      });
    } catch (error) {
      console.error('Quote delivery failed:', error.message);
      return res.status(502).json({
        ok: false,
        message: 'Nie udało się wysłać zapytania. Zadzwoń pod numer podany na stronie.',
      });
    }
  });

  app.use((error, _req, res, _next) => {
    if (error.message === 'Origin not allowed') {
      return res.status(403).json({ ok: false, message: 'Niedozwolona domena.' });
    }
    console.error('Unhandled error:', error.message);
    return res.status(500).json({ ok: false, message: 'Błąd serwera.' });
  });

  return app;
}

module.exports = { createApp, validateQuote };
