<<<<<<< HEAD
// src/components/Shop/Layout/DashboardSideBar.jsx
import React, { useEffect } from "react";
=======
import React from "react";
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
import { AiOutlineFolderAdd, AiOutlineGift } from "react-icons/ai";
import { FiPackage, FiShoppingBag } from "react-icons/fi";
import { MdOutlineLocalOffer } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { VscNewFile } from "react-icons/vsc";
import { CiMoneyBill, CiSettings } from "react-icons/ci";
<<<<<<< HEAD
import { Link, useNavigate } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import { HiOutlineReceiptRefund } from "react-icons/hi";
import { FaRobot } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { server } from "../../../server";
import { AiOutlineStop, AiOutlineExclamationCircle } from "react-icons/ai";
import { toast } from "react-toastify";

const DashboardSideBar = ({ active }) => {
    const { seller, isLoading } = useSelector((state) => state.seller);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Check if seller is suspended (either from isSuspended or isActive === false)
    const isSuspended = seller?.isSuspended === true || seller?.isActive === false;
    const suspensionReason = seller?.suspensionReason || "Your account has been suspended";

    console.log("📊 Sidebar seller state:", { 
        seller, 
        isSuspended, 
        suspensionReason,
        isActive: seller?.isActive 
    });

    useEffect(() => {
        // If seller is suspended, we could dispatch an action if needed
        if (isSuspended) {
            console.log("🔴 Seller is suspended, showing restricted UI");
        }
    }, [isSuspended]);

    const handleLogout = async () => {
        try {
            await axios.get(`${server}/user/logout`, { withCredentials: true });
            dispatch({ type: "LogoutSuccess" });
            window.location.href = "/shop-login";
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    // If suspended, show the suspension UI immediately
    if (isSuspended) {
        return (
            <div className="w-full h-[90vh] bg-white shadow-sm overflow-y-scroll sticky top-0 left-0 z-10">
                {/* Suspension Banner */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 mb-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                            <AiOutlineStop className="text-white text-3xl" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Account Suspended</h3>
                        <p className="text-red-100 text-sm mb-3">{suspensionReason}</p>
                        <div className="mt-4 w-full bg-red-700/30 rounded-lg p-3">
                            <p className="text-white text-xs flex items-center justify-center gap-1">
                                <AiOutlineExclamationCircle />
                                Contact support for more information
                            </p>
                        </div>
                    </div>
                </div>

                {/* All Links Disabled */}
                <div className="px-4">
                    <div className="text-xs text-gray-500 mb-2 px-2">ACCOUNT RESTRICTED</div>
                    
                    {/* Dashboard Link - Disabled */}
                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <RxDashboard size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Dashboard
                        </h5>
                        <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            Locked
                        </span>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <FiShoppingBag size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            All Orders
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <FiPackage size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            All Products
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <AiOutlineFolderAdd size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Create Product
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <FaRobot size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Auto-Fetch Products
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <MdOutlineLocalOffer size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            All Events
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <VscNewFile size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Create Event
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <CiMoneyBill size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Withdraw Money
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <BiMessageSquareDetail size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Shop Inbox
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <AiOutlineGift size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Discount Codes
                        </h5>
                    </div>

                    <div className="w-full flex items-center p-4 opacity-50 cursor-not-allowed bg-gray-50 rounded-lg mb-1">
                        <HiOutlineReceiptRefund size={30} color="#999" />
                        <h5 className="hidden 800px:block pl-2 text-[18px] font-[400] text-gray-400">
                            Refunds
                        </h5>
                    </div>

                    {/* Settings - Still Enabled */}
                    <Link to="/settings" className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg mt-2">
                        <CiSettings size={30} color={active === 11 ? "crimson" : "#555"} />
                        <h5 className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 11 ? "text-[crimson]" : "text-[#555]"}`}>
                            Settings
                        </h5>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    // Normal sidebar for active sellers
    const menuItems = [
        { id: 1, path: "/dashboard", icon: RxDashboard, label: "Dashboard" },
        { id: 2, path: "/dashboard-orders", icon: FiShoppingBag, label: "All Orders" },
        { id: 3, path: "/dashboard-products", icon: FiPackage, label: "All Products" },
        { id: 4, path: "/dashboard-create-product", icon: AiOutlineFolderAdd, label: "Create Product" },
        { id: 12, path: "/dashboard-auto-fetch", icon: FaRobot, label: "Auto-Fetch Products" },
        { id: 5, path: "/dashboard-events", icon: MdOutlineLocalOffer, label: "All Events" },
        { id: 6, path: "/dashboard-create-event", icon: VscNewFile, label: "Create Event" },
        { id: 7, path: "/dashboard-withdraw-money", icon: CiMoneyBill, label: "Withdraw Money" },
        { id: 8, path: "/dashboard-messages", icon: BiMessageSquareDetail, label: "Shop Inbox" },
        { id: 9, path: "/dashboard-coupouns", icon: AiOutlineGift, label: "Discount Codes" },
        { id: 10, path: "/dashboard-refunds", icon: HiOutlineReceiptRefund, label: "Refunds" },
        { id: 11, path: "/settings", icon: CiSettings, label: "Settings" },
    ];

    return (
        <div className="w-full h-[90vh] bg-white shadow-sm overflow-y-scroll sticky top-0 left-0 z-10">
            {menuItems.map((item) => (
                <div key={item.id} className="w-full flex items-center p-4">
                    <Link to={item.path} className="w-full flex items-center">
                        <item.icon
                            size={30}
                            color={`${active === item.id ? "crimson" : "#555"}`}
                        />
                        <h5
                            className={`hidden 800px:block pl-2 text-[18px] font-[400] ${
                                active === item.id ? "text-[crimson]" : "text-[#555]"
                            }`}
                        >
                            {item.label}
                        </h5>
                    </Link>
                </div>
            ))}

            {/* Help/Info Section */}
            <div className="mt-4 p-4 border-t border-gray-200">
                <div className="flex items-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-blue-600 mr-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="text-xs text-blue-700">
                        <p className="font-medium">Auto-Fetch Products</p>
                        <p>Import products from AliExpress automatically</p>
                    </div>
                </div>
=======
import { Link } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import { HiOutlineReceiptRefund } from "react-icons/hi";

const DashboardSideBar = ({ active }) => {
    return (
        <div className="w-full h-[90vh] bg-white shadow-sm overflow-y-scroll sticky top-0 left-0 z-10">
            {/* single item */}
            <div className="w-full flex items-center p-4">
                <Link to="/dashboard" className="w-full flex items-center">
                    <RxDashboard
                        size={30}
                        color={`${active === 1 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 1 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Dashboard
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-orders" className="w-full flex items-center">
                    <FiShoppingBag
                        size={30}
                        color={`${active === 2 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 2 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        All Orders
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-products" className="w-full flex items-center">
                    <FiPackage size={30} color={`${active === 3 ? "crimson" : "#555"}`} />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 3 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        All Products
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link
                    to="/dashboard-create-product"
                    className="w-full flex items-center"
                >
                    <AiOutlineFolderAdd
                        size={30}
                        color={`${active === 4 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 4 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Create Product
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-events" className="w-full flex items-center">
                    <MdOutlineLocalOffer
                        size={30}
                        color={`${active === 5 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 5 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        All Events
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-create-event" className="w-full flex items-center">
                    <VscNewFile
                        size={30}
                        color={`${active === 6 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 6 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Create Event
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link
                    to="/dashboard-withdraw-money"
                    className="w-full flex items-center"
                >
                    <CiMoneyBill
                        size={30}
                        color={`${active === 7 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 7 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Withdraw Money
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-messages" className="w-full flex items-center">
                    <BiMessageSquareDetail
                        size={30}
                        color={`${active === 8 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 8 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Shop Inbox
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-coupouns" className="w-full flex items-center">
                    <AiOutlineGift
                        size={30}
                        color={`${active === 9 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 9 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Discount Codes
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/dashboard-refunds" className="w-full flex items-center">
                    <HiOutlineReceiptRefund
                        size={30}
                        color={`${active === 10 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 10 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Refunds
                    </h5>
                </Link>
            </div>

            <div className="w-full flex items-center p-4">
                <Link to="/settings" className="w-full flex items-center">
                    <CiSettings
                        size={30}
                        color={`${active === 11 ? "crimson" : "#555"}`}
                    />
                    <h5
                        className={`hidden 800px:block pl-2 text-[18px] font-[400] ${active === 11 ? "text-[crimson]" : "text-[#555]"
                            }`}
                    >
                        Settings
                    </h5>
                </Link>
>>>>>>> c919f67046b679987be15f3bc10759d7a97b1c31
            </div>
        </div>
    );
};

export default DashboardSideBar;