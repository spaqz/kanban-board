import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';

export const projectController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.list(req.user!.id);
      res.json(projects);
    } catch (e) { next(e); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.create(req.user!.id, req.body);
      res.status(201).json(project);
    } catch (e) { next(e); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getById(req.user!.id, String(req.params.id));
      res.json(project);
    } catch (e) { next(e); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.update(req.user!.id, String(req.params.id), req.body);
      res.json(project);
    } catch (e) { next(e); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.remove(req.user!.id, String(req.params.id));
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
