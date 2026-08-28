const express = require("express");
const contestRouter = express.Router();
const axios = require("axios");

// Fallback data (in case API fails)
const FALLBACK_CONTESTS = [
    {
        id: 1,
        name: "Codeforces Round 1118 (Div. 2)",
        type: "Rated",
        durationSeconds: 7200,
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        url: "https://codeforces.com/contests/1118",
        platform: "Codeforces"
    },
    {
        id: 2,
        name: "Educational Codeforces Round 194 (Div. 2)",
        type: "Educational",
        durationSeconds: 7200,
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        url: "https://codeforces.com/contests/1119",
        platform: "Codeforces"
    },
    {
        id: 3,
        name: "Codeforces Round 1117 (Div. 2)",
        type: "Rated",
        durationSeconds: 7200,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        url: "https://codeforces.com/contests/1120",
        platform: "Codeforces"
    },
    {
        id: 4,
        name: "LeetCode Weekly Contest 402",
        type: "Weekly",
        durationSeconds: 5400,
        startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        url: "https://leetcode.com/contest/",
        platform: "LeetCode"
    }
];

// Get upcoming contests from Codeforces
const getCodeforcesContests = async () => {
    try {
        const response = await axios.get("https://codeforces.com/api/contest.list?gym=false");
        return response.data.result
            .filter(contest => contest.phase === "BEFORE")
            .map(contest => ({
                id: contest.id,
                name: contest.name,
                type: contest.type,
                durationSeconds: contest.durationSeconds,
                startTime: new Date(contest.startTimeSeconds * 1000),
                url: `https://codeforces.com/contests/${contest.id}`,
                platform: "Codeforces"
            }));
    } catch (err) {
        console.error("Codeforces API error, using fallback:", err.message);
        return FALLBACK_CONTESTS.filter(c => c.platform === "Codeforces");
    }
};

// Get contests
contestRouter.get("/upcoming", async (req, res) => {
    try {
        const codeforces = await getCodeforcesContests();
        
        // Always include LeetCode fallback
        const leetcode = FALLBACK_CONTESTS.filter(c => c.platform === "LeetCode");
        
        const allContests = [...codeforces, ...leetcode];
        
        // Sort by start time
        allContests.sort((a, b) => a.startTime - b.startTime);
        
        res.status(200).json(allContests);
    } catch (err) {
        console.error("Contests error:", err.message);
        res.status(200).json(FALLBACK_CONTESTS);
    }
});

module.exports = contestRouter;