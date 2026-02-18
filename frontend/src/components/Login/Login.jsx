import React, { useState, useEffect } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import axios from "axios";
import { toast } from "react-toastify";
import { server } from "../../server";
import { loginUser, loginSeller } from "../../redux/actions/user";

const Login = () => {
    // State
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [uiState, setUiState] = useState({
        isPasswordVisible: false,
        isLoading: false,
        rememberMe: false
    });
    
    // Hooks
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = () => {
        setUiState(prev => ({ ...prev, isPasswordVisible: !prev.isPasswordVisible }));
    };

    const toggleRememberMe = () => {
        setUiState(prev => ({ ...prev, rememberMe: !prev.rememberMe }));
    };

    const handleRememberEmail = () => {
        if (uiState.rememberMe) {
            localStorage.setItem("rememberedEmail", formData.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }
    };

    const redirectBasedOnRole = (role) => {
        const routes = {
            'admin': '/admin/dashboard',
            'seller': '/dashboard',
            'user': '/'
        };
        
        setTimeout(() => navigate(routes[role] || '/'), 50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { email, password } = formData;
        const { isLoading } = uiState;

        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        if (isLoading) return;

        setUiState(prev => ({ ...prev, isLoading: true }));

        try {
            console.log("🔐 Attempting login with email:", email);
            
            // Try user login first (includes admin)
            const userResult = await dispatch(loginUser(email, password));
            
            if (userResult?.success) {
                const userRole = userResult.data?.role || 'user';
                console.log("✅ User login successful, role:", userRole);
                
                const completeUserData = {
                    ...userResult.data,
                    role: userRole,
                    isAuthenticated: true,
                    isAdmin: userRole === 'admin',
                    isSeller: userRole === 'seller',
                    isUser: userRole === 'user'
                };

                localStorage.setItem("user", JSON.stringify(completeUserData));
                localStorage.setItem("userRole", userRole);
                localStorage.setItem("isAuthenticated", "true");
                
                if (userResult.data?.token) {
                    localStorage.setItem("token", userResult.data.token);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${userResult.data.token}`;
                }
                
                handleRememberEmail();
                toast.success(`🎉 Login Successful! Welcome ${userRole}`);
                redirectBasedOnRole(userRole);
                return;
            }
            
            // If user login fails, try seller login
            console.log("User login failed, trying seller login...");
            const sellerResult = await dispatch(loginSeller(email, password));
            
            if (sellerResult?.success) {
                console.log("✅ Seller login successful");
                
                const completeSellerData = {
                    ...sellerResult.data,
                    role: 'seller',
                    isAuthenticated: true,
                    isSeller: true
                };

                localStorage.setItem("user", JSON.stringify(completeSellerData));
                localStorage.setItem("userRole", 'seller');
                localStorage.setItem("isAuthenticated", "true");
                
                if (sellerResult.data?.token) {
                    localStorage.setItem("token", sellerResult.data.token);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${sellerResult.data.token}`;
                }
                
                handleRememberEmail();
                toast.success("🎉 Seller Login Successful!");
                redirectBasedOnRole('seller');
                return;
            }
            
            // Both logins failed
            throw new Error("Invalid email or password");

        } catch (error) {
            console.error("❌ Login error:", error);
            const errorMessage = error.message || "Login failed. Please check your credentials.";
            toast.error(errorMessage);
            dispatch({ type: "UserLoginFail", payload: errorMessage });
        } finally {
            setUiState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Effects
    useEffect(() => {
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        if (rememberedEmail) {
            setFormData(prev => ({ ...prev, email: rememberedEmail }));
            setUiState(prev => ({ ...prev, rememberMe: true }));
        }
    }, []);

    return (
        <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Login to your account
                </h2>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
                    <form className='space-y-6' onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className='block text-sm font-medium text-gray-700'>
                                Email address
                            </label>
                            <div className='mt-1'>
                                <input 
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    required
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={uiState.isLoading}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100'
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className='block text-sm font-medium text-gray-700'>
                                Password
                            </label>
                            <div className='mt-1 relative'>
                                <input 
                                    type={uiState.isPasswordVisible ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={uiState.isLoading}
                                    className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 pr-10'
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    disabled={uiState.isLoading}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={uiState.isPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {uiState.isPasswordVisible ? (
                                        <AiOutlineEyeInvisible className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <AiOutlineEye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center'>
                                <input
                                    type="checkbox"
                                    id="remember-me"
                                    checked={uiState.rememberMe}
                                    onChange={toggleRememberMe}
                                    disabled={uiState.isLoading}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>
                            <div className='text-sm'>
                                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type='submit'
                                disabled={uiState.isLoading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ${
                                    uiState.isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {uiState.isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : 'Login'}
                            </button>
                        </div>

                        {/* Registration Links */}
                        <div className="space-y-3">
                            <div className='text-center'>
                                <span className="text-sm text-gray-600">Don't have an account?</span>
                                <Link to="/sign-up" className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                                    Sign Up
                                </Link>
                            </div>
                            
                            <div className='text-center'>
                                <span className="text-sm text-gray-600">Are you a seller?</span>
                                <Link to="/shop-create" className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                                    Create Shop Account
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;