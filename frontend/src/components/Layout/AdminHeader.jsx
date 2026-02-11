import React, { useEffect, useState } from "react";
import { MdOutlineLocalOffer } from "react-icons/md";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CiMoneyBill } from "react-icons/ci";
import { GrWorkshop } from "react-icons/gr";
import { backend_url } from "../../server";

const AdminHeader = () => {
  const { user } = useSelector((state) => state.user || {});
  const [userData, setUserData] = useState(user);
  
  // Get user from localStorage if Redux state is empty
  useEffect(() => {
    if (!user && localStorage.getItem("user")) {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUserData(storedUser);
    } else {
      setUserData(user);
    }
  }, [user]);

  // Function to get correct image URL
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/50x50?text=Admin";
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
    
    return "https://via.placeholder.com/50x50?text=Admin";
  };

  return (
    <div className="w-full h-[80px] bg-white shadow sticky top-0 left-0 z-30 flex items-center justify-between px-4">
      <div>
        <Link to="/">
          <img
            src="https://shopo.quomodothemes.website/assets/images/logo.svg"
            alt="Logo"
          />
        </Link>
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <Link to="/admin-withdraw-request" className="800px:block hidden">
            <CiMoneyBill
              color="#555"
              size={30}
              className="mx-5 cursor-pointer"
            />
          </Link>
          <Link to="/admin-events" className="800px:block hidden">
            <MdOutlineLocalOffer
              color="#555"
              size={30}
              className="mx-5 cursor-pointer"
            />
          </Link>
          <Link to="/admin-sellers" className="800px:block hidden">
            <GrWorkshop
              color="#555"
              size={30}
              className="mx-5 cursor-pointer"
            />
          </Link>
          {userData?.avatar ? (
            <img
              src={getImageUrl(userData.avatar)}
              alt="Profile"
              className="w-[50px] h-[50px] rounded-full object-cover border-2 border-gray-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/50x50?text=Admin";
              }}
            />
          ) : (
            <div className="w-[50px] h-[50px] rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <span className="text-gray-500 font-semibold">
                {userData?.name?.charAt(0) || 'A'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;