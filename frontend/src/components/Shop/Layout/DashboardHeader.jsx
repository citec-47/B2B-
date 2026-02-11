import React from "react";
import { AiOutlineGift } from "react-icons/ai";
import { MdOutlineLocalOffer } from "react-icons/md";
import { FiPackage, FiShoppingBag } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import { backend_url } from "../../../server";

const DashboardHeader = () => {
    const { seller } = useSelector((state) => state.seller);
    
    // Function to get correct image URL - same as in ShopInfo
    const getImageUrl = (image) => {
        if (!image) {
            return "https://via.placeholder.com/150x150?text=No+Shop+Image";
        }
        
        if (typeof image === 'string') {
            // Already a full URL
            if (image.startsWith("http")) {
                return image;
            }
            
            // Clean the filename
            const cleanImage = image.replace(/^\/+/, '');
            
            // If it's already in uploads/ path
            if (cleanImage.startsWith('uploads/')) {
                return `${backend_url}/${cleanImage}`;
            }
            
            // If it's just a filename
            return `${backend_url}/uploads/${cleanImage}`;
        }
        
        return "https://via.placeholder.com/150x150?text=Image+Error";
    };

    // Handle image error
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = "https://via.placeholder.com/50x50?text=Shop";
    };

    return (
        <div className="w-full h-[80px] bg-white shadow sticky top-0 left-0 z-30 flex items-center justify-between px-4">
            <div>
                <Link to="/dashboard">
                    <img
                        src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                        alt="Shop Logo"
                    />
                </Link>
            </div>
            <div className="flex items-center">
                <div className="flex items-center mr-4">
                    <Link to="/dashboard/coupons" className="800px:block hidden">
                        <AiOutlineGift
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer"
                            title="Coupons"
                        />
                    </Link>
                    <Link to="/dashboard-events" className="800px:block hidden">
                        <MdOutlineLocalOffer
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer"
                            title="Events"
                        />
                    </Link>
                    <Link to="/dashboard-products" className="800px:block hidden">
                        <FiShoppingBag
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer"
                            title="Products"
                        />
                    </Link>
                    <Link to="/dashboard-orders" className="800px:block hidden">
                        <FiPackage 
                            color="#555" 
                            size={30} 
                            className="mx-5 cursor-pointer" 
                            title="Orders"
                        />
                    </Link>
                    <Link to="/dashboard-messages" className="800px:block hidden">
                        <BiMessageSquareDetail
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer"
                            title="Messages"
                        />
                    </Link>
                    
                    {/* Seller Avatar */}
                    {seller && seller._id ? (
                        <Link to={`/shop/${seller._id}`}>
                            <img
                                src={getImageUrl(seller.avatar)}
                                alt={seller.name || "Seller"}
                                className="w-[50px] h-[50px] rounded-full object-cover border-2 border-gray-200"
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