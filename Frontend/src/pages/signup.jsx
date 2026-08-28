import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import "../App.css";
import { registerUser, clearError } from "../authSlice";
import { useNavigate } from "react-router";

const userSchema = z.object({
    firstName: z.string().min(3, "First name should be at least 3 characters"),
    passWord: z.string().min(8, "Password must be at least 8 characters"),
    emailId: z.string().email("Please enter a valid email")
});

function SignUp() {
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

    const onSubmit = (data) => {
        dispatch(registerUser(data));
    };

    return (
        <div className="page-container">
            <form onSubmit={handleSubmit(onSubmit)} className="form-container">
                <h1>Create Account</h1>
                <p className="subtitle">Join LeetForces</p>

                <div className="input-group">
                    <input
                        {...register("firstName")}
                        placeholder="Enter Your Name"
                    />
                    {errors.firstName && (
                        <span>{errors.firstName.message}</span>
                    )}
                </div>

                <div className="input-group">
                    <input
                        {...register("emailId")}
                        placeholder="Email ID"
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
                    <span className="server-error">
                        {typeof error === "string" ? error : "Something went wrong. Try again."}
                    </span>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                </button>

                <p className="login-text">
                    Already have an account?
                    <a href="/login"> Login</a>
                </p>
            </form>
        </div>
    );
}

export default SignUp;