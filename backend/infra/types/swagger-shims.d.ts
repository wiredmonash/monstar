// These dev-only Swagger packages ship no type declarations and have no
// published @types, so they are declared as untyped modules. They are loaded
// (via dynamic import) only when generating docs in DEVELOPMENT.
declare module 'swagger-autogen';
declare module 'mongoose-to-swagger';
declare module 'swagger-ui-express';
