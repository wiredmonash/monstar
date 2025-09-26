const swaggerAutogen = require('swagger-autogen')();
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const setupSwagger = async (app) => {
  if (process.env.DEVELOPMENT === 'true') {
    const doc = {
      info: {
        title: 'MonSTAR API',
        description: 'MonSTAR backend API for Monash University unit reviews and SETU data',
        version: '1.0.0',
      },
      host: process.env.NODE_ENV === 'production' ? 'monstar.wired.org.au' : 'localhost:8080',
      schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {
          name: 'Units',
          description: 'Unit information and management'
        },
        {
          name: 'Reviews',
          description: 'Reviews for units'
        },
        {
          name: 'Auth',
          description: 'Authentication and user management'
        },
        {
          name: 'Notifications',
          description: 'User notifications'
        },
        {
          name: 'GitHub',
          description: 'GitHub integration for repository operations'
        },
        {
          name: 'SETU',
          description: 'Student Evaluation of Teaching and Units data'
        },
        {
          name: 'CSRF',
          description: 'Cross-Site Request Forgery'
        }
      ],
      securityDefinitions: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        }
      },
      definitions: {
        User: {
          _id: 'ObjectId',
          email: 'user@student.monash.edu',
          firstName: 'John',
          lastName: 'Doe',
          isAdmin: false,
          profilePicture: 'https://res.cloudinary.com/...',
          notifications: ['ObjectId'],
          likedReviews: ['ObjectId'],
          dislikedReviews: ['ObjectId']
        },
        Unit: {
          _id: 'ObjectId',
          unitCode: 'FIT2099',
          unitName: 'Object-oriented design and implementation',
          creditPoints: 6,
          faculty: 'Faculty of Information Technology',
          offerings: ['S1-01', 'S2-01'],
          prerequisites: ['FIT1008', 'FIT1054'],
          averageRating: 4.2,
          averageDifficulty: 3.1,
          averageWorkload: 3.5,
          tags: ['most-reviews'],
          reviews: ['ObjectId']
        },
        Review: {
          _id: 'ObjectId',
          unitCode: 'FIT2099',
          userId: 'ObjectId',
          rating: 4,
          difficulty: 3,
          workload: 4,
          content: 'Great unit with excellent content...',
          semester: 'S1',
          year: 2024,
          likes: 5,
          dislikes: 1,
          createdAt: '2024-03-15T10:30:00Z',
          updatedAt: '2024-03-15T10:30:00Z'
        },
        SETU: {
          _id: 'ObjectId',
          unit_code: 'FIT2099',
          Season: 'S1-01-2024',
          GTS: 4.2,
          GTS_count: 45,
          GTI: 3.8,
          GTI_count: 45,
          OSI: 4.1,
          OSI_count: 44
        }
      }
    };

    const outputFile = './swagger.json';
    const endpointsFiles = ['./server.js'];

    try {
      await swaggerAutogen(outputFile, endpointsFiles, doc)

      // Load the generated documentation
      const swaggerDocument = JSON.parse(fs.readFileSync('./swagger.json', 'utf8'));

      app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MonSTAR API Documentation'
      }));

      console.log('📚 Swagger UI available at http://localhost:8080/docs');
    } catch (error) {
      console.warn('⚠️  Failed to setup Swagger documentation:', error.message);
    }
  }
};

module.exports = { setupSwagger };