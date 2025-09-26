# AGENTS.md

## Mission Brief

MonSTAR backend serves Monash University students by exposing Express APIs for browsing units, posting vetted reviews, and surfacing SETU survey insights. Only authenticated Monash members can create content, and MongoDB Atlas stores all domain records.

## Stack & Entry Points

- Node 20+/Express app declared in `server.js`.
- Mongoose ODM connects to the Atlas cluster via `MONGODB_CONN_STRING`.
- Primary routers mounted under `/api/v1/*` for units, reviews, auth, notifications, GitHub, and SETU data.
- Shared utilities in `utils/`, data models in `models/`, long-running helpers in `services/`.

## Boot Sequence

1. Load environment from `.env` and configure CORS for `http://localhost:4200`.
2. Register JSON/urlencoded parsers (50 MB limit), cookie parsing, and CSRF protection.
3. Connect to MongoDB; on success trigger `tagManager.updateMostReviewsTag(1)`.
4. Start cron jobs:
   - Hourly: recompute the `most-reviews` unit tag.

- 03:00 daily: execute `utils/generate-sitemap.js`, which writes sitemap XMLs into `frontend/public`.

5. Begin listening on `PORT` (default 8080).

## Environment Variables
Key environment variables for configuration:
- **DEVELOPMENT**: Set to 'true' for development mode (enables CORS, detailed logging)
- **PRODUCTION_MACHINE**: Set to 'false' for local testing in production mode (defaults to 'true'). When 'false', disables secure CSRF cookies to allow HTTP testing
- **MONGODB_CONN_STRING**: MongoDB connection string
- **JWT_SECRET**: Secret key for JWT token generation
- **GOOGLE_CLIENT_ID** / **GOOGLE_CLIENT_SECRET**: Google OAuth credentials
- **SESSION_SECRET**: Secret for session management
- **GITHUB_TOKEN**: GitHub personal access token for repository operations
- **PORT**: Server port (defaults to 8080)

## Domain Models

- **User**: Auth metadata (Google vs password), admin flag, notification refs, liked/disliked review IDs, Cloudinary profile image. Pre-delete hooks cascade: remove reviews, adjust unit averages, purge notifications and avatars.
- **Unit**: Canonical subject record with requisites, offerings, aggregate ratings, and up to two tags (`most-reviews`, `controversial`, `wam-booster`). Holds review ObjectIDs.
- **Review**: Student-authored unit feedback with four rating dimensions, grade, semester, year, like/dislike counters; saves collapse multiline whitespace.
- **SETU**: Historical survey metrics keyed by `unit_code` + `Season`, aggregates means/medians, static helpers for per-unit retrieval and averages.
- **Notification**: Lightweight payload pointing to `review` and target `user` for reaction alerts.

## API Modules

- **Auth (`routes/auth.js`)**
  - `POST /google/authenticate`: Google OAuth, enforces Monash student/staff email patterns.
  - `GET /`: admin-protected list of all users.
  - `PUT /update/:userId`, `DELETE /delete/:userId`, `POST /upload-avatar`, `POST /logout`, `GET /validate` with `verifyToken` guard.
- **Units (`routes/units.js`)**
  - Discovery: `/`, `/popular`, `/filter`, `/unit/:unitcode`, `/:unitCode/required-by`.
  - Admin Create/Update: `POST /create`, `POST /create-bulk`, `DELETE /delete/:unitcode`, `PUT /update/:unitcode`.
- **Reviews (`routes/reviews.js`)**
  - Listings: `/`, `/:unit`, `/user/:userId`.
  - Authenticated interactions: `POST /:unit/create` (one per user/unit), `PUT /update/:reviewId`, `DELETE /delete/:reviewId`, `PATCH /toggle-reaction/:reviewId` with notification management, `POST /send-report` emails via Nodemailer.
- **Notifications (`routes/notifications.js`)**
  - `GET /user/:userId` to fetch all alerts.
  - `DELETE /:notificationId` guarded so only the owner can remove it.
- **SETU (`routes/setus.js`)**
  - Public fetches: `/`, `/unit/:unitCode`, `/average/:unitCode`, `/season/:season`.
  - Admin maintenance: `POST /create`, `POST /create-bulk`, `PUT /update/:id`, `DELETE /delete/:id`.
- **GitHub (`routes/github.js`)**
  - `GET /contributors` fetches repo contributors with token support and curated fallback data for private/unauth cases.

## Services & Utilities

- `services/tagManager.service.js`: Transactionally clears and assigns the `most-reviews` tag using review aggregates.
- JWT middleware in `utils/verify_token.js` exposes `verifyToken`, `verifyUser`, `verifyAdmin` for route guards.
- `utils/cloudinary.js`: Configures Multer storage for avatar uploads with 300x300 transformations, handles credential loading.
- `utils/generate-sitemap.js`: Connects to Mongo, builds indexed sitemaps (static, unit ranges, SETU ranges, full) and writes XML outputs.
- `utils/error.js` / `success.js`: Uniform response helpers used by middleware.

## Data & Integrations

- MongoDB collections: `users`, `units`, `reviews`, `notifications`, `setus` (plus transaction history).
- Cloudinary: stores user avatar media; deletions invoked when replacing avatars or removing users.
- Google OAuth2: `GOOGLE_CLIENT_ID` required for login flow.
- Gmail SMTP (Nodemailer): `EMAIL_USERNAME`/`EMAIL_PASSWORD` for review report emails.
- GitHub API: optional `GITHUB_TOKEN` for contributor listing.

## Security & Access Rules

- Only Monash emails (`authcate@student.monash.edu` or `firstname.lastname@monash.edu`) can authenticate; others receive HTTP 403.
- Review creation/edits/deletes require JWT cookie; users cannot review a unit more than once.
- Admin-only actions use `verifyAdmin` (unit and SETU bulk operations, destructive maintenance).
- Notification deletion ensures the cookie user matches the notification owner.

## Automation

- Hourly: tagManager.updateMostReviewsTag refreshes trending tags.
- Daily 03:00: utils/generate-sitemap.js pushes sitemap XMLs to the frontend.
- Semester prep (Feb 1 & Jun 1 at 02:00 AET): aiOverviewService.generateOverviewsForAllUnits reruns Gemini summaries with force true so new semesters start with fresh copy.

## Ops & Tooling

- Scripts: `npm run dev` (nodemon), `npm start` (Node), `npm run build` (if run from repo root to build frontend + backend).
- Environment template: `.env.template` documents all required secrets; copy to `.env` locally.
- Sample data dumps under `scraper/` (`processed_units.json`, `setu_data_2019_2024.json`) power bulk imports.
- API request collections live in `bruno/` for quick manual testing.

Stay aligned with this contract when extending endpoints or introducing new jobs so downstream Angular clients and scheduled tasks keep functioning.

## MCP servers available to you

- `semgrep`: This MCP server will allow you to scan code for security vulnerabiltiies. You should use it whenever a new critical feature is implemented that could introduce security vulnerabilties.
