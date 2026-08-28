const express = require("express");
const authRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { 
    register, 
    login, 
    logout, 
    adminRegister, 
    getProfile, 
    updateProfile,
    upload,
    getGlobalRanking
} = require("../controllers/userAuthenti");

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware, adminRegister);
authRouter.get("/check", userMiddleware, getProfile);
authRouter.put("/update", userMiddleware, upload.single('profilePic'), updateProfile);
authRouter.get("/leaderboard", userMiddleware, getGlobalRanking);

module.exports = authRouter;