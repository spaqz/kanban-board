import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kanban Board API',
      version: '1.0.0',
      description: 'API для Kanban-доски (лабораторная работа)',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Локальный сервер разработки',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Регистрация пользователя',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'user@test.com' },
                    password: { type: 'string', example: 'password123' },
                    name: { type: 'string', example: 'Иван' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Пользователь создан' },
            '409': { description: 'Email уже занят' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Вход в систему',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'user@test.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Успешный вход' },
            '401': { description: 'Неверный пароль' },
          },
        },
      },
    },
  },
  apis: [], 
};

export const swaggerSpec = swaggerJsdoc(options);