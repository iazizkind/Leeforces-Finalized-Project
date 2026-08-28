import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../utils/axios";
import { checkAuth } from "../authSlice";
import "../styles/EditProfilePage.css";

function EditProfilePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        emailId: user?.emailId || "",
        age: user?.age || "",
        gender: user?.gender || "",
        location: user?.location || "",
        birthday: user?.birthday ? user.birthday.split('T')[0] : "",
        websites: user?.websites || "",
        education: user?.education || "",
        skills: Array.isArray(user?.skills) ? user.skills.join(", ") : (user?.skills || "")
    });
    
    const [profilePic, setProfilePic] = useState(user?.profilePic || "");
    const [previewPic, setPreviewPic] = useState(user?.profilePic || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewPic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        
        try {
            const formDataObj = new FormData();
            formDataObj.append('firstName', formData.firstName);
            formDataObj.append('lastName', formData.lastName);
            if (formData.age) formDataObj.append('age', formData.age);
            if (formData.gender) formDataObj.append('gender', formData.gender);
            if (formData.location) formDataObj.append('location', formData.location);
            if (formData.birthday) formDataObj.append('birthday', formData.birthday);
            if (formData.websites) formDataObj.append('websites', formData.websites);
            if (formData.education) formDataObj.append('education', formData.education);
            if (formData.skills) formDataObj.append('skills', formData.skills);
            
            if (fileInputRef.current?.files[0]) {
                formDataObj.append('profilePic', fileInputRef.current.files[0]);
            }
            
            const response = await axiosClient.put('/user/update', formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            await dispatch(checkAuth());
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            setTimeout(() => navigate("/profile"), 1500);
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data || 'Failed to update profile' 
            });
        } finally {
            setLoading(false);
        }
    };
    
    if (!isAuthenticated) return null;
    
    return (
        <div className="edit-profile-page">
            <nav className="edit-profile-navbar">
                <div className="edit-profile-nav-left">
                    <span className="edit-profile-logo">⬡ LeetForces</span>
                </div>
                <div className="edit-profile-nav-right">
                    <button onClick={() => navigate("/profile")} className="edit-profile-back-btn">
                        ← Back to Profile
                    </button>
                </div>
            </nav>
            
            <div className="edit-profile-container">
                <div className="edit-profile-header">
                    <h1>Settings</h1>
                    <p className="edit-profile-subtitle">Manage your basic profile information.</p>
                </div>
                
                {message && (
                    <div className={`edit-profile-message edit-profile-message-${message.type}`}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="edit-profile-form">
                    <div className="edit-profile-photo-section">
                        <div className="edit-profile-photo-container">
                            {previewPic ? (
                                <img src={previewPic} alt="Profile" className="edit-profile-photo" />
                            ) : (
                                <div className="edit-profile-photo-placeholder">
                                    {formData.firstName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                        <div className="edit-profile-photo-actions">
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="edit-profile-upload-btn"
                            >
                                📷 Upload Photo
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            {previewPic && (
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setPreviewPic("");
                                        setProfilePic("");
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="edit-profile-remove-btn"
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="edit-profile-section">
                        <h2 className="edit-profile-section-title">General</h2>
                        <p className="edit-profile-section-desc">Manage your basic profile information.</p>
                        
                        <div className="edit-profile-form-row">
                            <div className="edit-profile-field">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="edit-profile-field">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        
                        <div className="edit-profile-form-row">
                            <div className="edit-profile-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.emailId}
                                    disabled
                                    className="edit-profile-disabled-input"
                                />
                                <small>Email cannot be changed</small>
                            </div>
                            <div className="edit-profile-field">
                                <label>Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    min={6}
                                    max={100}
                                />
                            </div>
                        </div>
                        
                        <div className="edit-profile-form-row">
                            <div className="edit-profile-field">
                                <label>Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="edit-profile-field">
                                <label>Birthday</label>
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="edit-profile-section">
                        <h2 className="edit-profile-section-title">Location</h2>
                        <p className="edit-profile-section-desc">Tell us where you are based.</p>
                        
                        <div className="edit-profile-field">
                            <label>Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., India, Assam, Silchar"
                            />
                        </div>
                    </div>
                    
                    <div className="edit-profile-section">
                        <h2 className="edit-profile-section-title">Education</h2>
                        <p className="edit-profile-section-desc">Tell us about your education.</p>
                        
                        <div className="edit-profile-field">
                            <label>School/University</label>
                            <input
                                type="text"
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                placeholder="e.g., National Institute of Technology, Silchar"
                            />
                        </div>
                    </div>
                    
                    <div className="edit-profile-section">
                        <h2 className="edit-profile-section-title">Websites</h2>
                        <p className="edit-profile-section-desc">Add links to your websites.</p>
                        
                        <div className="edit-profile-field">
                            <label>Website URL</label>
                            <input
                                type="text"
                                name="websites"
                                value={formData.websites}
                                onChange={handleChange}
                                placeholder="e.g., https://your-website.com"
                            />
                        </div>
                    </div>
                    
                    <div className="edit-profile-section">
                        <h2 className="edit-profile-section-title">Skills</h2>
                        <p className="edit-profile-section-desc">Add your technical skills (comma separated).</p>
                        
                        <div className="edit-profile-field">
                            <label>Skills</label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="e.g., C++, Python, JavaScript, HTML"
                            />
                        </div>
                    </div>
                    
                    <div className="edit-profile-actions">
                        <button 
                            type="button" 
                            onClick={() => navigate("/profile")}
                            className="edit-profile-cancel-btn"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="edit-profile-save-btn"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfilePage;