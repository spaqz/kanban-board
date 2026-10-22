import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

const SALT_ROUNDS = 10;

export const authService = {
  async register(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;

    if (!email || !password || !name) {
      throw Object.assign(new Error('Все поля обязательны'), { status: 400 });
    }
    if (password.length < 6) {
      throw Object.assign(new Error('Пароль минимум 6 символов'), { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error('Email уже занят'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: 'DEVELOPER' },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },

  async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw Object.assign(new Error('Неверный email или пароль'), { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Неверный email или пароль'), { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },
};
