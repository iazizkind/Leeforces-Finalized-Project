import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import "../App.css";
import { loginUser, clearError } from "../authSlice";
import { useNavigate } from "react-router";

const userSchema = z.object({
    passWord: z.string().min(8, "Password must be at least 8 characters"),
    emailId: z.string().email("Please enter a valid email")
});

function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(userSchema)
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    const onSubmit = async (data) => {
        console.log("Submitting login data:", data);
        try {
            const result = await dispatch(loginUser(data)).unwrap();
            console.log("Login successful:", result);
            navigate("/");
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (
        <div className="page-container">
            <form onSubmit={handleSubmit(onSubmit)} className="form-container">
                <h1>Welcome Back</h1>
                <p className="subtitle">Login to LeetForces</p>

                <div className="input-group">
                    <input
                        {...register("emailId")}
                        placeholder="Email ID"
                        type="email"
                    />
                    {errors.emailId && (
                        <span>{errors.emailId.message}</span>
                    )}
                </div>

                <div className="input-group">
                    <input
                        {...register("passWord")}
                        type="password"
                        placeholder="Password"
                    />
                    {errors.passWord && (
                        <span>{errors.passWord.message}</span>
                    )}
                </div>

                {error && (
                    <div className="server-error" style={{ 
                        color: "#ff375f", 
                        fontSize: "13px", 
                        textAlign: "center",
                        background: "rgba(255,55,95,0.1)",
                        padding: "8px",
                        borderRadius: "6px",
                        width: "100%",
                        marginTop: "8px"
                    }}>
                        {typeof error === "string" ? error : "Invalid credentials. Please try again."}
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="login-text">
                    Don't have an account?
                    <a href="/signUp"> Sign Up</a>
                </p>
            </form>
        </div>
    );
}

export default Login;