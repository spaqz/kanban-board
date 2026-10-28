import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = String(req.query.query || '');
      if (!query) return res.json([]);
      const users = await userService.search(query);
      res.json(users);
    } catch (e) { next(e); }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getMe((req as any).user.id);
      res.json(user);
    } catch (e) { next(e); }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateMe((req as any).user.id, req.body);
      res.json(user);
    } catch (e) { next(e); }
  }
};