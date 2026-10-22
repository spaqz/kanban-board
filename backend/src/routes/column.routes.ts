import { Router } from 'express';
import { columnController } from '../controllers/column.controller';
import { auth } from '../middleware/auth';

export const columnRouter = Router();

columnRouter.use(auth);

columnRouter.patch('/:id', columnController.update);
columnRouter.delete('/:id', columnController.remove);
