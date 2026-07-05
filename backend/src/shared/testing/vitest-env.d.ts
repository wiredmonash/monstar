import type { Express } from 'express';

// The integration/performance setups assign the booted app to `global.app` for
// supertest to drive; declare it so test files type-check in the editor.
declare global {
  // eslint-disable-next-line no-var
  var app: Express;
}

export {};
