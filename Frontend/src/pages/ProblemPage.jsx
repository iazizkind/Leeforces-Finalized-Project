// src/pages/ProblemPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import axiosClient from "../utils/axios";
import { checkAuth } from "../authSlice";
import SubmissionsTab from "../components/SubmissionsTab";
import ChatbotTab from "../components/ChatbotTab";
import "../styles/ProblemDetailPage.css";

// Convert any YouTube URL to embeddable format
function getEmbedUrl(url) {
    if (!url) return null;
    
    if (url.includes("/embed/")) return url;
    
    let videoId = null;
    
    try {
        const urlObj = new URL(url);
        
        if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.get("v")) {
            videoId = urlObj.searchParams.get("v");
        }
        else if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.slice(1);
        }
        else if (urlObj.pathname.includes("/shorts/")) {
            videoId = urlObj.pathname.split("/shorts/")[1];
        }
    } catch {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function isDirectVideoUrl(url) {
    if (!url) return false;
    if (url.includes("res.cloudinary.com")) return true;
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

function ProblemDetailPage() {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("cpp");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("description");
    
    useEffect(() => {
        const fetchProblemDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axiosClient.get(`/problem/getProblemById/${problemId}`);
                
                console.log("API Response data:", response.data);
                
                const problemData = response.data?.problem || response.data;
                
                if (problemData && problemData.title) {
                    setProblem(problemData);
                } else {
                    throw new Error("Problem data not found");
                }
                
                setCode(`#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`);
            } catch (err) {
                console.error("Error fetching problem:", err);
                setError(err.response?.data?.error || err.response?.data || "Failed to load problem");
            } finally {
                setLoading(false);
            }
        };
        
        fetchProblemDetail();
    }, [problemId]);
    
    const handleCodeChange = (value) => {
        setCode(value);
    };
    
    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };
    
    const handleRun = async () => {
        try {
            setIsRunning(true);
            setOutput("Running...");
            
            const response = await axiosClient.post(`/problem/run/${problemId}`, {
                code,
                language
            });
            
            const { allPassed, testResults } = response.data;
            const formatted = testResults
                .map((t, i) =>
                    `Test Case ${i + 1}: ${t.passed ? "✅ Passed" : `❌ ${t.verdict || "Failed"}`}\n` +
                    `Input: ${t.input}\nExpected: ${t.expectedOutput}\nActual: ${t.actualOutput || "N/A"}` +
                    (t.error ? `\nError:\n${t.error}` : "")
                )
                .join("\n\n");
            
            setOutput(
                `${allPassed ? "🎉 All sample tests passed!" : "⚠️ Some sample tests failed."}\n\n${formatted}`
            );
        } catch (err) {
            setOutput(err.response?.data?.error || err.response?.data || "Error running code");
        } finally {
            setIsRunning(false);
        }
    };
    
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setOutput("Submitting...");
            
            const response = await axiosClient.post(`/submission/problem/${problemId}`, {
                code,
                language
            });
            
            const { status, testCasesPassed, totalTestCases, runtime, memory, errorMessege } = response.data;
            setOutput(
                `Status: ${status}\n` +
                `Test Cases Passed: ${testCasesPassed}/${totalTestCases}\n` +
                `Runtime: ${runtime ?? "N/A"}ms\n` +
                `Memory: ${memory ?? "N/A"}KB` +
                (errorMessege ? `\n\nError:\n${errorMessege}` : "")
            );
            
            if (status === "Accepted") {
                dispatch(checkAuth());
            }
        } catch (err) {
            setOutput(err.response?.data?.error || err.response?.data || "Error submitting - are you logged in?");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">Loading problem...</div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="error-container">
                <h2>Error Loading Problem</h2>
                <p>{error}</p>
                <button onClick={() => navigate("/")}>Back to Problems</button>
            </div>
        );
    }
    
    if (!problem) {
        return (
            <div className="error-container">
                <h2>Problem Not Found</h2>
                <p>Could not find problem with ID: {problemId}</p>
                <button onClick={() => navigate("/")}>Back to Problems</button>
            </div>
        );
    }
    
    return (
        <div className="problem-detail-page">
            {/* Top Navigation */}
            <nav className="detail-navbar">
                <Link to="/" className="problem-logo">
                    <span className="logo-icon">⬡</span>
                    <span>LeetForces</span>
                </Link>
                
                {/* ✅ FIXED: Navigate to Problems tab */}
                <button 
                    onClick={() => navigate("/", { state: { tab: "problems" } })} 
                    className="back-btn"
                >
                    ← Back to Problems
                </button>
                
                <span className="problem-title">
                    {problem?.title}
                    {user?.problemSolved?.some(p => (typeof p === "string" ? p : p._id) === problemId) && (
                        <span className="solved-check" title="Solved"> ✓</span>
                    )}
                </span>
                <span className={`difficulty-badge difficulty-${problem?.difficulty}`}>
                    {problem?.difficulty}
                </span>
            </nav>
            
            <div className="detail-content">
                {/* Left Panel: Tabs + Content */}
                <div className="description-panel">
                    {/* Tab Bar */}
                    <div className="problem-tabs">
                        <button
                            className={`problem-tab ${activeTab === "description" ? "active" : ""}`}
                            onClick={() => setActiveTab("description")}
                        >
                            <span className="tab-icon">📝</span> Description
                        </button>
                        <button
                            className={`problem-tab ${activeTab === "editorial" ? "active" : ""}`}
                            onClick={() => setActiveTab("editorial")}
                        >
                            <span className="tab-icon">📹</span> Editorial
                        </button>
                        <button
                            className={`problem-tab ${activeTab === "submissions" ? "active" : ""}`}
                            onClick={() => setActiveTab("submissions")}
                        >
                            <span className="tab-icon">📜</span> Submissions
                        </button>
                        <button
                            className={`problem-tab ${activeTab === "chatbot" ? "active" : ""}`}
                            onClick={() => setActiveTab("chatbot")}
                        >
                            <span className="tab-icon">💬</span> Chatbot
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="problem-tab-content">
                        {/* Description Tab */}
                        {activeTab === "description" && (
                            <div className="description-content">
                                <h1>{problem?.title}</h1>
                                
                                <div className="problem-stats">
                                    <span className={`difficulty-${problem?.difficulty}`}>
                                        {problem?.difficulty}
                                    </span>
                                </div>
                                
                                <div className="description-text">
                                    <p>{problem?.description}</p>
                                </div>
                                
                                {problem?.exampleTest?.length > 0 && (
                                    <div className="examples-section">
                                        <h3>Examples:</h3>
                                        {problem.exampleTest.map((example, index) => (
                                            <div key={index} className="example-box">
                                                <p><strong>Input:</strong> {example.input}</p>
                                                <p><strong>Output:</strong> {example.output}</p>
                                                {example.explanation && (
                                                    <p><strong>Explanation:</strong> {example.explanation}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {problem?.constraints && problem.constraints.length > 0 && (
                                    <div className="constraints-section">
                                        <h3>Constraints:</h3>
                                        <ul>
                                            {problem.constraints.map((constraint, index) => (
                                                <li key={index}>{constraint}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Editorial Tab */}
                        {activeTab === "editorial" && (
                            <div className="editorial-content">
                                <h1>📹 Editorial</h1>
                                <p className="editorial-subtitle">Watch the video explanation for this problem</p>
                                
                                {problem?.videoUrl ? (
                                    isDirectVideoUrl(problem.videoUrl) ? (
                                        <div className="video-container">
                                            <video
                                                className="editorial-video"
                                                src={problem.videoUrl}
                                                controls
                                                controlsList="nodownload"
                                                preload="metadata"
                                            />
                                        </div>
                                    ) : (
                                        <div className="video-container">
                                            <iframe
                                                className="editorial-video"
                                                src={getEmbedUrl(problem.videoUrl)}
                                                title="Editorial Video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )
                                ) : (
                                    <div className="video-placeholder">
                                        <div className="video-placeholder-icon">🎬</div>
                                        <h3>Video Not Available</h3>
                                        <p>No video has been uploaded for this problem yet. Please check back later.</p>
                                    </div>
                                )}
                                
                                <div className="editorial-notes">
                                    <h3>Additional Notes</h3>
                                    <ul>
                                        <li>Try to solve the problem yourself before watching the video.</li>
                                        <li>Focus on understanding the approach, not just the code.</li>
                                        <li>Practice similar problems to reinforce your understanding.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Submissions Tab */}
                        {activeTab === "submissions" && (
                            <SubmissionsTab problemId={problemId} />
                        )}

                        {/* Chatbot Tab */}
                        {activeTab === "chatbot" && (
                            <ChatbotTab
                                problemTitle={problem?.title}
                                problemDescription={problem?.description}
                            />
                        )}
                    </div>
                </div>
                
                {/* Right Panel: Code Editor */}
                <div className="editor-panel">
                    <div className="editor-toolbar">
                        <select 
                            value={language} 
                            onChange={handleLanguageChange}
                            className="language-select"
                        >
                            <option value="cpp">C++</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                        
                        <div className="action-buttons">
                            <button 
                                onClick={handleRun} 
                                disabled={isRunning}
                                className="run-btn"
                            >
                                {isRunning ? "Running..." : "▶ Run"}
                            </button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                                className="submit-btn"
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                    
                    <div className="editor-container">
                        <Editor
                            height="100%"
                            language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : language === "python" ? "python" : "java"}
                            value={code}
                            onChange={handleCodeChange}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                tabSize: 4,
                                formatOnPaste: true,
                                formatOnType: true,
                                suggest: {
                                    showKeywords: true,
                                    showSnippets: true,
                                },
                            }}
                        />
                    </div>
                    
                    <div className="output-panel">
                        <div className="output-header">
                            <span>Test Result</span>
                            <button onClick={() => setOutput("")} className="clear-btn">
                                Clear
                            </button>
                        </div>
                        <pre className={`output-content ${output.includes("🎉") ? "success" : output.includes("❌") ? "error" : ""}`}>
                            {output || "You must run your code first"}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProblemDetailPage;