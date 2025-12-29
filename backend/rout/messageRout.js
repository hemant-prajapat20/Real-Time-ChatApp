import express from 'express'
import { getMessages,sendMessage } from '../routeControllers/messageroutControllers.js';
import isLogin from '../middleware/isLogin.js';
const router= express.Router();
router.post('/send/:id',isLogin,sendMessage)
router.get('/:id',isLogin,getMessages);

 export default router;