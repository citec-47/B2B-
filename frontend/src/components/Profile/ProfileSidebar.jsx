// src/components/Profile/ProfileSidebar.jsx
import React, { useEffect, useState } from "react";
import { AiOutlineLogin, AiOutlineMessage } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { HiOutlineReceiptRefund, HiOutlineShoppingBag } from "react-icons/hi";
import { RxPerson } from "react-icons/rx";
import { Link, useNavigate } from "react-router-dom";
import {
  MdOutlineAdminPanelSettings,
  MdOutlinePassword,
  MdOutlineTrackChanges,
} from "react-icons/md";
import { TbAddressBook } from "react-icons/tb";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { AiOutlineStop } from "react-icons/ai";

const ProfileSidebar = ({ active, setActive }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  useEffect(() => {
    checkSuspensionStatus();
  }, [user]);

  const checkSuspensionStatus = async () => {
    if (!user?._id) return;

    try {
      const { data } = await axios.get(
        `${server}/user/suspension-status/${user._id}`,
        { withCredentials: true }
      );

      if (data.success && data.isActive === false) {
        setIsSuspended(true);
        setSuspensionReason(data.suspensionReason || "No reason provided");
      }
    } catch (error) {
      console.error("Error checking suspension:", error);
    }
  };

  const logoutHandler = () => {
    axios
      .get(`${server}/user/logout`, { withCredentials: true })
      .then((res) => {
        toast.success(res.data.message);
        window.location.reload(true);
        navigate("/login");
      })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  };

  const handleInboxClick = () => {
    if (isSuspended) {
      toast.error("Cannot access inbox while account is suspended");
      return;
    }
    setActive(4);
    navigate("/inbox");
  };

  const handleMenuItemClick = (menuId, path) => {
    if (isSuspended && menuId !== 8) { // Allow logout only
      toast.error("This feature is disabled while your account is suspended");
      return;
    }
    setActive(menuId);
    navigate(path);
  };

  const menuItems = [
    { id: 1, icon: RxPerson, label: "Profile", path: "/profile", enabled: true },
    { id: 2, icon: HiOutlineShoppingBag, label: "Orders", path: "/profile/orders", enabled: !isSuspended },
    { id: 3, icon: HiOutlineReceiptRefund, label: "Refunds", path: "/profile/refunds", enabled: !isSuspended },
    { id: 4, icon: AiOutlineMessage, label: "Inbox", path: "/inbox", enabled: !isSuspended },
    { id: 5, icon: MdOutlineTrackChanges, label: "Track Order", path: "/profile/track-order", enabled: !isSuspended },
    { id: 6, icon: RiLockPasswordLine, label: "Change password", path: "/profile/change-password", enabled: true },
    { id: 7, icon: TbAddressBook, label: "Address", path: "/profile/address", enabled: true },
  ];

  return (
    <div className="w-full bg-white shadow-sm rounded-[10px] p-4 pt-8">
      {isSuspended && (
        <div className="bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
          <div className="flex items-start gap-2">
            <AiOutlineStop className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-red-700">Account Suspended</p>
              <p className="text-red-600 mt-1">{suspensionReason}</p>
            </div>
          </div>
        </div>
      )}

      {menuItems.map((item) => (
        <div
          key={item.id}
          className={`flex items-center cursor-pointer w-full mb-8 ${
            !item.enabled ? "opacity-50" : ""
          }`}
          onClick={() => handleMenuItemClick(item.id, item.path)}
        >
          <item.icon size={20} color={active === item.id ? "red" : ""} />
          <span
            className={`pl-3 ${
              active === item.id ? "text-[red]" : ""
            } 800px:block hidden`}
          >
            {item.label}
          </span>
        </div>
      ))}

      {user && user?.role === "Admin" && (
        <Link to="/admin/dashboard">
          <div
            className="flex items-center cursor-pointer w-full mb-8"
            onClick={() => setActive(8)}
          >
            <MdOutlineAdminPanelSettings
              size={20}
              color={active === 8 ? "red" : ""}
            />
            <span
              className={`pl-3 ${
                active === 8 ? "text-[red]" : ""
              } 800px:block hidden`}
            >
              Admin Dashboard
            </span>
          </div>
        </Link>
      )}

      <div
        className="flex items-center cursor-pointer w-full mb-8"
        onClick={logoutHandler}
      >
        <AiOutlineLogin size={20} color={active === 8 ? "red" : ""} />
        <span
          className={`pl-3 ${
            active === 8 ? "text-[red]" : ""
          } 800px:block hidden`}
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default ProfileSidebar;