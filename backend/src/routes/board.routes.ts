import { Router } from 'express';
import { boardController } from '../controllers/board.controller';
import { columnController } from '../controllers/column.controller';
import { auth } from '../middleware/auth';

export const boardRouter = Router();

boardRouter.use(auth);

boardRouter.get('/:id', boardController.getById);
boardRouter.delete('/:id', boardController.remove);

boardRouter.post('/:boardId/columns', columnController.create);
