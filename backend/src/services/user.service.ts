import { prisma } from '../utils/prisma';

export const userService = {
  async search(query: string) {
    return prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } }
        ]
      },
      select: { id: true, name: true, email: true },
      take: 10
    });
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatar: true } // 👈 добавили avatar
    });
    if (!user) throw Object.assign(new Error('Пользователь не найден'), { status: 404 });
    return user;
  },

  async updateMe(userId: string, data: { name?: string; email?: string; role?: string; avatar?: string | null }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar // 👈 добавили avatar
      },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    });
  }
};