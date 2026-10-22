import { boardService } from '../../src/services/board.service';
import { prisma } from '../../src/utils/prisma';

jest.mock('../../src/utils/prisma', () => ({
  prisma: {
    board: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    column: {
      createMany: jest.fn(),
    },
  },
}));

describe('boardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('выбрасывает 400, если name пустой', async () => {
      await expect(
        boardService.create('user-1', 'proj-1', { name: '' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('выбрасывает 404, если проект не найден', async () => {
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        boardService.create('user-1', 'proj-1', { name: 'New Board' })
      ).rejects.toMatchObject({ status: 404 });
    });

    it('создаёт доску и 3 стандартные колонки', async () => {
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'proj-1' });
      (prisma.board.create as jest.Mock).mockResolvedValue({ id: 'board-1', name: 'New Board' });
      (prisma.column.createMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.board.findUnique as jest.Mock).mockResolvedValue({
        id: 'board-1',
        name: 'New Board',
        columns: [
          { name: 'To Do', order: 0 },
          { name: 'In Progress', order: 1 },
          { name: 'Done', order: 2 },
        ],
      });

      const result = await boardService.create('user-1', 'proj-1', { name: 'New Board' });

      expect(result?.id).toBe('board-1');
      expect(result?.columns).toHaveLength(3);
      expect(prisma.column.createMany).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('выбрасывает 404, если доска не найдена', async () => {
      (prisma.board.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        boardService.getById('user-1', 'board-1')
      ).rejects.toMatchObject({ status: 404 });
    });

    it('возвращает доску с колонками', async () => {
      (prisma.board.findFirst as jest.Mock).mockResolvedValue({
        id: 'board-1',
        columns: [{ id: 'col-1', name: 'To Do' }],
      });

      const result = await boardService.getById('user-1', 'board-1');
      expect(result?.id).toBe('board-1');
    });
  });
});