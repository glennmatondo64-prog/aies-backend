const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Security & parsing ----
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(','),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Basic rate limiting on the API surface.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'aies-backend', time: new Date().toISOString() });
});

// ---- Feature routes ----
app.use('/api', routes);

// ---- 404 + error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
