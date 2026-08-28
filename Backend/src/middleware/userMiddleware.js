const express=require("express");
const jwt=require("jsonwebtoken");
const redisClient = require("../config/redis");
const User=require("../models/user");


const userMiddleware=async (req,res,next)=>{
    try{

        ///what are we doing here

        //First of all, we will take the token given by the user from cookis
        //Check if the token given is valid of not using jwt verify
        //If its a verified token,then check if its a blocked token or not if not then verify it
        const {token}=req.cookies;
        if(!token){
            throw new Error("Invalid Token");
        
        }
        const payload=await jwt.verify(token,process.env.SECRET_KEY);
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
        next();
    }
    catch(err){
        res.status(404).send("Error: "+err);
    }
}

module.exports=userMiddleware;