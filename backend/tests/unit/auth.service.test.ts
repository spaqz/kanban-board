import bcrypt from 'bcrypt';
import { authService } from '../../src/services/auth.service';
import { prisma } from '../../src/utils/prisma';

jest.mock('../../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('выбрасывает 400, если email пустой', async () => {
      await expect(
        authService.register({ email: '', password: '123456', name: 'Test' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('выбрасывает 400, если пароль короче 6 символов', async () => {
      await expect(
        authService.register({ email: 'a@a.a', password: '123', name: 'Test' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('выбрасывает 409, если email уже занят', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'a@a.a',
      });

      await expect(
        authService.register({ email: 'a@a.a', password: '123456', name: 'Test' })
      ).rejects.toMatchObject({ status: 409 });
    });

    it('успешно создаёт пользователя', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'a@a.a',
        name: 'Test',
        role: 'DEVELOPER',
      });

      const result = await authService.register({
        email: 'a@a.a',
        password: '123456',
        name: 'Test',
      });

      expect(result).toEqual({
        id: '1',
        email: 'a@a.a',
        name: 'Test',
        role: 'DEVELOPER',
      });
    });
  });

  describe('login', () => {
    it('выбрасывает 401, если пользователя нет', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'a@a.a', password: '123456' })
      ).rejects.toMatchObject({ status: 401 });
    });

    it('выбрасывает 401 при неверном пароле', async () => {
      const hash = await bcrypt.hash('wrong-password', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'a@a.a',
        name: 'Test',
        role: 'DEVELOPER',
        passwordHash: hash,
      });

      await expect(
        authService.login({ email: 'a@a.a', password: '123456' })
      ).rejects.toMatchObject({ status: 401 });
    });

    it('возвращает токен при успешном логине', async () => {
      const hash = await bcrypt.hash('123456', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'a@a.a',
        name: 'Test',
        role: 'DEVELOPER',
        passwordHash: hash,
      });

      const result = await authService.login({
        email: 'a@a.a',
        password: '123456',
      });

      expect(result.user.email).toBe('a@a.a');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });
  });
});
