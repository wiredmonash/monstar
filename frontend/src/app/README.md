# App structure

Angular 18, standalone components only (no NgModules).

- [routes/](routes/): one folder per page, registered in [app.routes.ts](app.routes.ts).
- [shared/components/](shared/components/): reusable UI (navbar, footer, cards, rating, notifications).
- [shared/services/](shared/services/): injectable singletons. [api/](shared/services/api/) wraps backend endpoints, [ui/](shared/services/ui/) holds UI-only services, the root holds app-wide ones (auth, csrf, viewport).
- [shared/models/](shared/models/): legacy v1 model classes at the root; [v2/](shared/models/v2/) holds the Zod schemas and inferred types the `@models` alias points at.
- [shared/interceptors/](shared/interceptors/): HTTP interceptors for auth refresh and CSRF tokens.
- [shared/pipes/](shared/pipes/), [shared/constants/](shared/constants/), [shared/utils/](shared/utils/): what the names say.

## Path aliases

From [tsconfig.json](../../tsconfig.json): `@routes`, `@components`, `@services`, `@pipes`, and `@models` (which resolves to [shared/models/v2](shared/models/v2/), not the legacy root).

## Conventions

- New page: add a folder under [routes/](routes/) and register the component in [app.routes.ts](app.routes.ts).
- Set `standalone: true` explicitly on components, directives, and pipes. Implicit standalone starts in Angular 19 and omitting it here breaks the build.
- Take API URLs from the [environments/](../environments/) constants (`apiUrl`, `setuUrl`, and friends); don't hardcode `/api/v1` in services.
- The Angular 18 rules in [AGENTS.md](../../../AGENTS.md) cover which newer-Angular APIs don't exist here.
