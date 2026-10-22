import { prisma } from '../utils/prisma';

export const cardService = {
  async create(userId: string, data: {
    title: string;
    columnId: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    deadline?: string;
  }) {
    if (!data.title?.trim()) {
      throw Object.assign(new Error('Название карточки обязательно'), { status: 400 });
    }

    const column = await prisma.column.findFirst({
      where: {
        id: data.columnId,
        board: { project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
      },
    });
    if (!column) {
      throw Object.assign(new Error('Колонка не найдена'), { status: 404 });
    }

    const count = await prisma.card.count({ where: { columnId: data.columnId } });

    return prisma.card.create({
      data: {
        title: data.title.trim(),
        description: data.description,
        priority: data.priority ?? 'MEDIUM',
        deadline: data.deadline ? new Date(data.deadline) : null,
        assigneeId: data.assigneeId,
        columnId: data.columnId,
        order: count,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async update(userId: string, cardId: string, data: {
    title?: string;
    description?: string;
    priority?: string;
    deadline?: string | null;
    assigneeId?: string | null;
    labels?: string;
  }) {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        column: { board: { project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } } },
      },
    });
    if (!card) {
      throw Object.assign(new Error('Карточка не найдена'), { status: 404 });
    }

    const updateData: any = { ...data };
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    return prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async remove(userId: string, cardId: string) {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        column: { board: { project: { ownerId: userId } } },
      },
    });
    if (!card) {
      throw Object.assign(new Error('Карточка не найдена'), { status: 404 });
    }
    await prisma.card.delete({ where: { id: cardId } });
  },

  async move(userId: string, cardId: string, toColumnId: string, newOrder: number) {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        column: { board: { project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } } },
      },
    });
    if (!card) {
      throw Object.assign(new Error('Карточка не найдена'), { status: 404 });
    }

    const targetColumn = await prisma.column.findUnique({
      where: { id: toColumnId },
    });
    if (!targetColumn) {
      throw Object.assign(new Error('Целевая колонка не найдена'), { status: 404 });
    }

    if (targetColumn.wipLimit !== null && targetColumn.id !== card.columnId) {
      const count = await prisma.card.count({ where: { columnId: toColumnId } });
      if (count >= targetColumn.wipLimit) {
        throw Object.assign(new Error('WIP-лимит колонки превышен'), { status: 409 });
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.card.updateMany({
        where: { columnId: card.columnId, order: { gt: card.order } },
        data: { order: { decrement: 1 } },
      });
      await tx.card.updateMany({
        where: { columnId: toColumnId, order: { gte: newOrder } },
        data: { order: { increment: 1 } },
      });

      return tx.card.update({
        where: { id: cardId },
        data: { columnId: toColumnId, order: newOrder },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    });
  },
};
