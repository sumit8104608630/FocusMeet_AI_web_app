import express from 'express';
const userRouter=express.Router();
import {createUser,loginUser,get_user_info, logoutUser, getActiveMeeting} from '../controller/user.controller.js';
import { authenticate } from '../middleware/authentication.middleware.js';

 

userRouter.post('/create_user',createUser);
userRouter.post('/login',loginUser);
userRouter.post('/logout', authenticate, logoutUser);
userRouter.get('/user_info',authenticate,get_user_info);
userRouter.get('/active_meeting', authenticate, getActiveMeeting);

export default userRouter;
