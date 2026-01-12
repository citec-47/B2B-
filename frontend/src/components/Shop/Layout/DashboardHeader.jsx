// Components/Dashboard/Layout/DashboardHeader.jsx - UPDATED WORKING VERSION
import React, { useState } from "react";
import { AiOutlineGift, AiOutlineBell } from "react-icons/ai";
import { MdOutlineLocalOffer } from "react-icons/md";
import { FiPackage, FiShoppingBag, FiLogOut } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import { backend_url } from "../../../server";
import axios from "axios";
import { server } from "../../../server";
import { toast } from "react-toastify";

const DashboardHeader = () => {
    const { seller } = useSelector((state) => state.seller);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.get(`${server}/shop/logout`, { 
                withCredentials: true 
            });
            localStorage.removeItem("seller-token");
            toast.success("Logout successful!");
            navigate("/shop-login");
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.log("Logout error:", error);
            toast.error("Logout failed!");
        }
    };

    return (
        <div className="w-full h-[80px] bg-white shadow sticky top-0 left-0 z-30 flex items-center justify-between px-4">
            {/* Left side - Logo */}
            <div>
                <Link to="/dashboard">
                    <img
                        src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                        alt="Shop Logo"
                        className="h-10"
                    />
                </Link>
            </div>

            {/* Right side - Icons and Profile */}
            <div className="flex items-center">
                {/* Icons */}
                <div className="flex items-center mr-4">
                    <Link to="/dashboard-coupouns" className="800px:block hidden">
                        <AiOutlineGift
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-blue-600 transition-colors"
                        />
                    </Link>
                    <Link to="/dashboard-events" className="800px:block hidden">
                        <MdOutlineLocalOffer
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-green-600 transition-colors"
                        />
                    </Link>
                    <Link to="/dashboard-products" className="800px:block hidden">
                        <FiShoppingBag
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-purple-600 transition-colors"
                        />
                    </Link>
                    <Link to="/dashboard-orders" className="800px:block hidden">
                        <FiPackage 
                            color="#555" 
                            size={30} 
                            className="mx-5 cursor-pointer hover:text-orange-600 transition-colors"
                        />
                    </Link>
                    <Link to="/dashboard-messages" className="800px:block hidden">
                        <BiMessageSquareDetail
                            color="#555"
                            size={30}
                            className="mx-5 cursor-pointer hover:text-red-600 transition-colors"
                        />
                    </Link>
                    <button className="800px:block hidden mx-5 relative">
                        <AiOutlineBell
                            color="#555"
                            size={30}
                            className="cursor-pointer hover:text-yellow-600 transition-colors"
                        />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            0
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center space-x-3 focus:outline-none"
                        >
                            {seller && seller.avatar ? (
                                <img
                                    src={`${backend_url}${seller.avatar}`}
                                    alt={seller.name}
                                    className="w-[50px] h-[50px] rounded-full object-cover border-2 border-gray-300"
                                />
                            ) : (
                                <div className="w-[50px] h-[50px] rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                                    {seller?.name?.charAt(0) || "S"}
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50 py-2">
                                {seller && (
                                    <div className="px-4 py-3 border-b">
                                        <p className="font-medium text-gray-800">{seller.name}</p>
                                        <p className="text-sm text-gray-500">{seller.email}</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Balance: ${seller.availableBalance || 0}
                                        </p>
                                    </div>
                                )}
                                
                                <Link
                                    to={`/shop/${seller?._id}`}
                                    className="block px-4 py-3 hover:bg-gray-50 text-gray-700"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    👁️ View Shop
                                </Link>
                                
                                <Link
                                    to="/settings"
                                    className="block px-4 py-3 hover:bg-gray-50 text-gray-700"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    ⚙️ Settings
                                </Link>
                                
                                <Link
                                    to="/dashboard"
                                    className="block px-4 py-3 hover:bg-gray-50 text-gray-700"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    📊 Dashboard
                                </Link>

                                <div className="border-t mt-2 pt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center"
                                    >
                                        <FiLogOut className="mr-3" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Close dropdown when clicking outside */}
            {dropdownOpen && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default DashboardHeader;