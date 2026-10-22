import { Request, Response, NextFunction } from 'express';
import { columnService } from '../services/column.service';

export const columnController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const column = await columnService.create(req.user!.id, String(req.params.boardId), req.body);
      res.status(201).json(column);
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const column = await columnService.update(req.user!.id, String(req.params.id), req.body);
      res.json(column);
    } catch (e) { next(e); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await columnService.remove(req.user!.id, String(req.params.id));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
