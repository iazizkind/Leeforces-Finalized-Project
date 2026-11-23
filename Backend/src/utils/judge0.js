const axios = require("axios");

// Judge0 connection settings come from environment variables:
//   JUDGE0_URL      – base URL. Defaults to the RapidAPI-hosted Judge0 CE.
//   JUDGE0_API_KEY  – your RapidAPI key (leave unset for a self-hosted Judge0).
//   JUDGE0_API_HOST – RapidAPI host header. Defaults to judge0-ce.p.rapidapi.com.
const JUDGE0_URL = (process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com").replace(/\/$/, "");
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";

const BATCH_LIMIT = 20;          // Judge0 accepts at most 20 submissions per batch
const POLL_INTERVAL_MS = 1000;
const MAX_POLLS = 30;            // give up after ~30 seconds

// Judge0 status ids
const STATUS = {
    IN_QUEUE: 1,
    PROCESSING: 2,
    ACCEPTED: 3,
    WRONG_ANSWER: 4,
    TIME_LIMIT: 5,
    COMPILATION_ERROR: 6,
    INTERNAL_ERROR: 13,
    EXEC_FORMAT_ERROR: 14
};

const client = axios.create({
    baseURL: JUDGE0_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        ...(JUDGE0_API_KEY ? { "x-rapidapi-key": JUDGE0_API_KEY, "x-rapidapi-host": JUDGE0_API_HOST } : {})
    }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const encode = (text) => Buffer.from(text ?? "", "utf8").toString("base64");
const decode = (text) => (text ? Buffer.from(text, "base64").toString("utf8") : "");

// Ignore trailing spaces on each line and trailing blank lines,
// so "5\n" and "5" are treated as the same answer.
const normalizeOutput = (text) =>
    (text ?? "").replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).join("\n").trimEnd();

// Send up to 20 programs and wait for all of them to finish.
const runChunk = async (chunk) => {
    const { data: created } = await client.post(
        "/submissions/batch",
        {
            submissions: chunk.map((s) => ({
                language_id: s.language_id,
                source_code: encode(s.source_code),
                stdin: encode(s.stdin)
            }))
        },
        { params: { base64_encoded: "true" } }
    );

    const tokens = created.map((c) => c.token);
    if (tokens.some((t) => !t)) {
        throw new Error("Judge0 rejected the submission: " + JSON.stringify(created));
    }

    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        await sleep(POLL_INTERVAL_MS);
        const { data } = await client.get("/submissions/batch", {
            params: {
                tokens: tokens.join(","),
                base64_encoded: "true",
                fields: "token,status,stdout,stderr,compile_output,message,time,memory"
            }
        });
        const results = data.submissions;
        const done = results.every((r) => r.status && r.status.id > STATUS.PROCESSING);
        if (done) return results;
    }
    throw new Error("Judge0 took too long to respond. Please try again.");
};

/**
 * Run code against several test cases.
 * @param {Array<{language_id:number, source_code:string, stdin:string, expected_output:string}>} submissions
 * @returns {Promise<Array<{passed:boolean, verdict:string, statusId:number, stdout:string, error:string, timeMs:number, memoryKb:number}>>}
 */
const runTestCases = async (submissions) => {
    const raw = [];
    for (let i = 0; i < submissions.length; i += BATCH_LIMIT) {
        raw.push(...(await runChunk(submissions.slice(i, i + BATCH_LIMIT))));
    }

    return raw.map((r, i) => {
        const stdout = decode(r.stdout);
        const error = [decode(r.compile_output), decode(r.stderr), decode(r.message)].filter(Boolean).join("\n").trim();
        let statusId = r.status.id;
        let verdict = r.status.description;

        // Judge0 ran the program without errors; we decide whether the answer is right.
        if (statusId === STATUS.ACCEPTED) {
            const correct = normalizeOutput(stdout) === normalizeOutput(submissions[i].expected_output);
            statusId = correct ? STATUS.ACCEPTED : STATUS.WRONG_ANSWER;
            verdict = correct ? "Accepted" : "Wrong Answer";
        }

        return {
            passed: statusId === STATUS.ACCEPTED,
            verdict,
            statusId,
            stdout,
            error,
            timeMs: Math.round(parseFloat(r.time || 0) * 1000),
            memoryKb: r.memory || 0
        };
    });
};

// Turn a list of per-test results into one overall verdict for the submission.
const overallVerdict = (results) => {
    const failed = results.find((r) => !r.passed);
    if (!failed) return "Accepted";
    if (failed.statusId === STATUS.WRONG_ANSWER) return "Wrong Answer";
    if (failed.statusId === STATUS.TIME_LIMIT) return "Time Limit Exceeded";
    if (failed.statusId === STATUS.COMPILATION_ERROR) return "Compilation Error";
    if (failed.statusId === STATUS.INTERNAL_ERROR || failed.statusId === STATUS.EXEC_FORMAT_ERROR) return "Internal Error";
    return "Runtime Error";
};

module.exports = { runTestCases, overallVerdict, normalizeOutput, STATUS };
