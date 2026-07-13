# Backend source

Express API laid out as domain-driven bounded contexts. [server.ts](server.ts) wires it all together: middleware (dev CORS, CSRF, cookies), a DB-connect guard on every request, route mounting, and Swagger. [bootstrap.ts](bootstrap.ts) loads env vars and registers the path aliases, so it stays the first import in [server.ts](server.ts).

## Layout

- [domains/](domains/): business logic, one folder per bounded context. Each context has its own README.
- [infrastructure/](infrastructure/): clients for external systems (MongoDB, Redis cache, Cloudinary storage, Gemini).
- [shared/](shared/): cross-domain plumbing (error classes and middleware, `asyncHandler`, test setup).
- [docs/](docs/): Swagger generation. [swagger.json](docs/swagger.json) is generated output; dev boots rewrite it.
- [scripts/](scripts/): one-off tooling (sitemap generation, dev database seeding).

## Path aliases

`@domains/*`, `@infrastructure/*`, `@shared/*`, `@docs/*` (see [tsconfig.json](../tsconfig.json)). There are no per-layer aliases like `@models`.

## Import rules

- Each subdomain publishes its API through its `index.ts`. Cross-subdomain imports go through that barrel: `import { UnitRepository } from '@domains/academics/units'`. Import types with `import type`.
- Exception: `*.model.ts` files import other domains' models from the concrete file (`@domains/identity/users/user.model`), never the barrel. The test setup ([shared/testing/services.setup.ts](shared/testing/services.setup.ts)) eagerly loads every model via `import.meta.glob`; a barrel import would drag that subdomain's services into the eager load and bind them before `vi.mock` runs. Don't tidy these to barrels.
- academics and identity form an accepted cycle (reviews reference users and notifications for the user-deletion cascade). It stays safe because the cross-domain calls happen inside methods at call time, not at module load.

## Adding an endpoint

1. Pick the bounded context, or add a subdomain folder under the right one.
2. Follow the file convention: `x.model.ts`, `x.repository.ts`, `x.service.ts`, `x.controller.ts`, `x.types.ts`, `xs.v2.routes.ts`, and export the lot from `index.ts`.
3. Mount the router in [server.ts](server.ts).

`*.v1.*` files hold legacy v1-only logic so retiring v1 is one sweep. Issue [#208](https://github.com/wiredmonash/monstar/issues/208) tracks the v1 to v2 conversion.
