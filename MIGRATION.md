# Migration Guide: Environment-Based Configuration

This guide explains how to migrate from the old branch-based development setup to the new environment-based configuration system.

## What Changed?

### Before (Branch-Based)
- **`main` branch**: Production setup with static file serving, no CORS, relative URLs
- **`develop` branch**: Development setup with CORS enabled, full URLs
- **Problem**: Painful merges between branches due to configuration differences

### After (Environment-Based)
- **Single branch**: All configuration controlled by `DEVELOPMENT` environment variable
- **`DEVELOPMENT=true`**: Development mode (CORS enabled, full URLs)
- **`DEVELOPMENT=false`**: Production mode (static file serving, relative URLs)

## Migration Steps

### 1. Update Your Local Setup

#### Old Way
```bash
# Development
git checkout develop
cd backend && npm run dev
cd frontend && ng serve

# Production
git checkout main
cd backend && npm start
```

#### New Way
```bash
# Development (single command)
npm run dev

# Or manually:
npm run dev:backend  # Backend with DEVELOPMENT=true
npm run dev:frontend # Frontend dev server

# Production
npm run build        # Build frontend
npm run start:prod   # Backend with DEVELOPMENT=false
```

### 2. Environment Variable Setup

The backend now automatically detects the environment:
- `DEVELOPMENT=true` → Development mode (CORS, no static serving)
- `DEVELOPMENT=false` → Production mode (static serving, no CORS)

### 3. Update Your Development Workflow

#### Before
1. Create branch from `develop`
2. Work on feature
3. Merge back to `develop`
4. Carefully merge `develop` to `main` (avoiding config conflicts)

#### After
1. Create branch from `main`
2. Work on feature
3. Merge back to `main`
4. No config conflicts!

### 4. Updated Commands

| Task | Old Command | New Command |
|------|-------------|-------------|
| Development | `cd backend && npm run dev` + `cd frontend && ng serve` | `npm run dev` |
| Production | Switch to main branch + `npm start` | `npm run start:prod` |
| Build | `npm run build` | `npm run build` |

## Benefits

✅ **No more branch conflicts** - Configuration is environment-driven
✅ **Simplified workflow** - Single branch strategy
✅ **Easy switching** - Just change environment variable
✅ **Better DX** - Single command for development setup
✅ **Consistent codebase** - No more duplicate configurations

## Troubleshooting

### If you get CORS errors in development:
- Make sure you're using `npm run dev` or `npm run dev:backend`
- Check that `DEVELOPMENT=true` is set

### If static files don't serve in production:
- Make sure you've run `npm run build` first
- Check that `DEVELOPMENT=false` is set
- Verify the frontend build exists in `frontend/dist/frontend/browser/`

### If environment variable isn't working:
- On Windows, the scripts use `cross-env` for compatibility
- Make sure dependencies are installed: `npm install`

## Key Files Changed

- `backend/server.js` - Environment-based CORS and static serving logic
- `frontend/src/environments/` - Environment-specific API URLs
- `frontend/src/app/shared/services/*.service.ts` - Use environment URLs
- `package.json` files - New development and production scripts
- `README.md` - Updated documentation