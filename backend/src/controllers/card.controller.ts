import { Request, Response, NextFunction } from 'express';
import { cardService } from '../services/card.service';

export const cardController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const card = await cardService.create(req.user!.id, req.body);
      res.status(201).json(card);
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const card = await cardService.update(req.user!.id, String(req.params.id), req.body);
      res.json(card);
    } catch (e) { next(e); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await cardService.remove(req.user!.id, String(req.params.id));
      res.status(204).send();
    } catch (e) { next(e); }
  },

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const { toColumnId, newOrder } = req.body;
      const card = await cardService.move(req.user!.id, String(req.params.id), toColumnId, newOrder);
      res.json(card);
    } catch (e) { next(e); }
  },
};
