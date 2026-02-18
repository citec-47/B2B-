import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { getAllProductsShop } from "../../redux/actions/product";
import { backend_url, server } from "../../server";
import styles from "../../styles/styles";
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";
import { RxCross1 } from "react-icons/rx";

const ShopInfo = ({ isOwner }) => {
    const [data, setData] = useState({});
    const { products } = useSelector((state) => state.products);
    const { seller } = useSelector((state) => state.seller); // Get seller from Redux
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const navigate = useNavigate(); // Added for navigation

    const { id } = useParams();
    const dispatch = useDispatch();

    // Function to get correct image URL
    const getImageUrl = (image) => {
        if (!image) {
            return "https://via.placeholder.com/150x150?text=No+Shop+Image";
        }
        
        if (typeof image === 'string') {
            if (image.startsWith("http")) return image;
            
            if (!image.includes('/')) {
                return `${backend_url}/uploads/${image}`;
            }
            
            if (image.includes('uploads/')) {
                return `${backend_url}/${image}`;
            }
            
            return `${backend_url}/uploads/${image}`;
        }
        
        return "https://via.placeholder.com/150x150?text=Image+Error";
    };

    // Load shop data
    useEffect(() => {
        dispatch(getAllProductsShop(id));
        setIsLoading(true);
        axios.get(`${server}/shop/get-shop-info/${id}`).then((res) => {
            console.log("Shop info response:", res.data.shop);
            setData(res.data.shop);
            setIsLoading(false);
        }).catch((error) => {
            console.log("Error fetching shop info:", error);
            setIsLoading(false);
        });
    }, [id, dispatch]);

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            
            setSelectedImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle image upload
    const handleImageUpload = async () => {
        if (!selectedImage) {
            toast.error("Please select an image first");
            return;
        }

        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', selectedImage); // Changed from 'avatar' to 'file'
        formData.append('shopId', seller?._id || data?._id || id); // Add shop ID
        
        console.log("Uploading image for shop ID:", seller?._id || data?._id || id);
        console.log("Form data keys:", Array.from(formData.keys()));
        
        try {
            // IMPORTANT CHANGE: Use the correct endpoint for shop owners
            // The endpoint without /:id is for shop owners to update their own shop
            const response = await axios.put(
                `${server}/shop/update-shop`, // Removed the /:id from URL
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }
            );
            
            if (response.data.success) {
                toast.success("Shop picture updated successfully!");
                setData(response.data.shop || response.data.seller);
                // Also update the seller in Redux if available
                if (seller) {
                    // You might want to dispatch an action to update seller in Redux
                }
                setSelectedImage(null);
                setImagePreview(null);
                setShowUploadModal(false);
                
                // Refresh the page to show updated image
                window.location.reload();
            } else {
                toast.error(response.data.message || "Failed to update picture");
            }
        } catch (error) {
            console.error("Upload error:", error);
            console.error("Error response:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle image error
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = "https://via.placeholder.com/150x150?text=Shop";
    };

    // Logout handler - FIXED
    const logoutHandler = async () => {
        try {
            // Use the correct logout endpoint
            const response = await axios.get(`${server}/user/logout`, { // Changed from /shop/logout to /user/logout
                withCredentials: true,
            });
            
            if (response.data.success) {
                toast.success("Logged out successfully!");
                
                // Clear local storage if needed
                localStorage.removeItem('sellerInfo');
                localStorage.removeItem('userInfo');
                localStorage.removeItem('sellerToken');
                localStorage.removeItem('userToken');
                
                // Clear session storage
                sessionStorage.clear();
                
                // Navigate to home page
                navigate("/");
                
                // Wait a moment then reload
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                toast.error("Logout failed");
            }
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(error.response?.data?.message || "Logout failed. Please try again.");
            
            // Try alternative: manually clear cookies and redirect
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // Navigate to home page anyway
            navigate("/");
            window.location.reload();
        }
    };

    // Calculations
    const totalReviewsLength = products && products.reduce((acc, product) => acc + product.reviews.length, 0);
    const totalRatings = products && products.reduce((acc, product) => acc + product.reviews.reduce((sum, review) => sum + review.rating, 0), 0);
    const averageRating = totalRatings / totalReviewsLength || 0;

    return (
        <>
            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Update Shop Picture</h3>
                            <button 
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <RxCross1 size={24} />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block mb-2 font-medium">Select Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="w-full p-2 border rounded"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Accepted formats: JPEG, PNG, WebP (Max 5MB)
                            </p>
                        </div>
                        
                        {imagePreview && (
                            <div className="mb-4">
                                <p className="mb-2 font-medium">Preview:</p>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-full mx-auto"
                                />
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleImageUpload}
                                disabled={isUploading || !selectedImage}
                                className={`${styles.button} flex-1 ${
                                    (isUploading || !selectedImage) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isUploading ? "Uploading..." : "Upload Picture"}
                            </button>
                            
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedImage(null);
                                    setImagePreview(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <Loader />
            ) : (
                <div className="relative">
                    {/* Shop Picture Section */}
                    <div className="w-full py-5">
                        <div className="w-full flex flex-col items-center justify-center">
                            {/* Shop Avatar with Upload Overlay */}
                            <div className="relative group">
                                <img
                                    src={getImageUrl(data?.avatar || seller?.avatar)}
                                    onError={handleImageError}
                                    alt={data?.name || seller?.name || "Shop"}
                                    className="w-[150px] h-[150px] object-cover rounded-full border-4 border-white shadow-lg"
                                />
                                
                                {/* Upload Overlay (only for owner) */}
                                {isOwner && (
                                    <>
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center"
                                            onClick={() => setShowUploadModal(true)}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center p-2">
                                                <div className="bg-blue-600 rounded-full p-2 inline-block">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    </svg>
                                                </div>
                                                <p className="text-sm mt-1">Change Picture</p>
                                            </div>
                                        </div>
                                        
                                        {/* Edit Icon (always visible on mobile) */}
                                        <div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 cursor-pointer md:hidden"
                                            onClick={() => setShowUploadModal(true)}
                                        >
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                            </svg>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <h3 className="text-center py-2 text-[20px] font-bold mt-3">{data?.name || seller?.name}</h3>
                            <p className="text-[16px] text-[#000000a6] p-[10px] text-center">
                                {data?.description || seller?.description}
                            </p>
                        </div>
                    </div>

                    {/* Shop Information */}
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-[600] text-gray-700">Address</h5>
                            <h4 className="text-[#000000a6]">{data?.address || seller?.address || "No address provided"}</h4>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-[600] text-gray-700">Phone Number</h5>
                            <h4 className="text-[#000000a6]">{data?.phoneNumber || seller?.phoneNumber || "No phone number"}</h4>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-[600] text-gray-700">Total Products</h5>
                            <h4 className="text-[#000000a6]">{products && products.length}</h4>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-[600] text-gray-700">Shop Ratings</h5>
                            <h4 className="text-[#000000b0]">
                                {averageRating > 0 ? (
                                    <div className="flex items-center">
                                        <span className="mr-2">{averageRating.toFixed(1)}/5</span>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-4 h-4 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                ) : "No ratings yet"}
                            </h4>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-[600] text-gray-700">Joined On</h5>
                            <h4 className="text-[#000000b0]">
                                {data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : 
                                 seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : "N/A"}
                            </h4>
                        </div>
                    </div>

                    {/* Owner Actions */}
                    {isOwner && (
                        <div className="py-6 px-4 space-y-3">
                            <Link to="/settings">
                                <div className={`${styles.button} !w-full !h-[42px] !rounded-[5px]`}>
                                    <span className="text-white">Edit Shop Details</span>
                                </div>
                            </Link>

                            <button
                                className={`${styles.button} !w-full !h-[42px] !rounded-[5px] bg-blue-600 hover:bg-blue-700`}
                                onClick={() => setShowUploadModal(true)}
                            >
                                <span className="text-white">Change Shop Picture</span>
                            </button>

                            <button
                                className={`${styles.button} !w-full !h-[42px] !rounded-[5px] bg-red-500 hover:bg-red-600`}
                                onClick={logoutHandler}
                            >
                                <span className="text-white">Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ShopInfo;