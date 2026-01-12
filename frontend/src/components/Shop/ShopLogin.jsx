// ShopLogin.jsx - COMPLETE FIXED VERSION
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";
import { loginSeller } from "../../redux/actions/user";
import { useDispatch } from "react-redux";
import { apiUrl } from "../../server"; // IMPORTANT: Import apiUrl

const ShopLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill all fields!");
      return;
    }
    
    setLoading(true);
    console.log("🔄 Logging in as seller...");
    console.log("📧 Email:", email);
    
    try {
      // OLD: Direct axios call with wrong endpoint ❌
      // NEW: Use dispatch with loginSeller action ✅
      const result = await dispatch(loginSeller(email, password));
      
      console.log("📋 Login result:", result);
      
      if (result.success) {
        toast.success("Login successful!");
        console.log("✅ Seller logged in:", result.seller?.name);
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        toast.error(result.error || "Login failed!");
        console.error("❌ Login failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Login to your Shop
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage your products and orders
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={visible ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={loading}
                />
                {visible ? (
                  <AiOutlineEye
                    className="absolute right-2 top-2 cursor-pointer text-gray-500"
                    size={25}
                    onClick={() => setVisible(false)}
                  />
                ) : (
                  <AiOutlineEyeInvisible
                    className="absolute right-2 top-2 cursor-pointer text-gray-500"
                    size={25}
                    onClick={() => setVisible(true)}
                  />
                )}
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/shop-forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have a shop?{" "}
                <Link
                  to="/shop-create"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create a shop
                </Link>
              </p>
            </div>

            {/* Debug Info (Only in development) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium text-yellow-800">Debug Info:</p>
                <p className="text-yellow-700">API Endpoint: {apiUrl("/shop/login-shop")}</p>
                <p className="text-yellow-700">Backend: http://localhost:5000</p>
                <button
                  type="button"
                  onClick={() => {
                    console.log("🧪 Testing login endpoint...");
                    fetch(apiUrl("/shop/login-shop"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: "test@test.com", password: "test123" }),
                      credentials: "include",
                    })
                      .then((res) => {
                        console.log("Response status:", res.status);
                        return res.json();
                      })
                      .then((data) => console.log("Response data:", data))
                      .catch((err) => console.error("Fetch error:", err));
                  }}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                >
                  Test API
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopLogin;