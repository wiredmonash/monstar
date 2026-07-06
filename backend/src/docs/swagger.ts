import type { Express } from 'express';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

const setupSwagger = async (app: Express) => {
  if (!process.env.DEVELOPMENT) return;

  const fs = await import('fs');
  const { default: m2s } = await import('mongoose-to-swagger');
  const swaggerAutogen = (await import('swagger-autogen')).default();
  const swaggerUi = await import('swagger-ui-express');

  const { Notification } = await import('@domains/identity/notifications');
  const { Review } = await import('@domains/academics/reviews');
  const { SETU } = await import('@domains/academics/setu');
  const { Unit } = await import('@domains/academics/units');
  const { User } = await import('@domains/identity/users');

  const doc = {
    info: {
      title: 'MonSTAR API',
      description:
        'MonSTAR backend API for Monash University unit reviews and SETU data',
      version: '1.0.0',
    },
    host:
      process.env.NODE_ENV === 'production'
        ? 'monstar.wired.org.au'
        : 'localhost:8080',
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      {
        name: 'Units',
        description: 'Unit information and management',
      },
      {
        name: 'Units V2',
        description: 'Unit information and management V2',
      },
      {
        name: 'Reviews',
        description: 'Reviews for units',
      },
      {
        name: 'Reviews V2',
        description: 'Reviews for units V2',
      },
      {
        name: 'Auth',
        description: 'Authentication and user management',
      },
      {
        name: 'User V2',
        description: 'Authentication and user management V2',
      },
      {
        name: 'Notifications',
        description: 'User notifications',
      },
      {
        name: 'GitHub',
        description: 'GitHub integration for repository operations',
      },
      {
        name: 'SETU',
        description: 'Student Evaluation of Teaching and Units data',
      },
      {
        name: 'CSRF',
        description: 'Cross-Site Request Forgery',
      },
      {
        name: 'Developer',
        description: 'Helper endpoints for developers',
      },
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
      },
    },
    definitions: {
      User: m2s(User),
      Unit: m2s(Unit),
      Review: m2s(Review),
      SETU: m2s(SETU),
      Notification: m2s(Notification),
    },
  };

  const outputFile = './src/docs/swagger.json';
  // swagger.endpoints.ts uses relative imports autogen can follow (see #203).
  const endpointsFiles = ['./src/docs/swagger.endpoints.ts'];

  try {
    await swaggerAutogen(outputFile, endpointsFiles, doc);

    // Load the generated documentation
    const swaggerDocument = JSON.parse(
      fs.readFileSync('./src/docs/swagger.json', 'utf8')
    );

    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MonSTAR API Documentation',
        swaggerOptions: {
          docExpansion: 'none',
          requestInterceptor: async (req: {
            headers: Record<string, string | undefined>;
          }) => {
            try {
              const response = await fetch('/api/v1/csrf-token', {
                credentials: 'include',
              });
              if (response.ok) {
                const data = (await response.json()) as { csrfToken?: string };
                req.headers['X-CSRF-Token'] = data.csrfToken;
              }
            } catch (err) {
              console.error('Failed to fetch CSRF token:', err);
            }
            return req;
          },
        },
      })
    );

    console.log(
      '[Swagger UI] 📚 Documentation available at http://localhost:8080/docs'
    );
  } catch (error) {
    console.warn(
      '[Swagger UI] ⚠️ Failed to setup Swagger documentation:',
      getErrorMessage(error)
    );
  }
};

export { setupSwagger };
