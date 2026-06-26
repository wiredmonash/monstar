# Contributing to MonSTAR

Contributions are welcome, Monash students preferred. Questions or ideas for new features: open a GitHub issue or reach out to [@jenul-ferdinand](https://github.com/jenul-ferdinand).

- [Development setup](#development-setup)
  - [Docker](#docker)
  - [npm](#npm)
- [Seed data](#seed-data)
- [Advanced: make shortcuts](#advanced-make-shortcuts)
- [Development modes](#development-modes)
- [Submitting changes](#submitting-changes)

## Development setup

Pick one of two setups:

- **Docker (recommended):** one command starts the frontend, backend, a MongoDB instance filled with sample data, and a local Redis cache. No MongoDB Atlas or Upstash credentials required.
- **npm:** run the servers directly on your machine against your own MongoDB.

### Docker

You need [Docker](https://docs.docker.com/get-docker/) with the Compose plugin (included in Docker Desktop).

```shell
# 1. Fork and clone
git clone https://github.com/your-username/monstar.git
cd monstar

# 2. Create the backend environment file (the defaults work for Docker)
cp backend/.env.template backend/.env

# 3. Build and start everything
docker compose up --build
```

The first startup takes a few minutes: Docker builds the images, waits for MongoDB, and seeds the database with the full unit catalogue plus fictional users and reviews. After that:

- Frontend: http://localhost:4200
- Backend: http://localhost:8080 (Swagger docs at `/docs`)

Edits to `frontend/` and `backend/` reload automatically. No rebuild needed.

Daily commands:

```shell
docker compose up -d             # Start in the background
docker compose logs -f backend   # Follow logs (also: frontend, mongo)
docker compose down              # Stop everything; database data survives
```

When a `package.json` changes, rebuild and reseed:

```shell
docker compose down -v && docker compose up --build
```

### npm

You need Node.js and a MongoDB instance (local or Atlas).

```shell
# 1. Fork and clone
git clone https://github.com/your-username/monstar.git
cd monstar

# 2. Install dependencies
npm install -g @angular/cli@18
cd frontend && npm install
cd ../backend && npm install

# 3. Create backend/.env from the template, then set
#    MONGODB_CONN_STRING to your MongoDB instance
cp backend/.env.template backend/.env

# 4. Seed the database (units, users, reviews)
cd backend && npm run seed

# 5. Start both servers (or run them separately, see below)
make dev
```

```shell
cd backend && npm run dev    # Backend only, localhost:8080
cd frontend && npm start     # Frontend only, localhost:4200
```

The seeder only accepts a local MongoDB (`localhost`/`127.0.0.1`), so it can never wipe a shared database. Cloudinary credentials in `.env` are optional; profile picture uploads need them, nothing else does.

## Seed data

The sample data is synthetic: fictional students and generated reviews. Destroy and recreate it freely.

```shell
# Re-run the seeder (does nothing if data exists)
docker compose run --rm seed

# Wipe the database and reseed
docker compose run --rm seed npm run seed -- --reset

# Remove containers and volumes; the next `up` reseeds
docker compose down -v
```

Under the npm setup, run `npm run seed` or `npm run seed -- --reset` from `backend/` instead.

## Advanced: make shortcuts

The Makefile wraps the Docker commands above. Run `make help` for the full list.

```shell
make up         # docker compose up --build -d
make down       # docker compose down
make logs       # docker compose logs -f
make seed       # docker compose run --rm seed
make reset-db   # docker compose run --rm seed npm run seed -- --reset
make rebuild    # docker compose down -v && docker compose up --build -d
```

## Development modes

`DEVELOPMENT=true` (local work): the backend enables CORS for localhost:4200 and both servers hot-reload. `DEVELOPMENT=false` (production): the backend serves the built frontend from one origin.

## Submitting changes

1. Create a branch: `git switch -c your-branch-name`
2. Make your changes and test them.
3. Commit using [conventional commit messages](https://gist.github.com/Zekfad/f51cb06ac76e2457f11c80ed705c95a3). A `commit-msg` hook enforces this locally — enable it with `make hooks` (or `make install`, which runs it for you).
4. Open a pull request that describes the change, references related issues, and includes screenshots for UI changes.

Bug fixes, documentation, and performance work are always welcome. For new features, message [@jenul-ferdinand](https://github.com/jenul-ferdinand) first so we can talk it through.
