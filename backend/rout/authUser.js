import express from 'express'
import { userLogin,userRegister,userLogOut} from '../routeControllers/userroutControllers.js';

const router = express.Router();
router.post('/register',userRegister)
router.post('/login',userLogin)
router.post('/logout',userLogOut)

 export default router;