const jwt=require("jsonwebtoken");
const redisClient = require("../config/redis");
const User=require("../models/user");


const adminMiddleware=async (req,res,next)=>{
    try{
        const {token}=req.cookies;
        
        if(!token){
            throw new Error("Invalid Token");
        }
        const payload=await jwt.verify(token,process.env.SECRET_KEY);
        if(payload.role!='admin'){
            throw new Error("Invalid Credentials");
        }
        const {emailId}=payload;
        const reqUser=await User.findOne({emailId});
        if(!reqUser){
            throw new Error("Invalid Email Id");
        }
        const isRedis=await redisClient.exists(`token:${token}`);
        if(isRedis){
            throw new Error("Invalid Token");
        }
        req.result=payload
        console.log(req.result);
        next();
    }
    catch(err){
        res.status(401).send("Error: "+err.message);
    }
}

module.exports=adminMiddleware;
