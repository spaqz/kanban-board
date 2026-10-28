import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export const memberController = {
  // 1. СПИСОК УЧАСТНИКОВ (С СОЗДАТЕЛЕМ)
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);

      // Получаем проект, чтобы узнать, кто его создатель
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { owner: { select: { id: true, name: true, email: true, avatar: true } } }
      });

      if (!project) return res.status(404).json({ error: 'Проект не найден' });

      // Получаем остальных участников
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
      });

      // Склеиваем: сначала создатель, потом остальные
      const formattedMembers = [
        { user: project.owner, role: 'OWNER' }, 
        ...members.filter(m => m.userId !== project.ownerId).map(m => ({
            user: m.user,
            role: m.role
        }))
      ];

      res.json(formattedMembers);
    } catch (e) { next(e); }
  },

  // 2. ДОБАВЛЕНИЕ УЧАСТНИКА (ВОТ ОНА, ПРОПАВШАЯ ФУНКЦИЯ!)
  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'Нужен userId' });

      const existing = await prisma.projectMember.findFirst({ where: { projectId, userId } });
      if (existing) return res.status(400).json({ error: 'Пользователь уже в команде' });

      const member = await prisma.projectMember.create({
        data: { projectId, userId, role: 'DEVELOPER' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
      });
      
      res.status(201).json(member);
    } catch (e) { next(e); }
  },

  // 3. УДАЛЕНИЕ УЧАСТНИКА
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = String(req.params.userId);

      await prisma.projectMember.deleteMany({
        where: { projectId, userId }
      });
      
      res.status(204).send();
    } catch (e) { next(e); }
  }
}; // 👈 Закрывающая скобка объекта в самом конце