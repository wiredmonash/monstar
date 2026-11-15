# Platform

Operational glue that isn't a business domain.

- [admin](admin/): dev-only ops endpoints.
  Routes: `/api/admin`, mounted only when `DEVELOPMENT=true` on a non-production machine

Notes:

- [admin](admin/) has no repository or service on purpose; the controller does the work.
