import { Router } from 'express';
import { cardController } from '../controllers/card.controller';
import { auth } from '../middleware/auth';

export const cardRouter = Router();

cardRouter.use(auth);

cardRouter.post('/', cardController.create);
cardRouter.patch('/:id', cardController.update);
cardRouter.delete('/:id', cardController.remove);
cardRouter.post('/:id/move', cardController.move);
