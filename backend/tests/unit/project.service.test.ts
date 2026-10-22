import { projectService } from '../../src/services/project.service';
import { prisma } from '../../src/utils/prisma';

jest.mock('../../src/utils/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('projectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('выбрасывает 400, если name пустой', async () => {
      await expect(
        projectService.create('user-1', { name: '' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('выбрасывает 400, если name только из пробелов', async () => {
      await expect(
        projectService.create('user-1', { name: ' ' })
      ).rejects.toMatchObject({ status: 400 });
    });

    it('создаёт проект и обрезает пробелы в name', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValue({
        id: 'p1',
        name: 'My Project',
        ownerId: 'user-1',
      });

      const result = await projectService.create('user-1', {
        name: ' My Project ',
        description: 'Test',
      });

      expect(result).toEqual({
        id: 'p1',
        name: 'My Project',
        ownerId: 'user-1',
      });
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'My Project',
            ownerId: 'user-1',
          }),
        })
      );
    });
  });

  describe('list', () => {
    it('возвращает список проектов', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ]);

      const result = await projectService.list('user-1');

      expect(result).toHaveLength(2);
      expect(prisma.project.findMany).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('выбрасывает 404, если проекта нет', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        projectService.update('user-1', 'p1', { name: 'New' })
      ).rejects.toMatchObject({ status: 404 });
    });

    it('выбрасывает 403, если не владелец', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        ownerId: 'other-user',
      });

      await expect(
        projectService.update('user-1', 'p1', { name: 'New' })
      ).rejects.toMatchObject({ status: 403 });
    });

    it('обновляет проект, если владелец', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        ownerId: 'user-1',
      });
      (prisma.project.update as jest.Mock).mockResolvedValue({
        id: 'p1',
        name: 'Updated',
      });

      const result = await projectService.update('user-1', 'p1', {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('выбрасывает 404, если проекта нет', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        projectService.remove('user-1', 'p1')
      ).rejects.toMatchObject({ status: 404 });
    });

    it('выбрасывает 403, если не владелец', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        ownerId: 'other-user',
      });

      await expect(
        projectService.remove('user-1', 'p1')
      ).rejects.toMatchObject({ status: 403 });
    });

    it('удаляет проект, если владелец', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        ownerId: 'user-1',
      });
      (prisma.project.delete as jest.Mock).mockResolvedValue({});

      await projectService.remove('user-1', 'p1');

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });
  });
});
