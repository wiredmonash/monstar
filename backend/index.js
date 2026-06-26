/**
 * Vercel Function entrypoint for the Express API.
 *
 * This follows Vercel's documented "Custom build step for Node.js" pattern:
 * the `vercel-build` script (package.json) runs `tsc + tsc-alias` to produce
 * dist/, and this committed .js entry re-exports the compiled, alias-resolved
 * app from dist/. We can't point @vercel/node directly at src/server.ts because
 * its per-file transpile does not resolve the TypeScript `@`-path aliases
 * (e.g. @domains/*) or barrel index imports — those are only rewritten to
 * relative paths by tsc-alias during the build.
 *
 * Docs: https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#custom-build-step-for-node.js
 */
export { default } from './dist/server.js';
