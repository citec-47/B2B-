// src/components/Shop/Layout/DashboardHeader.jsx
import React from "react";
import { AiOutlineGift } from "react-icons/ai";
import { MdOutlineLocalOffer } from "react-icons/md";
import { FiPackage, FiShoppingBag } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import { backend_url } from "../../../server";
import axios from "axios";
import { server } from "../../../server";
import { toast } from "react-toastify";
import { AiOutlineStop } from "react-icons/ai";

const DashboardHeader = () => {
    const { seller } = useSelector((state) => state.seller);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Check if seller is suspended (either from isSuspended or isActive === false)
    const isSuspended = seller?.isSuspended === true || seller?.isActive === false;
    const suspensionReason = seller?.suspensionReason || "Your account has been suspended";

    console.log("📊 Header seller state:", { 
        seller, 
        isSuspended, 
        suspensionReason,
        isActive: seller?.isActive 
    });

    const handleLogout = async () => {
        try {
            await axios.get(`${server}/user/logout`, { withCredentials: true });
            dispatch({ type: "LogoutSuccess" });
            window.location.href = "/shop-login";
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    const getImageUrl = (image) => {
        if (!image) return "https://via.placeholder.com/50x50?text=Shop";
        if (image.startsWith("http")) return image;
        const cleanImage = image.replace(/^\/+/, '');
        if (cleanImage.startsWith('uploads/')) {
            return `${backend_url}/${cleanImage}`;
        }
        return `${backend_url}/uploads/${cleanImage}`;
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = "https://via.placeholder.com/50x50?text=Shop";
    };

    // If suspended, show the suspension UI immediately
    if (isSuspended) {
        return (
            <div className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow sticky top-0 left-0 z-30">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AiOutlineStop className="text-2xl" />
                        <div>
                            <h3 className="font-bold">Account Suspended</h3>
                            <p className="text-sm text-red-100">{suspensionReason}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    // Normal header for active sellers
    return (
        <div className="w-full h-[80px] bg-white shadow sticky top-0 left-0 z-30 flex items-center justify-between px-4">
            <div>
                <Link to="/dashboard">
                    <img
                        src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                        alt="Shop Logo"
                        className="h-10"
                    />
                </Link>
            </div>
            <div className="flex items-center">
                <div className="flex items-center mr-4">
                    <Link to="/dashboard-auto-fetch" className="800px:block hidden relative group">
                        <div className="relative">
                            <FaRobot
                                color="#555"
                                size={30}
                                className="mx-5 cursor-pointer hover:text-[crimson] transition-colors"
                                title="Auto-Fetch Products"
                            />
                            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                NEW
                            </span>
                        </div>
                    </Link>

                    <Link to="/dashboard/coupons" className="800px:block hidden">
                        <AiOutlineGift
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-[crimson] transition-colors"
                            title="Coupons"
                        />
                    </Link>
                    
                    <Link to="/dashboard-events" className="800px:block hidden">
                        <MdOutlineLocalOffer
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-[crimson] transition-colors"
                            title="Events"
                        />
                    </Link>
                    
                    <Link to="/dashboard-products" className="800px:block hidden">
                        <FiShoppingBag
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-[crimson] transition-colors"
                            title="Products"
                        />
                    </Link>
                    
                    <Link to="/dashboard-orders" className="800px:block hidden">
                        <FiPackage 
                            color="#555" 
                            size={30} 
                            className="mx-5 cursor-pointer hover:text-[crimson] transition-colors"
                            title="Orders"
                        />
                    </Link>
                    
                    <Link to="/dashboard-messages" className="800px:block hidden">
                        <BiMessageSquareDetail
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-[crimson] transition-colors"
                            title="Messages"
                        />
                    </Link>
                    
                    {seller && seller._id ? (
                        <Link to={`/shop/${seller._id}`}>
                            <img
                                src={getImageUrl(seller.avatar)}
                                alt={seller.name || "Seller"}
                                className="w-[50px] h-[50px] rounded-full object-cover border-2 border-gray-200 hover:border-[crimson] transition-colors"
                                onError={handleImageError}
                            />
                        </Link>
                    ) : (
                        <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                            <span className="text-gray-500 text-sm">Shop</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;