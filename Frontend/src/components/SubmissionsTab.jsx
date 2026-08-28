import { useState, useEffect } from "react";
import axiosClient from "../utils/axios";
import "../styles/SubmissionsTab.css";

// Mount inside the problem page's "Submissions" tab, passing the current
// problem's id. Hits the existing GET /submission/problem/:id/user route
// (submit.js), which is already protected by userMiddleware and already
// scoped to the logged-in user server-side.
function SubmissionsTab({ problemId }) {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!problemId) return;

        const fetchSubmissions = async () => {
            setIsLoading(true);
            setError("");
            try {
                const response = await axiosClient.get(`/submission/problem/${problemId}/user`);
                setSubmissions(response.data.submissions || []);
            } catch (err) {
                setError("Could not load submissions.");
                console.error("Fetch submissions error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [problemId]);

    if (isLoading) {
        return <div className="submissions-loading">Loading submissions...</div>;
    }

    if (error) {
        return <div className="submissions-error">{error}</div>;
    }

    if (submissions.length === 0) {
        return <div className="submissions-empty">No submissions yet for this problem.</div>;
    }

    return (
        <div className="submissions-list">
            {submissions.map((sub) => (
                <div key={sub._id} className="submission-row">
                    <div className="submission-row-top">
                        <span className={`submission-status submission-status-${sub.status.replace(/\s+/g, "-").toLowerCase()}`}>
                            {sub.status}
                        </span>
                        <span className="submission-language">{sub.language}</span>
                        <span className="submission-date">
                            {new Date(sub.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div className="submission-row-stats">
                        <span>{sub.testCasesPassed}/{sub.totalTestCases} test cases passed</span>
                        <span>Runtime: {sub.runtime}ms</span>
                        <span>Memory: {sub.memory}KB</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SubmissionsTab;
