# Platform

Operational glue that isn't a business domain.

- [github](github/): repo contributors fetched from the GitHub API.
  Routes: `/api/v1/github`
- [admin](admin/): dev-only ops endpoints.
  Routes: `/api/admin`, mounted only when `DEVELOPMENT=true` on a non-production machine

Notes:

- [github](github/) uses a gateway: [github.gateway.ts](github/github.gateway.ts) wraps axios and the service stays HTTP-free. Tests mock the default axios export, so keep the default instance rather than `axios.create()`.
- [admin](admin/) has no repository or service on purpose; the controller does the work.
