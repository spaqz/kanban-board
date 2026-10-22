import { cardService } from '../../src/services/card.service';
import { prisma } from '../../src/utils/prisma';

jest.mock('../../src/utils/prisma', () => ({
  prisma: {
    card: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    column: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('cardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('выбрасывает 400, если title пустой', async () => {
      await expect(
        cardService.create('user-1', { title: '', columnId: 'col-1' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('выбрасывает 404, если колонка не найдена', async () => {
      (prisma.column.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        cardService.create('user-1', { title: 'Task', columnId: 'col-1' })
      ).rejects.toMatchObject({ status: 404 });
    });

    it('успешно создаёт карточку', async () => {
      (prisma.column.findFirst as jest.Mock).mockResolvedValue({ id: 'col-1' });
      (prisma.card.count as jest.Mock).mockResolvedValue(2);
      (prisma.card.create as jest.Mock).mockResolvedValue({ id: 'card-1', title: 'Task', order: 2 });

      const result = await cardService.create('user-1', { title: 'Task', columnId: 'col-1' });

      expect(result.id).toBe('card-1');
      expect(prisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 2 })
        })
      );
    });
  });

  describe('move (WIP limit)', () => {
    it('выбрасывает 404, если карточка не найдена', async () => {
      (prisma.card.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        cardService.move('user-1', 'card-1', 'col-2', 0)
      ).rejects.toMatchObject({ status: 404 });
    });

    it('выбрасывает 409, если WIP-лимит превышен', async () => {
      (prisma.card.findFirst as jest.Mock).mockResolvedValue({ id: 'card-1', columnId: 'col-1', order: 0 });
      (prisma.column.findUnique as jest.Mock).mockResolvedValue({ id: 'col-2', wipLimit: 2 });
      (prisma.card.count as jest.Mock).mockResolvedValue(2); // Уже 2 карточки, а лимит 2

      await expect(
        cardService.move('user-1', 'card-1', 'col-2', 0)
      ).rejects.toMatchObject({ status: 409 });
    });

    it('успешно перемещает карточку, если лимит не превышен', async () => {
      (prisma.card.findFirst as jest.Mock).mockResolvedValue({ id: 'card-1', columnId: 'col-1', order: 0 });
      (prisma.column.findUnique as jest.Mock).mockResolvedValue({ id: 'col-2', wipLimit: 5 });
      (prisma.card.count as jest.Mock).mockResolvedValue(1); // 1 карточка, лимит 5 - можно
      (prisma.card.update as jest.Mock).mockResolvedValue({ id: 'card-1', columnId: 'col-2', order: 0 });

      const result = await cardService.move('user-1', 'card-1', 'col-2', 0);

      expect(result.columnId).toBe('col-2');
      expect(prisma.card.updateMany).toHaveBeenCalledTimes(2); // Сдвиг в старой и новой колонке
    });
  });
});