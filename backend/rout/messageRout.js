import express from 'express'
import { getMessages,sendMessage,clearMessages } from '../routeControllers/messageroutControllers.js';
import isLogin from '../middleware/isLogin.js';

const router= express.Router();
router.post('/send/:id',isLogin,sendMessage)
router.get('/:id',isLogin,getMessages);
router.delete('/clear/:id',isLogin,clearMessages);

 export default router;