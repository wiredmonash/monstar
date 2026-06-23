/* --------- Load env + register @ aliases (must run before any import) ------ */
import './bootstrap';

/* ----------------------------- Module imports ----------------------------- */
import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csurf';
import express, { type RequestHandler } from 'express';

import { setupSwagger } from '@docs/swagger';
import errorMiddleware from '@shared/middleware/error.middleware';
import { dbConnect } from '@infrastructure/database/mongodb';
import { TagManager, unitsV2Router } from '@domains/academics/units';
import { reviewsV2Router } from '@domains/academics/reviews';
import adminRouter from '@deprecated/admin.v1.routes';
import authRouter from '@deprecated/auth.v1.routes';
import githubRouter from '@deprecated/github.v1.routes';
import notificationsRouter from '@deprecated/notifications.v1.routes';
import reviewsV1Router from '@deprecated/reviews.v1.routes';
import setusRouter from '@deprecated/setus.v1.routes';
import unitsV1Router from '@deprecated/units.v1.routes';
import { usersV2Router } from '@domains/identity/users';
import { jobsV2Router } from '@domains/recruitment/jobs';

/* --------------------------- Initialize Express --------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  }) as unknown as RequestHandler
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
app.use('/api/v1/units', unitsV1Router);
app.use('/api/v2/units', unitsV2Router);
app.use('/api/v1/reviews', reviewsV1Router);
app.use('/api/v2/reviews', reviewsV2Router);
app.use('/api/v1/auth', authRouter);
app.use('/api/v2/users', usersV2Router);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/github', githubRouter);
app.use('/api/v1/setus', setusRouter);
app.use('/api/v2/jobs', jobsV2Router);
if (isDevelopment && !isProductionMachine) {
  app.use('/api/admin', adminRouter);
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
export default app;

/* ----------------------- Start server for local dev ----------------------- */
if (process.argv[1] === __filename) {
  const PORT = Number(process.env.PORT) || 8080;

  dbConnect()
    .then(async () => {
      if (!isDevelopment && isProductionMachine) {
        try {
          await TagManager.updateMostReviewsTag(1);
        } catch (e) {
          console.error('Initial tag update failed', e);
        }
      }

      app.listen(PORT, (err?: Error) => {
        if (err) console.error(err);
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err: unknown) => {
      console.error('Failed to connect to DB locally', err);
    });
}
