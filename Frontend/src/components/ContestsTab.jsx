// src/components/ContestsTab.jsx
import { useState, useEffect } from "react";
import axiosClient from "../utils/axios";
import "../styles/ContestsTab.css";

function ContestsTab() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axiosClient.get("/contest/upcoming");
            setContests(response.data);
        } catch (err) {
            setError("Failed to fetch contests.");
            console.error("Contests error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Format duration
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes} min`;
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Check if contest is starting soon (within next 24 hours)
    const isStartingSoon = (startTime) => {
        const diff = new Date(startTime) - new Date();
        return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };

    if (loading) {
        return <div className="contests-loading">Loading contests...</div>;
    }

    if (error) {
        return <div className="contests-error">{error}</div>;
    }

    if (contests.length === 0) {
        return <div className="contests-empty">No upcoming contests available.</div>;
    }

    return (
        <div className="contests-container">
            <div className="contests-header">
                <h2>Current or Upcoming Contests</h2>
                <p>Participate in contests hosted on Codeforces and LeetCode</p>
            </div>
            
            <div className="contests-table">
                <div className="contests-table-header">
                    <div>Contest</div>
                    <div>Platform</div>
                    <div>Start Time</div>
                    <div>Duration</div>
                    <div>Status</div>
                    <div>Action</div>
                </div>
                
                {contests.map((contest) => (
                    <div key={contest.id || contest.name} className="contest-row">
                        <div className="contest-name">
                            <a href={contest.url} target="_blank" rel="noopener noreferrer">
                                {contest.name}
                            </a>
                        </div>
                        <div className="contest-platform">
                            <span className={`platform-badge platform-${contest.platform.toLowerCase()}`}>
                                {contest.platform}
                            </span>
                        </div>
                        <div className="contest-time">
                            {formatDate(contest.startTime)}
                        </div>
                        <div className="contest-duration">
                            {formatDuration(contest.durationSeconds)}
                        </div>
                        <div className="contest-status">
                            {isStartingSoon(contest.startTime) ? (
                                <span className="status-badge status-soon">Starting Soon</span>
                            ) : (
                                <span className="status-badge status-upcoming">Upcoming</span>
                            )}
                        </div>
                        <div className="contest-action">
                            <a href={contest.url} target="_blank" rel="noopener noreferrer" className="register-btn">
                                Register →
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ContestsTab;