// src/components/MainTabs.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../authSlice";
import { fetchProblems } from "../problemSlice";
import axiosClient from "../utils/axios";
import "../App.css";

// Calendar utilities
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

function MainTabs() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // ✅ Added useLocation
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { list: problems, loading: problemsLoading, error } = useSelector((state) => state.problems);
    
    const [activeTab, setActiveTab] = useState("home");
    const [statusFilter, setStatusFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    
    const [contests, setContests] = useState([]);
    const [contestsLoading, setContestsLoading] = useState(false);
    const [contestsError, setContestsError] = useState("");
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visitDates, setVisitDates] = useState(() => {
        const stored = localStorage.getItem('leetcode_visits');
        return stored ? JSON.parse(stored) : [];
    });

    // ✅ READ LOCATION STATE TO SET ACTIVE TAB
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            // Clear the state so it doesn't persist on refresh
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    useEffect(() => {
        dispatch(fetchProblems());
    }, [dispatch]);
    
    useEffect(() => {
        fetchContests();
    }, []);
    
    const fetchContests = async () => {
        setContestsLoading(true);
        setContestsError("");
        try {
            const response = await axiosClient.get("/contest/upcoming");
            setContests(response.data);
        } catch (err) {
            setContestsError("Failed to fetch contests.");
            console.error("Contests error:", err);
        } finally {
            setContestsLoading(false);
        }
    };
    
    useEffect(() => {
        const today = new Date().toDateString();
        if (!visitDates.includes(today)) {
            const newVisits = [...visitDates, today];
            setVisitDates(newVisits);
            localStorage.setItem('leetcode_visits', JSON.stringify(newVisits));
        }
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const solvedSet = useMemo(() => {
        const ids = user?.problemSolved || [];
        return new Set(ids.map((id) => (typeof id === "string" ? id : id._id)));
    }, [user]);
    
    const availableTags = useMemo(() => {
        const tags = problems.map((p) => p.tags).filter(Boolean);
        return [...new Set(tags)];
    }, [problems]);
    
    const filteredProblems = useMemo(() => {
        return problems.filter((problem) => {
            if (difficultyFilter !== "all" && problem.difficulty !== difficultyFilter) {
                return false;
            }
            if (tagFilter !== "all" && problem.tags !== tagFilter) {
                return false;
            }
            if (statusFilter === "solved" && !solvedSet.has(problem._id)) {
                return false;
            }
            if (statusFilter === "unsolved" && solvedSet.has(problem._id)) {
                return false;
            }
            return true;
        });
    }, [problems, statusFilter, difficultyFilter, tagFilter, solvedSet]);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const calculateStreak = () => {
        let streak = 0;
        const today = new Date();
        const visitSet = new Set(visitDates.map(d => new Date(d).toDateString()));
        
        if (visitSet.has(today.toDateString())) {
            streak++;
            for (let i = 1; i < 365; i++) {
                const prevDate = new Date(today);
                prevDate.setDate(today.getDate() - i);
                if (visitSet.has(prevDate.toDateString())) {
                    streak++;
                } else {
                    break;
                }
            }
        } else {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (visitSet.has(yesterday.toDateString())) {
                streak = 1;
                for (let i = 2; i < 365; i++) {
                    const prevDate = new Date(today);
                    prevDate.setDate(today.getDate() - i);
                    if (visitSet.has(prevDate.toDateString())) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }
        return streak;
    };
    
    const streak = calculateStreak();
    
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(new Date(year, month, day));
    }
    
    const isToday = (date) => {
        const today = new Date();
        return date && date.toDateString() === today.toDateString();
    };
    
    const isVisited = (date) => {
        return date && visitDates.some(v => new Date(v).toDateString() === date.toDateString());
    };
    
    const navigateMonth = (offset) => {
        const newDate = new Date(year, month + offset, 1);
        setCurrentDate(newDate);
    };
    
    const handleLogout = () => {
        dispatch(logoutUser());
        setShowDropdown(false);
        navigate("/");
    };
    
    const getInitials = (name) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };
    
    return (
        <div className="app-shell">
            <nav className="navbar">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">⬡</span>
                    <span>LeetForces</span>
                </Link>
                
                <div className="main-nav-tabs">
                    <button
                        className={`main-nav-tab ${activeTab === "home" ? "active" : ""}`}
                        onClick={() => setActiveTab("home")}
                    >
                        Home
                    </button>
                    <button
                        className={`main-nav-tab ${activeTab === "problems" ? "active" : ""}`}
                        onClick={() => setActiveTab("problems")}
                    >
                        Problems
                    </button>
                    <button
                        className={`main-nav-tab ${activeTab === "contests" ? "active" : ""}`}
                        onClick={() => setActiveTab("contests")}
                    >
                        Contests
                    </button>
                </div>
                
                {isAuthenticated ? (
                    <div className="navbar-user">
                        {user?.role === "admin" && (
                            <button onClick={() => navigate("/admin")} className="admin-panel-btn">
                                Admin Panel
                            </button>
                        )}
                        <div className="profile-dropdown-container" ref={dropdownRef}>
                            <button 
                                className="profile-icon"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                {getInitials(user?.firstName)}
                            </button>
                            
                            {showDropdown && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <div className="dropdown-avatar">
                                            {getInitials(user?.firstName)}
                                        </div>
                                        <div className="dropdown-user-info">
                                            <span className="dropdown-username">{user?.firstName}</span>
                                            <span className="dropdown-email">{user?.emailId}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="dropdown-divider"></div>
                                    
                                    <div className="dropdown-stats">
                                        <div className="dropdown-stat-item">
                                            <span className="dropdown-stat-value">{solvedSet.size}</span>
                                            <span className="dropdown-stat-label">Solved</span>
                                        </div>
                                        <div className="dropdown-stat-item">
                                            <span className="dropdown-stat-value">{streak}</span>
                                            <span className="dropdown-stat-label">Streak</span>
                                        </div>
                                        <div className="dropdown-stat-item">
                                            <span className="dropdown-stat-value">{visitDates.length}</span>
                                            <span className="dropdown-stat-label">Visits</span>
                                        </div>
                                    </div>
                                    
                                    <div className="dropdown-divider"></div>
                                    
                                    <div className="dropdown-menu-items">
                                        <Link to="/profile" className="dropdown-menu-item" onClick={() => setShowDropdown(false)}>
                                            <span>👤</span>
                                            <span>My Profile</span>
                                        </Link>
                                        <div className="dropdown-menu-item">
                                            <span>🏆</span>
                                            <span>My Progress</span>
                                        </div>
                                        <div className="dropdown-menu-item">
                                            <span>📊</span>
                                            <span>Statistics</span>
                                        </div>
                                        <div className="dropdown-menu-item">
                                            <span>⚙️</span>
                                            <span>Settings</span>
                                        </div>
                                    </div>
                                    
                                    <div className="dropdown-divider"></div>
                                    
                                    <button onClick={handleLogout} className="dropdown-logout-btn">
                                        <span>🚪</span>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="navbar-user">
                        <Link to="/login">Login</Link>
                        <Link to="/signUp">Sign Up</Link>
                    </div>
                )}
            </nav>
            
            <div className={activeTab === "home" ? "main-content-full" : "problems-page"}>
                <div className={activeTab === "home" ? "home-full-content" : "left-content"}>
                    {/* HOME TAB */}
                    {activeTab === "home" && (
                        <div className="home-tab-content">
                            <div className="home-hero">
                                <div className="hero-badge">
                                    <span className="hero-badge-dot"></span>
                                    <span>Welcome to LeetForces</span>
                                </div>
                                <h1 className="hero-title">
                                    Master Coding,<br />
                                    <span className="hero-highlight">One Problem at a Time</span>
                                </h1>
                                <p className="hero-subtitle">
                                    Practice coding problems, participate in contests, and track your progress.
                                    The ultimate platform for competitive programmers.
                                </p>
                                <div className="hero-actions">
                                    <button onClick={() => setActiveTab("problems")} className="hero-btn-primary">
                                        Start Solving Problems
                                        <span className="hero-btn-arrow">→</span>
                                    </button>
                                    <button onClick={() => setActiveTab("contests")} className="hero-btn-secondary">
                                        View Contests
                                    </button>
                                </div>
                                
                                <div className="hero-stats">
                                    <div className="hero-stat">
                                        <span className="hero-stat-value">{problems.length}</span>
                                        <span className="hero-stat-label">Total Problems</span>
                                    </div>
                                    <div className="hero-stat-divider"></div>
                                    <div className="hero-stat">
                                        <span className="hero-stat-value">{solvedSet.size}</span>
                                        <span className="hero-stat-label">Solved</span>
                                    </div>
                                    <div className="hero-stat-divider"></div>
                                    <div className="hero-stat">
                                        <span className="hero-stat-value">{streak}</span>
                                        <span className="hero-stat-label">Day Streak</span>
                                    </div>
                                    <div className="hero-stat-divider"></div>
                                    <div className="hero-stat">
                                        <span className="hero-stat-value">{visitDates.length}</span>
                                        <span className="hero-stat-label">Total Visits</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="home-recent-section">
                                <div className="section-header">
                                    <h2 className="section-title">Recent Problems</h2>
                                    <button 
                                        onClick={() => setActiveTab("problems")} 
                                        className="section-link"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="home-problems-grid">
                                    {problems.slice(0, 4).map(problem => (
                                        <Link to={`/problem/${problem._id}`} key={problem._id} className="home-problem-card">
                                            <div className="problem-card-header">
                                                <span className={`difficulty-dot difficulty-dot-${problem.difficulty}`}></span>
                                                <span className={`difficulty-text difficulty-text-${problem.difficulty}`}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="problem-card-title">{problem.title}</h3>
                                            <div className="problem-card-footer">
                                                <span className="problem-card-tag">{problem.tags}</span>
                                                <span className="problem-card-arrow">→</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="home-features">
                                <div className="feature-card">
                                    <div className="feature-icon">⚡</div>
                                    <h3 className="feature-title">Fast Practice</h3>
                                    <p className="feature-description">Solve problems quickly with our optimized editor</p>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-icon">🏆</div>
                                    <h3 className="feature-title">Real Contests</h3>
                                    <p className="feature-description">Participate in live contests from Codeforces and LeetCode</p>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-icon">📊</div>
                                    <h3 className="feature-title">Track Progress</h3>
                                    <p className="feature-description">Monitor your streak, solved problems, and rankings</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* PROBLEMS TAB */}
                    {activeTab === "problems" && (
                        <div className="problems-tab-content">
                            <div className="problems-page-header">
                                <h2>All Problems</h2>
                                <p>Solve these problems to improve your coding skills</p>
                            </div>
                            
                            <div className="filter-bar">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="all">All Problems</option>
                                    <option value="solved" disabled={!isAuthenticated}>Solved</option>
                                    <option value="unsolved" disabled={!isAuthenticated}>Unsolved</option>
                                </select>
                                <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
                                    <option value="all">All Difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                                    <option value="all">All Tags</option>
                                    {availableTags.map((tag) => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {problemsLoading && <p className="status-text">Loading problems...</p>}
                            {error && <p className="status-text error-text">{typeof error === "string" ? error : "Could not load problems."}</p>}
                            {!problemsLoading && !error && filteredProblems.length === 0 && (
                                <p className="status-text">No problems match these filters.</p>
                            )}
                            
                            {!problemsLoading && !error && filteredProblems.length > 0 && (
                                <div className="problem-table">
                                    <div className="problem-table-header">
                                        <div>Status</div>
                                        <div>Title</div>
                                        <div>Difficulty</div>
                                        <div>Tag</div>
                                        <div>Solved</div>
                                    </div>
                                    {filteredProblems.map((problem) => (
                                        <Link
                                            to={`/problem/${problem._id}`}
                                            key={problem._id}
                                            className="problem-row"
                                        >
                                            <div className="status-cell">
                                                {solvedSet.has(problem._id) ? (
                                                    <span className="solved-check">✓</span>
                                                ) : (
                                                    <span className="unsolved-circle"></span>
                                                )}
                                            </div>
                                            <div className="title-cell">{problem.title}</div>
                                            <div className={`difficulty-cell difficulty-${problem.difficulty}`}>
                                                {problem.difficulty}
                                            </div>
                                            <div className="tag-cell">
                                                <span className="tag-badge">{problem.tags}</span>
                                            </div>
                                            <div className="acceptance-cell">
                                                {solvedSet.has(problem._id) ? "✓ Solved" : "—"}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* CONTESTS TAB */}
                    {activeTab === "contests" && (
                        <div className="contests-tab-content">
                            <h2>Upcoming Contests</h2>
                            <p className="contests-subtitle">Participate in contests on Codeforces and LeetCode</p>
                            
                            {contestsLoading && <p className="status-text">Loading contests...</p>}
                            {contestsError && <p className="status-text error-text">{contestsError}</p>}
                            
                            {!contestsLoading && contests.length === 0 && (
                                <p className="status-text">No upcoming contests available right now.</p>
                            )}
                            
                            {!contestsLoading && contests.length > 0 && (
                                <div className="contests-list">
                                    {contests.map((contest, index) => (
                                        <a
                                            href={contest.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            key={index}
                                            className="contest-card"
                                        >
                                            <div className="contest-platform">
                                                <span className={`contest-platform-badge contest-platform-${contest.platform.toLowerCase()}`}>
                                                    {contest.platform}
                                                </span>
                                            </div>
                                            <div className="contest-info">
                                                <h3 className="contest-name">{contest.name}</h3>
                                                <p className="contest-time">
                                                    {new Date(contest.startTime).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="contest-action">
                                                <span className="contest-join-btn">Join Contest →</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Right Sidebar - Calendar */}
                {activeTab !== "home" && (
                    <div className="right-sidebar">
                        <div className="calendar-card">
                            <div className="calendar-header">
                                <h3>{monthNames[month]} {year}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => navigateMonth(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--lc-text-dim)', cursor: 'pointer', fontSize: '16px' }}>←</button>
                                    <button onClick={() => navigateMonth(1)} style={{ background: 'transparent', border: 'none', color: 'var(--lc-text-dim)', cursor: 'pointer', fontSize: '16px' }}>→</button>
                                </div>
                            </div>
                            
                            <div className="streak-info">
                                <div className="streak-item">
                                    <div className="streak-value">{isAuthenticated ? streak : 0}</div>
                                    <div className="streak-label">Day Streak</div>
                                </div>
                                <div className="streak-item">
                                    <div className="streak-value">{isAuthenticated ? visitDates.length : 0}</div>
                                    <div className="streak-label">Total Visits</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                                {dayNames.map((day, i) => (
                                    <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--lc-text-dim)', fontWeight: '600' }}>
                                        {day}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="calendar-grid">
                                {calendarDays.map((date, index) => {
                                    if (!date) {
                                        return <div key={index} className="calendar-day empty"></div>;
                                    }
                                    const classes = [
                                        'calendar-day',
                                        isToday(date) ? 'today' : '',
                                        isVisited(date) ? 'visited' : ''
                                    ].filter(Boolean).join(' ');
                                    
                                    return (
                                        <div key={index} className={classes}>
                                            {date.getDate()}
                                        </div>
                                    );
                                })} 
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainTabs;