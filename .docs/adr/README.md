# Architecture Decision Records

MonSTAR's architectural decisions, reconstructed from git history (September 2024 onward) and maintainer interviews in July 2026, extended as new decisions land. One file per decision, numbered by decision date. Frontmatter carries `status`, `date`, and `tags` (`frontend`, `backend`, `infra`, `product`, `security`, `process`, ...).

| ADR | Date | Decision | Status |
|-----|------|----------|--------|
| [0001](0001-angular-express-mongodb-stack.md) | 2024-09 | Angular + Express + MongoDB stack | accepted |
| [0002](0002-primeng-ui-library.md) | 2024-10 | PrimeNG UI library, Bootstrap to be phased out | accepted (phase-out unfinished) |
| [0003](0003-wiredmonash-org-ownership.md) | 2024-12 | Repo owned by wiredmonash org, Jira workflow | accepted |
| [0004](0004-linode-vps-hosting.md) | 2024-12 | Host on WIRED Linode VPS (monstar.wired.org.au) | superseded by 0010 |
| [0005](0005-google-only-auth.md) | 2025-02 | Google OAuth as the only sign-in | accepted |
| [0006](0006-setu-data-integration.md) | 2025-05 | Integrate scraped SETU data | superseded by 0013 |
| [0007](0007-ai-overviews-gemini.md) | 2025-09 | AI overviews via Gemini 2.5 Pro | accepted |
| [0008](0008-swagger-api-docs.md) | 2025-09 | Swagger API docs (replacing Bruno) | accepted |
| [0009](0009-automated-linode-deploys.md) | 2025-09 | Automated Linode deploys via GitHub Actions | superseded by 0010 |
| [0010](0010-migrate-to-vercel.md) | 2025-11 | Migrate hosting to Vercel serverless | accepted |
| [0011](0011-jwt-refresh-tokens.md) | 2025-12 | JWT refresh tokens | accepted |
| [0012](0012-upstash-redis-caching.md) | 2025-12 | Upstash Redis caching layer | accepted |
| [0013](0013-remove-setu-data.md) | 2025-12 | Remove SETU data (Monash takedown) | accepted |
| [0014](0014-backend-typescript-conversion.md) | 2026-07 | Backend TypeScript conversion | accepted |
| [0015](0015-ddd-bounded-contexts.md) | 2026-07 | DDD bounded-context restructure | accepted |

Adding a new ADR: copy the frontmatter of any file here, take the next number, and when a decision reverses an old one set `supersedes`/`superseded-by` on both files.
