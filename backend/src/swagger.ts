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
      // ================= AUTH =================
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
      // ================= PROJECTS =================
      '/api/projects': {
        get: {
          summary: 'Получить все проекты пользователя',
          tags: ['Projects'],
          responses: { '200': { description: 'Список проектов' } },
        },
        post: {
          summary: 'Создать новый проект',
          tags: ['Projects'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Мой проект' },
                    description: { type: 'string', example: 'Описание' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Проект создан' } },
        },
      },
      // ================= BOARDS =================
      '/api/projects/{projectId}/boards': {
        get: {
          summary: 'Получить доски проекта',
          tags: ['Boards'],
          parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Список досок' } },
        },
        post: {
          summary: 'Создать доску в проекте',
          tags: ['Boards'],
          parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string', example: 'Новая доска' } } },
              },
            },
          },
          responses: { '201': { description: 'Доска создана' } },
        },
      },
      // ================= COLUMNS =================
      '/api/boards/{boardId}/columns': {
        post: {
          summary: 'Создать колонку на доске',
          tags: ['Columns'],
          parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string', example: 'To Do' } } },
              },
            },
          },
          responses: { '201': { description: 'Колонка создана' } },
        },
      },
      // ================= CARDS =================
      '/api/cards': {
        post: {
          summary: 'Создать задачу (карточку)',
          tags: ['Cards'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'Сделать лабу' },
                    columnId: { type: 'string', example: 'uuid-колонки' },
                    deadline: { type: 'string', format: 'date-time' },
                    labels: { type: 'string', example: 'Учеба' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Задача создана' } },
        },
      },
    },
  },
  apis: [], 
};

export const swaggerSpec = swaggerJsdoc(options);