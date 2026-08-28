const express = require("express");
const submissionRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const userSubmission = require("../controllers/userSubmission");
const submission = require("../models/submission");

// Get user's submissions for a problem
submissionRouter.get("/problem/:id/user", userMiddleware, async (req, res) => {
    try {
        const { id: problemId } = req.params;
        const userId = req.result._id;
        
        const submissions = await submission.find({ problemId, userId })
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.status(200).json({ submissions });
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// Existing submission route
submissionRouter.post("/problem/:id", userMiddleware, userSubmission);

module.exports = submissionRouter;