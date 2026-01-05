import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import { backend_url, server } from "../../server";
import styles from "../../styles/styles";
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";

const ShopInfo = ({ isOwner }) => {
    const [data, setData] = useState({});
    const { products } = useSelector((state) => state.products);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { id } = useParams();

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                setIsLoading(true);
                // Fetch shop products
                dispatch(getAllProductsShop(id));
                
                // Fetch shop info
                const response = await axios.get(`${server}/shop/get-shop-info/${id}`);
                setData(response.data.shop);
            } catch (error) {
                console.error("Error fetching shop data:", error);
                // Set fallback data
                setData({
                    name: "Shop Name",
                    description: "No description available",
                    address: "Address not available",
                    phoneNumber: "Phone number not available",
                    avatar: "",
                    createdAt: new Date().toISOString(),
                });
                
                if (error.response?.status === 404) {
                    toast.error("Shop not found");
                } else {
                    toast.error("Failed to load shop information");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchShopData();
    }, [dispatch, id]);

    const logoutHandler = async () => {
        try {
            // Show loading toast
            const toastId = toast.loading("Logging out...");
            
            // Clear all authentication cookies
            document.cookie.split(";").forEach((cookie) => {
                const cookieName = cookie.split("=")[0].trim();
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            
            // Try shop logout endpoint
            try {
                await axios.get(`${server}/shop/logout`, {
                    withCredentials: true,
                });
                console.log("Shop logout successful");
            } catch (shopError) {
                console.log("Shop logout failed, trying user logout:", shopError);
                
                // Try user logout as fallback
                try {
                    await axios.get(`${server}/user/logout`, {
                        withCredentials: true,
                    });
                    console.log("User logout successful");
                } catch (userError) {
                    console.log("User logout also failed:", userError);
                }
            }
            
            // Clear all local storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Update toast to success
            toast.update(toastId, {
                render: "Logged out successfully!",
                type: "success",
                isLoading: false,
                autoClose: 2000,
            });
            
            // Dispatch logout action to Redux (if you have it)
            // dispatch({ type: "LOGOUT_SUCCESS" });
            
            // Redirect to home page
            setTimeout(() => {
                navigate("/");
                // Force reload after navigation
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }, 1500);
            
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Logout failed. Clearing local data...");
            
            // Even if API fails, clear local data and redirect
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear cookies
            document.cookie.split(";").forEach((cookie) => {
                const cookieName = cookie.split("=")[0].trim();
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            
            // Redirect anyway
            setTimeout(() => {
                navigate("/");
                window.location.reload();
            }, 1000);
        }
    };

    // Calculate shop ratings safely
    const calculateRatings = () => {
        if (!products || products.length === 0) {
            return { averageRating: "0.0", totalReviews: 0 };
        }

        const totalReviewsLength = products.reduce((acc, product) => {
            return acc + (product.reviews?.length || 0);
        }, 0);

        const totalRatings = products.reduce((acc, product) => {
            if (!product.reviews) return acc;
            return acc + product.reviews.reduce((sum, review) => {
                return sum + (review?.rating || 0);
            }, 0);
        }, 0);

        const averageRating = totalReviewsLength > 0 
            ? (totalRatings / totalReviewsLength).toFixed(1)
            : "0.0";

        return { averageRating, totalReviews: totalReviewsLength };
    };

    const { averageRating, totalReviews } = calculateRatings();

    // Get safe image URL
    const getSafeImageUrl = (imagePath) => {
        if (!imagePath) {
            return "https://via.placeholder.com/150/10B981/FFFFFF?text=Shop";
        }
        
        if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) {
            return imagePath;
        }
        
        if (imagePath.startsWith('/')) {
            return imagePath;
        }
        
        return `${backend_url}${imagePath}`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return "Invalid Date";
        }
    };

    return (
        <>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader />
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Shop Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img
                                src={getSafeImageUrl(data?.avatar)}
                                alt={data?.name || "Shop"}
                                className="w-32 h-32 rounded-full border-4 border-green-100 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/150/10B981/FFFFFF?text=Shop";
                                }}
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {data?.name || "Shop Name"}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            {data?.description || "No description available"}
                        </p>
                    </div>

                    {/* Shop Details */}
                    <div className="space-y-6">
                        {/* Address */}
                        <div className="border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Address
                            </h3>
                            <p className="text-gray-800">
                                {data?.address || "Address not available"}
                            </p>
                        </div>

                        {/* Phone Number */}
                        <div className="border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Phone Number
                            </h3>
                            <p className="text-gray-800">
                                {data?.phoneNumber || "Phone number not available"}
                            </p>
                        </div>

                        {/* Total Products */}
                        <div className="border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Total Products
                            </h3>
                            <p className="text-gray-800 font-medium">
                                {products?.length || 0} products
                            </p>
                        </div>

                        {/* Shop Ratings */}
                        <div className="border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Shop Ratings
                            </h3>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                    <span className="text-2xl font-bold text-yellow-500">
                                        {averageRating}
                                    </span>
                                    <span className="text-gray-500 ml-1">/5</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-gray-600 ml-2">
                                        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Joined On */}
                        <div className="border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Joined On
                            </h3>
                            <p className="text-gray-800">
                                {formatDate(data?.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Owner Actions */}
                    {isOwner && (
                        <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                            <Link 
                                to="/settings" 
                                className="block"
                            >
                                <button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Shop
                                </button>
                            </Link>

                            <button
                                onClick={logoutHandler}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout from Shop
                            </button>
                            
                            {/* Emergency Logout Button */}
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to logout? This will clear all your data.")) {
                                        // Force clear everything
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        document.cookie.split(";").forEach((cookie) => {
                                            const cookieName = cookie.split("=")[0].trim();
                                            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                                        });
                                        window.location.href = "/login";
                                        window.location.reload();
                                    }
                                }}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                            >
                                Emergency Logout (Clear All)
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ShopInfo;