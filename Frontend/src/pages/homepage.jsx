import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { logoutUser } from "../authSlice";
import { fetchProblems } from "../problemSlice";
import "../App.css";

// Calendar utilities
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

function HomePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user, loading: authLoading } = useSelector((state) => state.auth);
    const { list: problems, loading: problemsLoading, error } = useSelector((state) => state.problems);

    const [statusFilter, setStatusFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");

    // Dropdown state
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visitDates, setVisitDates] = useState(() => {
        const stored = localStorage.getItem('leetcode_visits');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        dispatch(fetchProblems());
    }, [dispatch]);

    // Track daily visits
    useEffect(() => {
        const today = new Date().toDateString();
        if (!visitDates.includes(today)) {
            const newVisits = [...visitDates, today];
            setVisitDates(newVisits);
            localStorage.setItem('leetcode_visits', JSON.stringify(newVisits));
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
        setShowDropdown(false);
        navigate("/");
    };

    // Set of solved problem IDs
    const solvedSet = useMemo(() => {
        const ids = user?.problemSolved || [];
        return new Set(ids.map((id) => (typeof id === "string" ? id : id._id)));
    }, [user]);

    // Unique tags
    const availableTags = useMemo(() => {
        const tags = problems.map((p) => p.tags).filter(Boolean);
        return [...new Set(tags)];
    }, [problems]);

    // Filtered problems
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

    // Calculate stats
    const totalSolved = solvedSet.size;
    const totalProblems = problems.length;
    const totalEasy = problems.filter(p => p.difficulty === "easy").length;
    const totalMedium = problems.filter(p => p.difficulty === "medium").length;
    const totalHard = problems.filter(p => p.difficulty === "hard").length;
    
    const solvedEasy = problems.filter(p => p.difficulty === "easy" && solvedSet.has(p._id)).length;
    const solvedMedium = problems.filter(p => p.difficulty === "medium" && solvedSet.has(p._id)).length;
    const solvedHard = problems.filter(p => p.difficulty === "hard" && solvedSet.has(p._id)).length;

    // Calendar calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Calculate streak
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

    // Generate calendar days
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

    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return "U";
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="app-shell">
            <nav className="navbar">
                {/* ✅ Clickable Logo that navigates to home */}
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">⬡</span>
                    <span>LeetForces</span>
                </Link>
                
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
                                            <span className="dropdown-stat-value">{totalSolved}</span>
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
                                        {/* ✅ Profile Link */}
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

            <div className="problems-page">
                {/* Left Content */}
                <div className="left-content">
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

                {/* Right Sidebar - Only Calendar */}
                {isAuthenticated && (
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
                                    <div className="streak-value">{streak}</div>
                                    <div className="streak-label">Day Streak</div>
                                </div>
                                <div className="streak-item">
                                    <div className="streak-value">{visitDates.length}</div>
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
                                        isVisited(date) ? 'visited' : '',
                                        isToday(date) && isVisited(date) ? 'current-streak' : ''
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

export default HomePage;