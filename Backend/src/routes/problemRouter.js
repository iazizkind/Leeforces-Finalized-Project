const express=require("express");
const problemRouter=express.Router();
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,runCode,uploadEditorialVideo}=require("../controllers/problemAuth")
const adminMiddleware=require("../middleware/adminMiddleware")
const videoUpload=require("../middleware/videoUpload")



//Problem Creation,Deletion,updation

problemRouter.post("/createProblem",adminMiddleware,createProblem);
problemRouter.put("/update/:id",adminMiddleware,updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware,deleteProblem);

// Editorial video upload (admin only) - multer parses "video" field into
// memory, then uploadEditorialVideo streams it to Cloudinary
problemRouter.post("/uploadVideo",adminMiddleware,videoUpload.single("video"),uploadEditorialVideo);

// //get all problem ,get one problme

problemRouter.get("/problem",getAllProblem);
problemRouter.get("/getProblemById/:id",getProblemById);
problemRouter.post("/run/:id",runCode);

module.exports=problemRouter;