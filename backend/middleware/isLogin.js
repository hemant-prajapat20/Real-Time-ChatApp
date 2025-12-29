import jwt from 'jsonwebtoken';
import User from '../Models/userModels.js'

const isLogin = async(req,res,next)=>{
    try{
        const token = req.cookies.jwt;
        // console.log(req.cookies.jwt);
        // console.log(token);
        if(!token) 
          return res.status(401).send({success: false,message: "User Unauthorize "});
        const decode =jwt.verify(token,process.env.JWT_SECRET);

        if(!decode)
          return res.status(401).send({success: false,message: "User Unauthorize - Invalid Token "});
        const user=await User.findById(decode.userId).select("-password");
        if(!user) 
          return res.status(401).send({success: false,message: "User not Found "});
        
        req.user= user;
        next();
    }
    catch(error){
        console.log(`error in isLogin middleware ${error.message}`);
        res.status(401).send({
            success: false,
            message: error
        })
    }
}
export default isLogin