import { prisma } from '../utils/prisma';

export const columnService = {
  async create(userId: string, boardId: string, data: { name: string; order?: number; wipLimit?: number }) {
    if (!data.name?.trim()) {
      throw Object.assign(new Error('Название колонки обязательно'), { status: 400 });
    }

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
    });
    if (!board) {
      throw Object.assign(new Error('Доска не найдена'), { status: 404 });
    }

    const count = await prisma.column.count({ where: { boardId } });

    return prisma.column.create({
      data: {
        name: data.name.trim(),
        order: data.order ?? count,
        wipLimit: data.wipLimit,
        boardId,
      },
    });
  },

  async update(userId: string, columnId: string, data: { name?: string; order?: number; wipLimit?: number | null }) {
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: { project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
      },
    });
    if (!column) {
      throw Object.assign(new Error('Колонка не найдена'), { status: 404 });
    }

    return prisma.column.update({ where: { id: columnId }, data });
  },

  async remove(userId: string, columnId: string) {
    const column = await prisma.column.findFirst({
      where: {
        id: columnId,
        board: { project: { ownerId: userId } },
      },
    });
    if (!column) {
      throw Object.assign(new Error('Колонка не найдена'), { status: 404 });
    }
    await prisma.column.delete({ where: { id: columnId } });
  },
};
