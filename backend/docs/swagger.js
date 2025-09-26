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
          username: 'user1234',
          password: 'hashedPassword',
          isGoogleUser: false,
          googleID: null,
          reviews: ['ObjectId'],
          profileImg: 'https://res.cloudinary.com/...',
          admin: false,
          verified: true,
          verificationToken: null,
          verificationTokenExpires: null,
          verificationEmailsSent: 0,
          lastVerificationEmail: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          resetPasswordEmailsSent: 0,
          lastResetPasswordEmail: null,
          likedReviews: ['ObjectId'],
          dislikedReviews: ['ObjectId'],
          notifications: ['ObjectId']
        },
        Unit: {
          _id: 'ObjectId',
          unitCode: 'fit2099',
          name: 'Object-oriented design and implementation',
          description: 'This unit introduces object-oriented programming...',
          reviews: ['ObjectId'],
          avgOverallRating: 4.2,
          avgRelevancyRating: 4.0,
          avgFacultyRating: 4.1,
          avgContentRating: 4.3,
          level: 2,
          creditPoints: 6,
          school: 'Faculty of Information Technology',
          academicOrg: 'School of Software Development',
          scaBand: 'Band 2',
          requisites: {
            permission: false,
            prohibitions: [],
            corequisites: [],
            prerequisites: [{
              NumReq: 1,
              units: ['FIT1008', 'FIT1054']
            }],
            cpRequired: 12
          },
          offerings: [{
            location: 'Clayton',
            mode: 'On-campus',
            name: 'Semester 1',
            period: 'S1-01'
          }],
          tags: ['most-reviews'],
          aiOverview: {
            summary: 'AI-generated unit overview...',
            generatedAt: '2024-03-15T10:30:00Z',
            model: 'gpt-3.5-turbo',
            totalReviewsConsidered: 25,
            reviewSampleSize: 20,
            setuSeasons: ['2023_S1', '2023_S2']
          }
        },
        Review: {
          _id: 'ObjectId',
          title: 'Great unit for learning OOP',
          semester: 'S1',
          year: 2024,
          grade: 'HD',
          overallRating: 4,
          relevancyRating: 4,
          facultyRating: 5,
          contentRating: 4,
          description: 'This unit provided excellent coverage of object-oriented programming concepts...',
          likes: 5,
          dislikes: 1,
          unit: 'ObjectId',
          author: 'ObjectId',
          createdAt: '2024-03-15T10:30:00Z',
          updatedAt: '2024-03-15T10:30:00Z'
        },
        SETU: {
          _id: 'ObjectId',
          unit_code: 'FIT2099',
          unit_name: 'Object-oriented design and implementation',
          code: 'FIT2099_S1-01_ON_CLAYTON',
          Season: '2024_S1',
          Responses: 45,
          Invited: 60,
          Response_Rate: 75,
          Level: 2,
          I1: [4.2, 4.1],
          I2: [4.0, 3.9],
          I3: [4.1, 4.2],
          I4: [3.8, 3.9],
          I5: [4.3, 4.2],
          I6: [4.0, 4.1],
          I7: [4.5, 4.4],
          I8: [4.1, 4.0],
          I9: [3.9, 4.0],
          I10: [4.2, 4.3],
          I11: [3.7, 3.8],
          I12: [4.4, 4.3],
          I13: [3.8, 3.9],
          agg_score: [4.1, 4.0],
          createdAt: '2024-03-15T10:30:00Z',
          updatedAt: '2024-03-15T10:30:00Z'
        },
        Notification: {
          _id: 'ObjectId',
          data: {
            message: 'user1234 liked your review on FIT2099',
            user: {
              username: 'user1234',
              profileImg: 'https://res.cloudinary.com/...'
            }
          },
          navigateTo: '/unit/fit2099',
          timestamp: '2024-03-15T10:30:00Z',
          isRead: false,
          review: 'ObjectId',
          user: 'ObjectId'
        }
      }
    };

    const outputFile = './docs/swagger.json';
    const endpointsFiles = ['./server.js'];

    try {
      await swaggerAutogen(outputFile, endpointsFiles, doc)

      // Load the generated documentation
      const swaggerDocument = JSON.parse(fs.readFileSync('./docs/swagger.json', 'utf8'));

      app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MonSTAR API Documentation',
        swaggerOptions: {
          docExpansion: 'none',  // Collapse all tags by default
        }
      }));

      console.log('📚 Swagger UI available at http://localhost:8080/docs');
    } catch (error) {
      console.warn('⚠️  Failed to setup Swagger documentation:', error.message);
    }
  }
};

module.exports = { setupSwagger };