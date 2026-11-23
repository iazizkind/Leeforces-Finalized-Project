const submission = require("../models/submission");
const Problem = require("../models/problem");
const User = require("../models/user");
const { getLanguageById, normalizeLanguage } = require("../utils/problemUtils");
const { runTestCases, overallVerdict } = require("../utils/judge0");

const userSubmission = async (req, res) => {
    try {
        const { id: problemId } = req.params;
        const userId = req.result._id;
        const { code } = req.body;
        const language = normalizeLanguage(req.body.language);

        if (!problemId || !userId || !language || !code) {
            return res.status(400).send("Missing code, language or problem id");
        }

        const languageId = getLanguageById(language);
        if (!languageId) {
            return res.status(400).send(`Unsupported language: ${req.body.language}`);
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

        const submissionBatch = fetchedProblem.hiddenTest.map((testcase) => ({
            language_id: languageId,
            source_code: code,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        let results;
        try {
            results = await runTestCases(submissionBatch);
        } catch (judgeErr) {
            console.error("Judge0 error:", judgeErr.response?.data || judgeErr.message);
            userSolution.status = "Internal Error";
            userSolution.errorMessege = "The code runner is unavailable right now. Please try again in a minute.";
            await userSolution.save();
            return res.status(503).send(userSolution.errorMessege);
        }

        const firstFailure = results.find((r) => !r.passed);

        userSolution.runtime = results.reduce((sum, r) => sum + r.timeMs, 0);
        userSolution.memory = results.reduce((max, r) => Math.max(max, r.memoryKb), 0);
        userSolution.testCasesPassed = results.filter((r) => r.passed).length;
        userSolution.status = overallVerdict(results);
        userSolution.errorMessege = firstFailure ? firstFailure.error : "";

        await userSolution.save();

        if (userSolution.status === "Accepted") {
            await User.findByIdAndUpdate(userId, { $addToSet: { problemSolved: problemId } });
        }

        res.status(201).send(userSolution);
    } catch (err) {
        console.error("Submission error:", err);
        res.status(500).send("Error: " + err.message);
    }
};

module.exports = userSubmission;
