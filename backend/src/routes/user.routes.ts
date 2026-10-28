import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { auth } from '../middleware/auth';

export const userRouter = Router();
userRouter.use(auth);
userRouter.get('/search', userController.search);
userRouter.get('/me', userController.getMe);
userRouter.put('/me', userController.updateMe);