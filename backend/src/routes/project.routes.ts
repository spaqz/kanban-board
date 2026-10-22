import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { boardController } from '../controllers/board.controller';
import { auth } from '../middleware/auth';

export const projectRouter = Router();

projectRouter.use(auth);

projectRouter.get('/', projectController.list);
projectRouter.post('/', projectController.create);
projectRouter.get('/:id', projectController.getById);
projectRouter.patch('/:id', projectController.update);
projectRouter.delete('/:id', projectController.remove);

projectRouter.get('/:projectId/boards', boardController.list);
projectRouter.post('/:projectId/boards', boardController.create);
