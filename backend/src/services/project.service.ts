import { prisma } from '../utils/prisma';

export const projectService = {
  async list(userId: string) {
    return prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        // 👇 ДОБАВИЛИ avatar: true ВОТ СЮДА
        owner: { select: { id: true, name: true, email: true, avatar: true } }, 
        _count: { select: { boards: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
   async create(userId: string, data: { name: string; description?: string }) {
    if (!data.name?.trim()) {
      throw Object.assign(new Error('Название обязательно'), { status: 400 });
    }

    return prisma.project.create({
      data: {
        name: data.name.trim(),
        description: data.description,
        ownerId: userId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async getById(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        boards: {
          include: {
            columns: {
              orderBy: { order: 'asc' },
              include: { _count: { select: { cards: true } } },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      throw Object.assign(new Error('Проект не найден'), { status: 404 });
    }

    return project;
  },

  async update(userId: string, projectId: string, data: { name?: string; description?: string }) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw Object.assign(new Error('Проект не найден'), { status: 404 });
    }
    if (project.ownerId !== userId) {
      throw Object.assign(new Error('Только владелец может редактировать'), { status: 403 });
    }

    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  },

  async remove(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw Object.assign(new Error('Проект не найден'), { status: 404 });
    }
    if (project.ownerId !== userId) {
      throw Object.assign(new Error('Только владелец может удалить'), { status: 403 });
    }

    await prisma.project.delete({ where: { id: projectId } });
  },
};


  