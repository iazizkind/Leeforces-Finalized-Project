const express = require("express");
const { getLanguageById, SubmitBatch, getResultbyToken } = require("../utils/problemUtils");
const Problem = require("../models/problem");
const mockExecution = require("../utils/mockExecution");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const createProblem = async (req, res) => {
    try {
        const { title, description, difficulty, tags, exampleTest, hiddenTest, refrenceSolution, videoUrl } = req.body;
        
        for (const { language, codeSolution } of refrenceSolution) {
            const languageId = getLanguageById(language);
            const submission = exampleTest.map((testcase) => ({
                language_id: languageId,
                source_code: codeSolution,
                stdin: testcase.input,
                expected_output: testcase.output
            }));
            const result = await mockExecution(submission);
            const isValid = result.every((submission) => submission.status.id === 3);
            if (!isValid) {
                res.status(404).send("Code Failed");
            }
        }
        
        const userProblem = await Problem.create({
            ...req.body,
            videoUrl: videoUrl || '',
            problemCreator: req.result._id
        });

        res.status(201).send("Problem Created Successfully");
    } catch (err) {
        res.status(404).send("Error: 1" + err);
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    const { title, description, difficulty, tags, exampleTest, hiddenTest, refrenceSolution, videoUrl } = req.body;
    try {
        if (!id) {
            return res.status(404).send("Invalid Id");
        }
        let newProblem = await Problem.findById(id);
        
        if (!newProblem) {
            return res.status(404).send("No Such Problem exists");
        }
        
        for (const { language, codeSolution } of refrenceSolution) {
            const languageId = getLanguageById(language);
            const submission = exampleTest.map((testcase) => ({
                language_id: languageId,
                source_code: codeSolution,
                stdin: testcase.input,
                expected_output: testcase.output
            }));
            const result = await mockExecution(submission);
            const isValid = result.every((submission) => submission.status.id === 3);
            if (!isValid) {
                return res.status(404).send("Code Failed");
            }
        }
        
        newProblem = await Problem.findByIdAndUpdate(
            id,
            { ...req.body, videoUrl: videoUrl || '' },
            { runValidator: true, new: true }
        );
        
        res.status(203).send(newProblem);
    } catch (err) {
        res.status(404).send("Error: " + err);
    }
};

const deleteProblem = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(404).send("Invalid Id");
        }
        const deletedProblem = await Problem.findByIdAndDelete(id);
        if (!deletedProblem) {
            return res.status(404).send("Invalid Problem");
        }
        res.status(202).send(deletedProblem);
    } catch (err) {
        res.status(404).send("Error Occured");
    }
};

const getProblemById = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(404).send("Invalid Id");
        }
        
        // ✅ Return ALL fields including videoUrl
        const newProblem = await Problem.findById(id);
        
        if (!newProblem) {
            return res.status(404).send("Problem Not Found");
        }

        res.status(200).json(newProblem);
    } catch (err) {
        res.status(404).send("Error: " + err);
    }
};

const getAllProblem = async (req, res) => {
    try {
        const allProblem = await Problem.find({});
        if (!allProblem) {
            return res.status(404).send("No Problems Found");
        }
        res.status(200).send(allProblem);
    } catch (err) {
        res.status(404).send("Error: " + err);
    }
};

const runCode = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, language } = req.body;

        if (!id || !code || !language) {
            return res.status(400).send("Missing code, language, or problem id");
        }

        const fetchedProblem = await Problem.findById(id).select("exampleTest");
        if (!fetchedProblem) {
            return res.status(404).send("Problem Not Found");
        }

        const languageId = getLanguageById(language);
        if (!languageId) {
            return res.status(400).send("Unsupported language");
        }

        const submissionBatch = fetchedProblem.exampleTest.map((testcase) => ({
            language_id: languageId,
            source_code: code,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const result = await mockExecution(submissionBatch);

        const testResults = fetchedProblem.exampleTest.map((testcase, index) => ({
            input: testcase.input,
            expectedOutput: testcase.output,
            passed: result[index].status.id === 3
        }));

        res.status(200).json({
            allPassed: testResults.every((t) => t.passed),
            testResults
        });
    } catch (err) {
        res.status(500).send("Error: " + err);
    }
};

// Admin uploads an editorial video file. Multer (memory storage, see
// middleware/videoUpload.js) puts the raw bytes on req.file.buffer — nothing
// is written to disk. We pipe that buffer into Cloudinary's upload_stream
// and hand back the resulting secure_url, which AdminPanel.jsx stores as
// formData.videoUrl (response.data.url).
const uploadEditorialVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No video file provided" });
        }

        const streamUpload = () => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder: "leetforces/editorials"
                    },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
        };

        const result = await streamUpload();

        res.status(200).json({ url: result.secure_url });
    } catch (err) {
        console.error("Video upload error:", err);
        res.status(500).json({ error: "Error: " + err.message });
    }
};

module.exports = { createProblem, updateProblem, deleteProblem, getProblemById, getAllProblem, runCode, uploadEditorialVideo };