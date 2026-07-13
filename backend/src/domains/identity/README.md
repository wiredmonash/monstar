# Identity

Who the user is and what the platform tells them.

- [users](users/): user accounts, Google auth, JWT tokens, avatars.
  Routes: `/api/v1/auth`, `/api/v2/users`
- [notifications](notifications/): per-user notifications.
  Routes: `/api/v1/notifications`

Notes:

- Auth middleware lives in [users](users/), not in shared: import `verifyToken`, `verifyUser`, and `verifyAdmin` from `@domains/identity/users` (defined in [auth.middleware.ts](users/auth.middleware.ts)).
- The [User schema](users/user.model.ts) stores the Google account id as `googleID` (capital D). Keep that casing in queries and projections.
