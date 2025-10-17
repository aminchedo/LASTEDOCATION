import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ML Training Platform API',
      version: '1.0.0',
      description: 'API documentation for ML Training Platform with authentication, dataset management, and training job control',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login or /api/auth/register'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role'
            }
          }
        },
        Dataset: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Dataset ID'
            },
            name: {
              type: 'string',
              description: 'Dataset name'
            },
            filename: {
              type: 'string',
              description: 'Original filename'
            },
            path: {
              type: 'string',
              description: 'File path on server'
            },
            size: {
              type: 'number',
              description: 'File size in bytes'
            },
            type: {
              type: 'string',
              enum: ['csv', 'json', 'jsonl'],
              description: 'Dataset file type'
            },
            uploaded_at: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp'
            }
          }
        },
        JobStatus: {
          type: 'object',
          properties: {
            job_id: {
              type: 'string',
              description: 'Unique job identifier'
            },
            status: {
              type: 'string',
              enum: ['QUEUED', 'STARTING', 'LOADING', 'RUNNING', 'COMPLETED', 'FAILED', 'STOPPED'],
              description: 'Current job status'
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Training progress percentage'
            },
            epoch: {
              type: 'number',
              description: 'Current epoch number'
            },
            step: {
              type: 'number',
              description: 'Current step within epoch'
            },
            total_steps: {
              type: 'number',
              description: 'Total steps per epoch'
            },
            loss: {
              type: 'number',
              description: 'Current loss value'
            },
            message: {
              type: 'string',
              description: 'Status message'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Training',
        description: 'Training job management endpoints'
      },
      {
        name: 'Datasets',
        description: 'Dataset upload and management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './dist/src/routes/*.js'] // Path to API route files
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ML Training Platform API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('[Swagger] API documentation available at /api-docs');
}

export { specs };
