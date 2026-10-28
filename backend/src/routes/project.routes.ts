import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { boardController } from '../controllers/board.controller';
import { auth } from '../middleware/auth';
import { memberController } from '../controllers/member.controller';

export const projectRouter = Router();

projectRouter.use(auth);

projectRouter.get('/', projectController.list);
projectRouter.post('/', projectController.create);
projectRouter.get('/:id', projectController.getById);
projectRouter.patch('/:id', projectController.update);
projectRouter.delete('/:id', projectController.remove);

projectRouter.get('/:projectId/boards', boardController.list);
projectRouter.post('/:projectId/boards', boardController.create);
projectRouter.get('/:projectId/members', memberController.list);
projectRouter.post('/:projectId/members', memberController.add);
projectRouter.delete('/:projectId/members/:userId', memberController.remove);