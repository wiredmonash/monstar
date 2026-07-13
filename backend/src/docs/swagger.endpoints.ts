import express from 'express';

// Feeds swagger-autogen only (see #203): routers are imported by relative path,
// not the '@domains' barrels, which autogen can't resolve. Keep the mounts below
// in sync with server.ts.
import reviewsV2Router from '../domains/academics/reviews/reviews.v2.routes';
import unitsV1Router from '../domains/academics/units/units.v1.routes';
import unitsV2Router from '../domains/academics/units/units.v2.routes';
import notificationsV1Router from '../domains/identity/notifications/notifications.v1.routes';
import authV1Router from '../domains/identity/users/auth.v1.routes';
import usersV2Router from '../domains/identity/users/users.v2.routes';
import adminV1Router from '../domains/platform/admin/admin.v1.routes';
import githubRouter from '../domains/platform/github/github.routes';
import jobsV2Router from '../domains/recruitment/jobs/jobs.v2.routes';

const app = express();

app.get(
  '/api/v1/csrf-token',
  // #swagger.tags = ['CSRF']
  // #swagger.summary = 'Get a CSRF token for subsequent state-changing requests'
  (_req, res) => res.json({ csrfToken: '' })
);

app.use('/api/v1/units', unitsV1Router);
app.use('/api/v2/units', unitsV2Router);
app.use('/api/v2/reviews', reviewsV2Router);
app.use('/api/v1/auth', authV1Router);
app.use('/api/v2/users', usersV2Router);
app.use('/api/v1/notifications', notificationsV1Router);
app.use('/api/v2/github', githubRouter);
app.use('/api/v2/jobs', jobsV2Router);
app.use('/api/admin', adminV1Router);

export default app;
