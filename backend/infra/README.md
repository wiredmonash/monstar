# Infrastructure

### Most important directories:

**`controllers/`**: handles API requests, validation, orchestration, and API responses.

**`services/`**: business logic, basically bridges how data is given to controllers and how it is used from repositories.

**`repositories/`**: provides data access and isolates all database-specific logic.

### Other directories:

**`middleware/`**: intercept requests between routes and controllers (auth, logging, error handling).

**`providers/`**: integrate external services and systems (MongoDB, Cloudinary, caching, AI, tokens).

**`routes/`**: define API endpoints and map them to controllers.

**`utilities/`**: reusable helper functions and common operations.
