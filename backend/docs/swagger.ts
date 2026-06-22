const setupSwagger = async (app) => {
  if (!process.env.DEVELOPMENT) return;

  const fs = require('fs');
  const m2s = require('mongoose-to-swagger');
  const swaggerAutogen = require('swagger-autogen')();
  const swaggerUi = require('swagger-ui-express');

  const Notification = require('../models/notification');
  const Review = require('../models/review');
  const SETU = require('../models/setu');
  const Unit = require('../models/unit');
  const User = require('../models/user');

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

  const outputFile = './docs/swagger.json';
  const endpointsFiles = ['./server.ts'];

  try {
    await swaggerAutogen(outputFile, endpointsFiles, doc);

    // Load the generated documentation
    const swaggerDocument = JSON.parse(
      fs.readFileSync('./docs/swagger.json', 'utf8')
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
          requestInterceptor: async (req) => {
            try {
              const response = await fetch('/api/v1/csrf-token', {
                credentials: 'include',
              });
              if (response.ok) {
                const data: any = await response.json();
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
      error.message
    );
  }
};

export { setupSwagger };
