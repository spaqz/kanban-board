import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/utils/prisma'; 

const app = createApp();

describe('Auth API (Integration)', () => {
  const testUser = {
    email: 'integration@test.com',
    password: 'password123',
    name: 'Integration User'
  };

  beforeAll(async () => {
    await prisma.card.deleteMany();
    await prisma.column.deleteMany();
    await prisma.board.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/auth/register - должен регистрировать пользователя', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);
  });

  it('POST /api/auth/register - должен выдавать 409, если email занят', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'Email уже занят');
  });

  it('POST /api/auth/login - должен возвращать JWT токен', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('GET /api/projects - должен выдавать 401 без токена', async () => {
    const res = await request(app).get('/api/projects');
    
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Токен не предоставлен');
  });
});