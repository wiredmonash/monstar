/**
 * Side-effect-only bootstrap module. Must be imported before any environment-
 * dependent module: it loads `.env` so that mongodb.provider (which throws at
 * load if MONGODB_CONN_STRING is unset) sees the variables. ESM evaluates
 * imported modules in source order, so importing this first guarantees dotenv
 * runs before those modules. The `@` path aliases are resolved at build time by
 * tsc-alias (prod) and by tsx / vite-tsconfig-paths (dev / tests), so no
 * runtime alias registration is needed under ESM.
 */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
