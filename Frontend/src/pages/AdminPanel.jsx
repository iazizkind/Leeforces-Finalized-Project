// src/pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axios";
import { fetchProblems } from "../problemSlice";
import "../App.css";
import "../styles/AdminPanel.css";

const emptyForm = () => ({
    title: "",
    description: "",
    difficulty: "easy",
    tags: "array",
    videoUrl: "",  // ✅ Add videoUrl here
    exampleTest: [{ input: "", output: "", explanation: "" }],
    hiddenTest: [{ input: "", output: "" }],
    refrenceSolution: [{ language: "javascript", codeSolution: "" }]
});

function AdminPanel() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { list: problems, loading: problemsLoading } = useSelector((state) => state.problems);

    const [view, setView] = useState("manage"); // "manage" | "form"
    const [mode, setMode] = useState("create"); // "create" | "edit"
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm());

    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState(null);

    // ✅ Video upload state
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(null);

    // Guard: only admins get past this page
    useEffect(() => {
        if (!isAuthenticated || user?.role !== "admin") {
            navigate("/");
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        dispatch(fetchProblems());
    }, [dispatch]);

    const startCreate = () => {
        setMode("create");
        setEditingId(null);
        setFormData(emptyForm());
        setMessage(null);
        setView("form");
    };

    const startEdit = (problem) => {
        setMode("edit");
        setEditingId(problem._id);
        setFormData({
            title: problem.title || "",
            description: problem.description || "",
            difficulty: problem.difficulty || "easy",
            tags: problem.tags || "array",
            videoUrl: problem.videoUrl || "",  // ✅ Include videoUrl
            exampleTest: problem.exampleTest?.length
                ? problem.exampleTest.map((t) => ({ input: t.input, output: t.output, explanation: t.explanation || "" }))
                : [{ input: "", output: "", explanation: "" }],
            hiddenTest: problem.hiddenTest?.length
                ? problem.hiddenTest.map((t) => ({ input: t.input, output: t.output }))
                : [{ input: "", output: "" }],
            refrenceSolution: problem.refrenceSolution?.length
                ? problem.refrenceSolution.map((r) => ({ language: r.language, codeSolution: r.codeSolution }))
                : [{ language: "javascript", codeSolution: "" }]
        });
        setMessage(null);
        setView("form");
    };

    const cancelForm = () => {
        setView("manage");
        setMessage(null);
    };

    const updateListItem = (field, index, key, value) => {
        setFormData((prev) => {
            const list = [...prev[field]];
            list[index] = { ...list[index], [key]: value };
            return { ...prev, [field]: list };
        });
    };

    const addListItem = (field, blank) => {
        setFormData((prev) => ({ ...prev, [field]: [...prev[field], blank] }));
    };

    const removeListItem = (field, index) => {
        setFormData((prev) => {
            const list = prev[field].filter((_, i) => i !== index);
            return { ...prev, [field]: list.length ? list : prev[field] };
        });
    };

    // ✅ Handle local video file selection → upload to Cloudinary via backend
    const handleVideoFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("video/")) {
            setUploadError("Please select a valid video file.");
            e.target.value = "";
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            setUploadError("Video must be smaller than 100MB.");
            e.target.value = "";
            return;
        }

        setUploadError(null);
        setUploadingVideo(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            data.append("video", file);

            const response = await axiosClient.post("/problem/uploadVideo", data, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                }
            });

            setFormData((prev) => ({ ...prev, videoUrl: response.data.url }));
        } catch (err) {
            setUploadError(
                err.response?.data?.error || "Video upload failed. Please try again."
            );
        } finally {
            setUploadingVideo(false);
            e.target.value = ""; // allow re-selecting the same file later if needed
        }
    };

    const handleRemoveVideo = () => {
        setFormData((prev) => ({ ...prev, videoUrl: "" }));
        setUploadError(null);
        setUploadProgress(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            if (mode === "create") {
                await axiosClient.post("/problem/createProblem", formData);
                setMessage({ type: "success", text: "Problem created successfully." });
            } else {
                await axiosClient.put(`/problem/update/${editingId}`, formData);
                setMessage({ type: "success", text: "Problem updated successfully." });
            }
            await dispatch(fetchProblems());
            setView("manage");
        } catch (err) {
            const text =
                typeof err.response?.data === "string"
                    ? err.response.data
                    : "Something went wrong. Please check the form and try again.";
            setMessage({ type: "error", text });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (problem) => {
        const confirmed = window.confirm(`Delete "${problem.title}"? This can't be undone.`);
        if (!confirmed) return;

        setDeletingId(problem._id);
        try {
            await axiosClient.delete(`/problem/delete/${problem._id}`);
            await dispatch(fetchProblems());
        } catch (err) {
            alert("Failed to delete problem. It may have already been removed.");
        } finally {
            setDeletingId(null);
        }
    };

    if (!isAuthenticated || user?.role !== "admin") {
        return null;
    }

    return (
        <div className="app-shell">
            <nav className="navbar">
                <span className="navbar-logo">LeetForces</span>
                <div className="navbar-user">
                    <span className="navbar-username">Admin · {user?.firstName}</span>
                    <button className="logout-btn" onClick={() => navigate("/")}>
                        Back to Site
                    </button>
                </div>
            </nav>

            <div className="admin-page">
                <div className="admin-header">
                    <h1>Admin Panel</h1>
                    {view === "manage" && (
                        <button className="admin-primary-btn" onClick={startCreate}>
                            + New Problem
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`admin-message admin-message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {view === "manage" && (
                    <div className="admin-manage-list">
                        {problemsLoading && <p className="status-text">Loading problems...</p>}

                        {!problemsLoading && problems.length === 0 && (
                            <p className="status-text">No problems yet. Create your first one.</p>
                        )}

                        {problems.map((problem) => (
                            <div className="admin-problem-row" key={problem._id}>
                                <div className="admin-problem-info">
                                    <span className="admin-problem-title">{problem.title}</span>
                                    <span className={`difficulty-badge difficulty-${problem.difficulty}`}>
                                        {problem.difficulty}
                                    </span>
                                    <span className="tag-badge">{problem.tags}</span>
                                </div>
                                <div className="admin-problem-actions">
                                    <button className="admin-edit-btn" onClick={() => startEdit(problem)}>
                                        Edit
                                    </button>
                                    <button
                                        className="admin-delete-btn"
                                        onClick={() => handleDelete(problem)}
                                        disabled={deletingId === problem._id}
                                    >
                                        {deletingId === problem._id ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === "form" && (
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <h2>{mode === "create" ? "Create Problem" : `Edit: ${formData.title || "Untitled"}`}</h2>

                        <div className="admin-field">
                            <label>Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label>Description</label>
                            <textarea
                                rows={5}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        {/* ✅ EDITORIAL VIDEO — upload local file to Cloudinary */}
                        <div className="admin-field">
                            <label>Editorial Video</label>

                            {formData.videoUrl && (
                                <div className="admin-video-preview">
                                    <video
                                        src={formData.videoUrl}
                                        controls
                                        className="admin-video-preview-player"
                                    />
                                    <button
                                        type="button"
                                        className="admin-remove-btn"
                                        onClick={handleRemoveVideo}
                                        disabled={uploadingVideo}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {!formData.videoUrl && (
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoFileChange}
                                    disabled={uploadingVideo}
                                />
                            )}

                            {uploadingVideo && (
                                <small>Uploading... {uploadProgress}%</small>
                            )}

                            {uploadError && (
                                <small style={{ color: "var(--lc-hard)" }}>{uploadError}</small>
                            )}

                            <small>Upload a video file (max 100MB) — it will be hosted on Cloudinary.</small>
                        </div>

                        <div className="admin-field-row">
                            <div className="admin-field">
                                <label>Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div className="admin-field">
                                <label>Tag</label>
                                <select
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                >
                                    <option value="array">Array</option>
                                    <option value="string">String</option>
                                    <option value="dp">DP</option>
                                    <option value="tree">Tree</option>
                                </select>
                            </div>
                        </div>

                        {/* Example tests */}
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <label>Example Tests (visible to users)</label>
                                <button
                                    type="button"
                                    className="admin-add-btn"
                                    onClick={() =>
                                        addListItem("exampleTest", { input: "", output: "", explanation: "" })
                                    }
                                >
                                    + Add
                                </button>
                            </div>
                            {formData.exampleTest.map((test, i) => (
                                <div className="admin-list-item" key={i}>
                                    <input
                                        type="text"
                                        placeholder="Input"
                                        value={test.input}
                                        onChange={(e) => updateListItem("exampleTest", i, "input", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Output"
                                        value={test.output}
                                        onChange={(e) => updateListItem("exampleTest", i, "output", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Explanation"
                                        value={test.explanation}
                                        onChange={(e) => updateListItem("exampleTest", i, "explanation", e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="admin-remove-btn"
                                        onClick={() => removeListItem("exampleTest", i)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Hidden tests */}
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <label>Hidden Tests (used for grading Submit)</label>
                                <button
                                    type="button"
                                    className="admin-add-btn"
                                    onClick={() => addListItem("hiddenTest", { input: "", output: "" })}
                                >
                                    + Add
                                </button>
                            </div>
                            {formData.hiddenTest.map((test, i) => (
                                <div className="admin-list-item" key={i}>
                                    <input
                                        type="text"
                                        placeholder="Input"
                                        value={test.input}
                                        onChange={(e) => updateListItem("hiddenTest", i, "input", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Output"
                                        value={test.output}
                                        onChange={(e) => updateListItem("hiddenTest", i, "output", e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="admin-remove-btn"
                                        onClick={() => removeListItem("hiddenTest", i)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Reference solutions */}
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <label>Reference Solutions</label>
                                <button
                                    type="button"
                                    className="admin-add-btn"
                                    onClick={() =>
                                        addListItem("refrenceSolution", { language: "javascript", codeSolution: "" })
                                    }
                                >
                                    + Add
                                </button>
                            </div>
                            {formData.refrenceSolution.map((sol, i) => (
                                <div className="admin-solution-item" key={i}>
                                    <select
                                        value={sol.language}
                                        onChange={(e) => updateListItem("refrenceSolution", i, "language", e.target.value)}
                                    >
                                        <option value="javascript">JavaScript</option>
                                        <option value="java">Java</option>
                                        <option value="c++">C++</option>
                                        <option value="python">Python</option>
                                    </select>
                                    <textarea
                                        rows={4}
                                        placeholder="Reference solution code"
                                        value={sol.codeSolution}
                                        onChange={(e) =>
                                            updateListItem("refrenceSolution", i, "codeSolution", e.target.value)
                                        }
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="admin-remove-btn"
                                        onClick={() => removeListItem("refrenceSolution", i)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="admin-form-actions">
                            <button type="button" className="admin-cancel-btn" onClick={cancelForm}>
                                Cancel
                            </button>
                            <button type="submit" className="admin-primary-btn" disabled={submitting}>
                                {submitting
                                    ? mode === "create" ? "Creating..." : "Saving..."
                                    : mode === "create" ? "Create Problem" : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;