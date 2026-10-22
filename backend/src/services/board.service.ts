import { prisma } from '../utils/prisma';

export const boardService = {
  async listByProject(userId: string, projectId: string) {
    return prisma.board.findMany({
      where: {
        projectId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { cards: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(userId: string, projectId: string, data: { name: string }) {
    if (!data.name?.trim()) {
      throw Object.assign(new Error('Название доски обязательно'), { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });
    if (!project) {
      throw Object.assign(new Error('Проект не найден'), { status: 404 });
    }

    const board = await prisma.board.create({
      data: {
        name: data.name.trim(),
        projectId,
      },
    });

    await prisma.column.createMany({
      data: [
        { name: 'To Do', order: 0, boardId: board.id },
        { name: 'In Progress', order: 1, boardId: board.id },
        { name: 'Done', order: 2, boardId: board.id },
      ],
    });

    return prisma.board.findUnique({
      where: { id: board.id },
      include: {
        columns: { orderBy: { order: 'asc' } },
      },
    });
  },

  async getById(userId: string, boardId: string) {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw Object.assign(new Error('Доска не найдена'), { status: 404 });
    }

    return board;
  },

  async remove(userId: string, boardId: string) {
    const board = await prisma.board.findFirst({
      where: { id: boardId, project: { ownerId: userId } },
    });
    if (!board) {
      throw Object.assign(new Error('Доска не найдена'), { status: 404 });
    }
    await prisma.board.delete({ where: { id: boardId } });
  },
};
