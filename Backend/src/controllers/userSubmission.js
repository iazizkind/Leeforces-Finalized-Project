const express = require("express");
const submission = require("../models/submission");
const Problem = require("../models/problem");
const User = require("../models/user");
const { getLanguageById } = require("../utils/problemUtils");
const mockExecution = require("../utils/mockExecution");

const userSubmission = async (req, res) => {
    try {
        const { id: problemId } = req.params;
        const userId = req.result._id;
        const { code, language } = req.body;
        console.log("Submission params:", req.params);
        console.log("Submission body:", req.body);

        if (!problemId || !userId || !language || !code) {
            return res.status(404).send("Invalid Credentials Here");
        }

        const fetchedProblem = await Problem.findById(problemId);
        if (!fetchedProblem) {
            return res.status(404).send("Problem Not Found");
        }

        const userSolution = await submission.create({
            userId,
            problemId,
            code,
            language,
            totalTestCases: fetchedProblem.hiddenTest.length
        });

        const languageId = getLanguageById(language);

        const submissionBatch = fetchedProblem.hiddenTest.map((testcase) => ({
            language_id: languageId,
            source_code: code,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const result = await mockExecution(submissionBatch);

        let totalTime = 0;
        let memory = 0;
        let passed = 0;

        for (let test of result) {
            totalTime += test.status.time;
            memory = Math.max(memory, test.status.memory);
            if (test.status.id === 3) passed++;
        }

        userSolution.runtime = totalTime;
        userSolution.memory = memory;
        userSolution.testCasesPassed = passed;
        userSolution.status = passed === result.length ? "Accepted" : "Runtime Error";

        await userSolution.save();

        if (userSolution.status === "Accepted") {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $addToSet: { problemSolved: problemId } },
                { new: true }
            );
            console.log("Updated user's problemSolved:", updatedUser.problemSolved);
        }

        res.status(202).send(userSolution);
    } catch (err) {
        console.error("Submission error:", err);
        res.status(404).send("Error: " + err.message);
    }
};

module.exports = userSubmission;