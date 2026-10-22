import { Request, Response, NextFunction } from 'express';
import { boardService } from '../services/board.service';

export const boardController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const boards = await boardService.listByProject(req.user!.id, String(req.params.projectId));
      res.json(boards);
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await boardService.create(req.user!.id, String(req.params.projectId), req.body);
      res.status(201).json(board);
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await boardService.getById(req.user!.id, String(req.params.id));
      res.json(board);
    } catch (e) { next(e); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await boardService.remove(req.user!.id, String(req.params.id));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
