import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axios";
import "../styles/ProfilePage.css";

function ProfilePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    
    const [userRank, setUserRank] = useState(null);
    const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
    
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);
    
    // Fetch leaderboard data
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await axiosClient.get('/user/leaderboard');
                const leaderboard = response.data.leaderboard;
                setGlobalLeaderboard(leaderboard);
                
                const currentUserRank = leaderboard.find(u => u.userId === user?._id);
                if (currentUserRank) {
                    setUserRank(currentUserRank.rank);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            }
        };
        
        if (isAuthenticated) {
            fetchLeaderboard();
        }
    }, [isAuthenticated, user?._id]);
    
    // Dynamic stats
    const totalSolved = user?.problemSolved?.length || 0;
    
    // Difficulty breakdown
    const easySolved = Math.min(54, totalSolved);
    const mediumSolved = Math.min(139, Math.max(0, totalSolved - easySolved));
    const hardSolved = Math.min(24, Math.max(0, totalSolved - easySolved - mediumSolved));
    
    const totalEasy = 961;
    const totalMedium = 2105;
    const totalHard = 967;
    
    // Calculate contest rating
    const calculateContestRating = () => {
        const baseRating = 500;
        const ratingPerProblem = 20;
        return Math.min(3500, baseRating + (totalSolved * ratingPerProblem));
    };
    
    const contestRating = calculateContestRating();
    
    // Calculate global rank
    const calculateGlobalRanking = () => {
        if (userRank) return userRank;
        return globalLeaderboard.length + 1;
    };
    
    const globalRank = calculateGlobalRanking();
    const totalUsers = globalLeaderboard.length || 805991;
    
    // Calculate top percentage
    const calculateTopPercentage = () => {
        if (totalUsers === 0) return "100%";
        return ((globalRank / totalUsers) * 100).toFixed(2) + "%";
    };
    
    const topPercentage = calculateTopPercentage();
    
    // Get initials
    const getInitials = (name) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };
    
    if (!isAuthenticated) return null;
    
    return (
        <div className="leetcode-profile-page">
            <nav className="profile-navbar">
                <Link to="/" className="profile-logo">
                    <span className="profile-logo-icon">⬡</span>
                    <span>LeetForces</span>
                </Link>
                <div className="profile-nav-right">
                    <button onClick={() => navigate("/")} className="profile-back-btn">
                        ← Back to Problems
                    </button>
                </div>
            </nav>
            
            <div className="profile-main-container">
                {/* Left Sidebar */}
                <div className="profile-left-sidebar">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-container">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt="Profile" className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {getInitials(user?.firstName)}
                                </div>
                            )}
                        </div>
                        <h2 className="profile-name">
                            {user?.firstName} {user?.lastName || ""}
                        </h2>
                        <p className="profile-username">
                            @{user?.emailId?.split('@')[0] || "user"}
                        </p>
                        <div className="profile-rank">
                            <span className="rank-icon">🏆</span>
                            <span>Rank #{globalRank}</span>
                        </div>
                        <p className="profile-tagline">DEV || DSA</p>
                        <div className="profile-followers">
                            <span>0 Following</span>
                            <span>0 Followers</span>
                        </div>
                        <Link to="/profile/edit" className="edit-profile-btn">
                            Edit Profile
                        </Link>
                    </div>
                    
                    <div className="profile-details">
                        <div className="profile-detail-item">
                            <span className="detail-icon">🌐</span>
                            <span>{user?.location || "India"}</span>
                        </div>
                        <div className="profile-detail-item">
                            <span className="detail-icon">🎓</span>
                            <span>{user?.education || "Not specified"}</span>
                        </div>
                        <div className="profile-detail-item">
                            <span className="detail-icon">📧</span>
                            <span>{user?.emailId}</span>
                        </div>
                        <div className="profile-detail-item">
                            <span className="detail-icon">🔗</span>
                            <span>{user?.websites || "No website"}</span>
                        </div>
                        <div className="profile-skill-tags">
                            {user?.skills?.length > 0 ? (
                                user.skills.map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                ))
                            ) : (
                                <span className="skill-tag">No skills added</span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Main Content Area */}
                <div className="profile-main-content">
                    {/* Stats Overview Cards */}
                    <div className="profile-stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <span>Contest Rating</span>
                            </div>
                            <div className="stat-value-large">{contestRating}</div>
                            <div className="stat-detail">
                                Global Ranking: <span className="stat-highlight">#{globalRank}</span>
                            </div>
                            <div className="stat-detail">
                                Attended: <span className="stat-highlight">6</span>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <span>Top</span>
                            </div>
                            <div className="stat-value-large">{topPercentage}</div>
                            <div className="stat-detail">
                                Beat {topPercentage} of users
                            </div>
                        </div>
                    </div>
                    
                    {/* Problem Solving Chart */}
                    <div className="problem-solving-card">
                        <h3 className="card-title">Problem Solving</h3>
                        <div className="problem-solving-content">
                            <div className="solved-circle-container">
                                <div className="solved-circle">
                                    <div className="solved-number">{totalSolved}</div>
                                    <div className="solved-label">Solved</div>
                                </div>
                            </div>
                            <div className="difficulty-bars">
                                <div className="difficulty-bar-row">
                                    <span className="diff-label">Easy</span>
                                    <div className="diff-bar">
                                        <div className="diff-bar-fill easy-fill" style={{ width: `${(easySolved / totalEasy) * 100}%` }}></div>
                                    </div>
                                    <span className="diff-numbers">{easySolved}/{totalEasy}</span>
                                </div>
                                <div className="difficulty-bar-row">
                                    <span className="diff-label">Medium</span>
                                    <div className="diff-bar">
                                        <div className="diff-bar-fill medium-fill" style={{ width: `${(mediumSolved / totalMedium) * 100}%` }}></div>
                                    </div>
                                    <span className="diff-numbers">{mediumSolved}/{totalMedium}</span>
                                </div>
                                <div className="difficulty-bar-row">
                                    <span className="diff-label">Hard</span>
                                    <div className="diff-bar">
                                        <div className="diff-bar-fill hard-fill" style={{ width: `${(hardSolved / totalHard) * 100}%` }}></div>
                                    </div>
                                    <span className="diff-numbers">{hardSolved}/{totalHard}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="badges-card">
                        <h3 className="card-title">Badges</h3>
                        <div className="badges-count">4</div>
                        <div className="badges-icons">
                            <div className="badge-icon">🏅</div>
                            <div className="badge-icon">🥇</div>
                            <div className="badge-icon">🎖️</div>
                            <div className="badge-icon">🏆</div>
                        </div>
                        <div className="badge-description">
                            Most Recent Badge: <strong>50 Days Badge 2026</strong>
                        </div>
                    </div>
                    
                    {/* Community Stats */}
                    <div className="community-stats-card">
                        <h3 className="card-title">Community Stats</h3>
                        <div className="community-stats-list">
                            <div className="community-stat-item">
                                <span className="community-icon">👁️</span>
                                <div>
                                    <div>Views</div>
                                    <div className="community-count">0</div>
                                    <div className="community-week">Last week: 0</div>
                                </div>
                            </div>
                            <div className="community-stat-item">
                                <span className="community-icon">✅</span>
                                <div>
                                    <div>Solution</div>
                                    <div className="community-count">0</div>
                                    <div className="community-week">Last week: 0</div>
                                </div>
                            </div>
                            <div className="community-stat-item">
                                <span className="community-icon">💬</span>
                                <div>
                                    <div>Discuss</div>
                                    <div className="community-count">0</div>
                                    <div className="community-week">Last week: 0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;