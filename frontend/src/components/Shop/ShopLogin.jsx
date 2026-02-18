// Components/Shop/ShopLogin.jsx
import React, { useState, useEffect } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import styles from "../../styles/styles";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const ShopLogin = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [visible, setVisible] = useState(false)
    
    // Forgot password modal states
    const [openForgotModal, setOpenForgotModal] = useState(false)
    const [resetEmail, setResetEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [resetVisible, setResetVisible] = useState(false)
    const [confirmVisible, setConfirmVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resetStep, setResetStep] = useState(1) // 1: email, 2: new password
    const [resetToken, setResetToken] = useState("")

    // Check for token in URL on component mount
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = queryParams.get('token');
        const emailFromUrl = queryParams.get('email');
        
        if (tokenFromUrl) {
            console.log("✅ Token detected in URL");
            setResetToken(tokenFromUrl);
            if (emailFromUrl) {
                setResetEmail(emailFromUrl);
            }
            setResetStep(2);
            setOpenForgotModal(true);
            
            // Clean the URL by removing query parameters without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        await axios
            .post(
                `${server}/shop/login-shop`,
                {
                    email,
                    password,
                },
                { withCredentials: true }
            )
            .then((res) => {
                // Store the authentication token in localStorage
                if (res.data.token) {
                    localStorage.setItem('seller_token', res.data.token);
                    console.log('✅ Seller token stored:', res.data.token.substring(0, 20) + '...');
                }
                
                // Store seller information
                if (res.data.seller) {
                    localStorage.setItem('seller_info', JSON.stringify(res.data.seller));
                }
                
                toast.success("Login Success!");
                navigate("/dashboard");
                window.location.reload(true);
            })
            .catch((err) => {
                console.error('Login error:', err.response?.data);
                toast.error(err.response?.data?.message || "Login failed");
            });
    };

    // Handle forgot password - send reset email
    const handleForgotPassword = async () => {
        if (!resetEmail) {
            toast.error("Please enter your email address");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(
                `${server}/user/forgot-password`,
                { email: resetEmail },
                { withCredentials: true }
            );

            if (data.success) {
                toast.success("Password reset email sent! Please check your inbox.");
                // Keep modal open with instruction but don't change step
                // User needs to click link from email
                setTimeout(() => {
                    setOpenForgotModal(false);
                    setResetEmail("");
                }, 3000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    // Handle reset password - set new password
    const handleResetPassword = async () => {
        if (!resetToken) {
            toast.error("Reset token not found. Please use the link from your email.");
            return;
        }

        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            console.log("🔄 Resetting password with token");
            
            const { data } = await axios.put(
                `${server}/user/reset-password`,
                {
                    token: resetToken,
                    password: newPassword
                },
                { withCredentials: true }
            );

            if (data.success) {
                toast.success("Password reset successfully! You can now login with your new password.");
                setOpenForgotModal(false);
                // Reset all fields
                setResetEmail("");
                setNewPassword("");
                setConfirmPassword("");
                setResetToken("");
                setResetStep(1);
            }
        } catch (error) {
            console.error("Reset password error:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Login to your Shop
                </h2>
            </div>
            <div className='mt-8 sm:mx-auto sw:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
                    <form className='space-y-6' onSubmit={handleSubmit} >
                        {/* Email */}
                        <div>
                            <label htmlFor="email"
                                className='block text-sm font-medium text-gray-700'
                            >
                                Email address
                            </label>
                            <div className='mt-1'>
                                <input 
                                    type="email"
                                    name='email'
                                    autoComplete='email'
                                    required
                                    placeholder='Please enter valid email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                            </div>
                        </div>
                        {/* Password */}
                        <div>
                            <label htmlFor="password"
                                className='block text-sm font-medium text-gray-700'
                            >
                                password
                            </label>
                            <div className='mt-1 relative'>
                                <input 
                                    type={visible ? "text" : "password"}
                                    name='password'
                                    autoComplete='password'
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                                />
                                {visible ? (
                                    <AiOutlineEye
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(false)}
                                    />
                                ) : (
                                    <AiOutlineEyeInvisible
                                        className="absolute right-2 top-2 cursor-pointer"
                                        size={25}
                                        onClick={() => setVisible(true)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className={`${styles.noramlFlex} justify-between`}>
                            <div className={`${styles.noramlFlex}`}>
                                <input
                                    type="checkbox"
                                    name="remember-me"
                                    id="remember-me"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="remember-me"
                                    className="ml-2 block text-sm text-gray-900"
                                >
                                    Remember me
                                </label>
                            </div>
                            <div className='text-sm'>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetStep(1);
                                        setResetToken("");
                                        setOpenForgotModal(true);
                                    }}
                                    className="font-medium text-blue-600 hover:text-blue-500 bg-transparent border-none cursor-pointer"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        </div>
                        <div>
                            <button
                                type='submit'
                                className='group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                            >
                                Submit
                            </button>
                        </div>

                        <div className={`${styles.noramlFlex} w-full`} >
                            <h4>Not have any account</h4>
                            <Link to="/shop-create" className="text-blue-600 pl-2">
                                Sign Up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {openForgotModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {resetStep === 1 ? "Reset Password" : "Enter New Password"}
                            </h2>
                            <button 
                                onClick={() => {
                                    setOpenForgotModal(false);
                                    setResetStep(1);
                                    setResetEmail("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setResetToken("");
                                }} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <RxCross1 size={20} />
                            </button>
                        </div>

                        {resetStep === 1 ? (
                            // Step 1: Enter Email
                            <div>
                                <p className="text-gray-600 mb-4">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setOpenForgotModal(false);
                                            setResetStep(1);
                                            setResetEmail("");
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleForgotPassword}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? "Sending..." : "Send Reset Link"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Step 2: Enter New Password
                            <div>
                                <p className="text-gray-600 mb-4">
                                    Enter your new password below.
                                </p>
                                {resetEmail && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        Resetting password for: <span className="font-medium">{resetEmail}</span>
                                    </p>
                                )}
                                {resetToken && (
                                    <p className="text-xs text-green-600 mb-4">
                                        ✓ Reset link verified successfully
                                    </p>
                                )}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={resetVisible ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                                        />
                                        {resetVisible ? (
                                            <AiOutlineEye
                                                className="absolute right-3 top-2.5 cursor-pointer"
                                                size={20}
                                                onClick={() => setResetVisible(false)}
                                            />
                                        ) : (
                                            <AiOutlineEyeInvisible
                                                className="absolute right-3 top-2.5 cursor-pointer"
                                                size={20}
                                                onClick={() => setResetVisible(true)}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={confirmVisible ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                                        />
                                        {confirmVisible ? (
                                            <AiOutlineEye
                                                className="absolute right-3 top-2.5 cursor-pointer"
                                                size={20}
                                                onClick={() => setConfirmVisible(false)}
                                            />
                                        ) : (
                                            <AiOutlineEyeInvisible
                                                className="absolute right-3 top-2.5 cursor-pointer"
                                                size={20}
                                                onClick={() => setConfirmVisible(true)}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setResetStep(1);
                                            setNewPassword("");
                                            setConfirmPassword("");
                                            setResetToken("");
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShopLogin;