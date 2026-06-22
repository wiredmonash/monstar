/* ----------------------- Load environment variables ----------------------- */
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
// require('module-alias/register');

/* ----------------------------- Module imports ----------------------------- */
import path from 'path';

require('module-alias').addAliases({
  '@models': path.join(__dirname, 'models'),
  '@routes': path.join(__dirname, 'infra/routes'),
  '@controllers': path.join(__dirname, 'infra/controllers'),
  '@providers': path.join(__dirname, 'infra/providers'),
  '@middleware': path.join(__dirname, 'infra/middleware'),
  '@services': path.join(__dirname, 'infra/services'),
  '@repositories': path.join(__dirname, 'infra/repositories'),
  '@utilities': path.join(__dirname, 'infra/utilities'),
  '@constants': path.join(__dirname, 'constants'),
  '@docs': path.join(__dirname, 'docs'),
});

import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csurf';
import express from 'express';

const { setupSwagger } = require('@docs/swagger');
const errorMiddleware = require('@middleware/error.middleware');
const { dbConnect } = require('@providers/mongodb.provider');
const tagManager = require('@providers/tagManager.provider');

/* --------------------------- Initialize Express --------------------------- */
const app = express();

/* ------------------------ Environment configuration ----------------------- */
const isDevelopment = process.env.DEVELOPMENT === 'true';
const isProductionMachine = process.env.PRODUCTION_MACHINE !== 'false';
console.log(`Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log(
  `Production machine: ${isProductionMachine ? 'YES' : 'NO'} (secure cookies: ${!isDevelopment && isProductionMachine ? 'enabled' : 'disabled'})`
);

/* ------------------------------- Middlewares ------------------------------ */
if (isDevelopment) {
  app.use(
    cors({
      origin: 'http://localhost:4200',
      credentials: true,
    })
  );
}

app.use(express.json({ limit: '50mb' })); // Increased payload limit for JSON requests.
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increased payload limit for URL-encoded requests.
app.use(cookieParser());

/* ---------------------------------- CSRF ---------------------------------- */
app.use(
  csrf({
    cookie: {
      httpOnly: true,
      secure: !isDevelopment && isProductionMachine,
      sameSite: 'strict',
    },
  }) as any
);

/* --------------------------- CSRF Token endpoint -------------------------- */
app.get('/api/v1/csrf-token', (req, res) => {
  // #swagger.tags = ['CSRF']
  // #swagger.summary = 'Get CSRF token'
  res.json({ csrfToken: req.csrfToken() });
});

/* --------------------- Database connection middleware --------------------- */
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

/* --------------------------------- Routes --------------------------------- */
app.use('/api/v1/units', require('./infra/routes/v1/units'));
app.use('/api/v2/units', require('./infra/routes/v2/units'));
app.use('/api/v1/reviews', require('./infra/routes/v1/reviews'));
app.use('/api/v2/reviews', require('./infra/routes/v2/reviews'));
app.use('/api/v1/auth', require('./infra/routes/v1/auth'));
app.use('/api/v2/users', require('./infra/routes/v2/users'));
app.use('/api/v1/notifications', require('./infra/routes/v1/notifications'));
app.use('/api/v1/github', require('./infra/routes/v1/github'));
app.use('/api/v1/setus', require('./infra/routes/v1/setus'));
app.use('/api/v2/jobs', require('./infra/routes/v2/jobs'));
if (isDevelopment && !isProductionMachine) {
  app.use('/api/admin', require('./infra/routes/v1/admin'));
}

/* ---------------------------- Swagger ui setup ---------------------------- */
setupSwagger(app).catch(console.error);

/* -------------------------- Serving static files -------------------------- */
if (!isDevelopment) {
  app.use(
    express.static(path.join(__dirname, '../frontend/dist/frontend/browser'))
  );
}

/* ------------------------ Error handling middleware ----------------------- */
app.use(errorMiddleware);

/* -------------------------------- Services -------------------------------- */
// TODO: Use vercel-cron for jobs, node-cron doesn't work on vercel.

/* ---------------------------- Export for vercel --------------------------- */
export = app;

/* ----------------------- Start server for local dev ----------------------- */
if (require.main === module) {
  const PORT = process.env.PORT || 8080;

  dbConnect()
    .then(async () => {
      if (!isDevelopment && isProductionMachine) {
        try {
          await tagManager.updateMostReviewsTag(1);
        } catch (e) {
          console.error('Initial tag update failed', e);
        }
      }

      app.listen(PORT as any, (err?: any) => {
        if (err) console.error(err);
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to DB locally', err);
    });
}
