import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/styles";
import { categoriesData } from "../../static/data";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { BiMenuAltLeft } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import DropDown from "./DropDown";
import Navbar from "./Navbar";
import { useSelector, useDispatch } from "react-redux";
import { backend_url } from "../../server";
import Cart from "../cart/Cart";
import Wishlist from "../Wishlist/Wishlist";
import { RxCross1 } from "react-icons/rx";
import axios from "axios";

const Header = ({ activeHeading }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state with proper initialization from localStorage
  const { isSeller } = useSelector((state) => state.seller || {});
  const { cart } = useSelector((state) => state.cart || {});
  const { wishlist } = useSelector((state) => state.wishlist || {});
  
  // Initialize user state from localStorage if available
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");
  const storedAuth = localStorage.getItem("isAuthenticated");
  
  const initialUserState = storedUser ? JSON.parse(storedUser) : null;
  
  // Get user from Redux or localStorage
  const reduxUser = useSelector((state) => state.user || {});
  const user = reduxUser.user || initialUserState;
  
  // Check authentication from multiple sources
  const isAuthenticatedFromStorage = storedAuth === "true" && storedToken;
  const isAuthenticatedFromRedux = reduxUser.isAuthenticated;
  
  // Final authentication status
  const isAuthenticated = isAuthenticatedFromRedux || isAuthenticatedFromStorage;
  
  const { allProducts } = useSelector((state) => state.products || {});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState(null);
  const [active, setActive] = useState(false);
  const [dropDown, setDropDown] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);
  const [open, setOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Initialize axios headers with stored token
  useEffect(() => {
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, [storedToken]);

  // Load Redux state from localStorage on component mount
  useEffect(() => {
    if (storedUser && storedToken && !reduxUser.isAuthenticated) {
      const userData = JSON.parse(storedUser);
      
      // Dispatch appropriate action based on role
      const role = localStorage.getItem("userRole") || "user";
      
      if (role === "seller") {
        dispatch({ 
          type: "SellerLoginSuccess", 
          payload: userData 
        });
      } else {
        dispatch({ 
          type: "UserLoginSuccess", 
          payload: userData 
        });
      }
    }
  }, [dispatch, reduxUser.isAuthenticated, storedToken, storedUser]);

  // Function to get correct image URL
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/150x150?text=No+Image";
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

  // Function to get product image URL
  const getProductImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/40x40?text=Product";
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
    
    return "https://via.placeholder.com/40x40?text=Product";
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    const filteredProducts =
      allProducts &&
      allProducts.filter((product) =>
        product.name.toLowerCase().includes(term.toLowerCase())
      );
    setSearchData(filteredProducts);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAuthenticated");
    
    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Dispatch logout actions
    dispatch({ type: "UserLogout" });
    dispatch({ type: "SellerLogout" });
    
    // Close dropdowns
    setShowUserDropdown(false);
    
    // Redirect to login
    navigate("/login");
  };

  const handleLoginClick = () => {
    setShowUserDropdown(false);
    navigate("/login");
  };

  const handleSignupClick = () => {
    setShowUserDropdown(false);
    navigate("/sign-up");
  };

  const handleSellerLoginClick = () => {
    setShowUserDropdown(false);
    navigate("/shop-login");
  };

  const handleCreateShopClick = () => {
    setShowUserDropdown(false);
    navigate("/shop-create");
  };

  window.addEventListener("scroll", () => {
    if (window.scrollY > 70) {
      setActive(true);
    } else {
      setActive(false);
    }
  });

  return (
    <>
      <div className={`${styles.section}`}>
        <div className="hidden 800px:h-[50px] 800px:my-[20px] 800px:flex items-center justify-between ">
          <div>
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt="Logo"
                className="h-10"
              />
            </Link>
          </div>
          {/* Search box */}
          <div className="w-[50%] relative">
            <input
              type="text"
              placeholder="Search for product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
            />
            <AiOutlineSearch
              size={30}
              className="absolute right-2 top-1.5 cursor-pointer"
            />
            {
              searchData && searchData.length !== 0 ? (
                <div className="absolute min-h-[30vh] bg-white shadow-lg z-50 p-4 rounded-md w-full">
                  {searchData &&
                    searchData.map((i, index) => {
                      return (
                        <Link 
                          to={`/product/${i._id}`} 
                          key={index}
                          onClick={() => setSearchData(null)}
                        >
                          <div className="w-full flex items-center py-2 hover:bg-gray-100 px-2 rounded">
                            <img
                              src={getProductImageUrl(i.images && i.images[0])}
                              alt={i.name}
                              className="w-[40px] h-[40px] mr-[10px] object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40x40?text=Product";
                              }}
                            />
                            <h1 className="truncate">{i.name}</h1>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              ) : null
            }
          </div>

          {/* Become a Seller */}
          <div className={`${styles.button}`}>
            <Link to={`${isSeller ? "/dashboard" : "/shop-create"}`}>
              <h1 className="text-[#fff] flex items-center">
                {isSeller ? "Go Dashboard" : "Become Seller"}{" "}
                <IoIosArrowForward className="ml-1" />
              </h1>
            </Link>
          </div>
        </div>
      </div>

      {/* 2nd part of header */}
      <div
        className={`${
          active == true ? "shadow-sm fixed top-0 left-0 z-10" : null
        } transition hidden 800px:flex items-center justify-between w-full bg-[#3321c8] h-[70px]`}
      >
        <div
          className={`${styles.section} relative ${styles.noramlFlex} justify-between`}
        >
          {/* Categories */}
          <div onClick={() => setDropDown(!dropDown)}>
            <div className="relative h-[60px] mt-[10px] w-[270px] hidden 1000px:block">
              <BiMenuAltLeft size={30} className="absolute top-3 left-2" />
              <button
                className={`h-[100%] w-full flex justify-between items-center pl-10 bg-white font-sans text-lg font-[500] select-none rounded-t-md`}
              >
                All Categories
              </button>
              <IoIosArrowDown
                size={20}
                className="absolute right-2 top-4 cursor-pointer"
                onClick={() => setDropDown(!dropDown)}
              />
              {dropDown ? (
                <DropDown
                  categoriesData={categoriesData}
                  setDropDown={setDropDown}
                />
              ) : null}
            </div>
          </div>

          {/* NavItems */}
          <div className={`${styles.noramlFlex}`}>
            <Navbar active={activeHeading} />
          </div>

          <div className="flex">
            <div className={`${styles.noramlFlex}`}>
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenWishlist(true)}
              >
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
                <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {wishlist && wishlist.length}
                </span>
              </div>
            </div>

            <div className={`${styles.noramlFlex}`}>
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenCart(true)}
              >
                <AiOutlineShoppingCart
                  size={30}
                  color="rgb(255 255 255 / 83%)"
                />
                <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {cart && cart.length}
                </span>
              </div>
            </div>

            {/* User Profile */}
            <div className={`${styles.noramlFlex}`}>
              <div className="relative cursor-pointer mr-[15px]">
                {isAuthenticated ? (
                  <>
                    <button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="focus:outline-none hover:opacity-80 transition-opacity"
                    >
                      {user?.avatar ? (
                        <img
                          src={getImageUrl(user.avatar)}
                          className="w-[35px] h-[35px] rounded-full object-cover border-2 border-white"
                          alt="Profile"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/35x35?text=User";
                          }}
                        />
                      ) : (
                        <CgProfile size={30} color="rgb(255 255 255 / 83%)" />
                      )}
                    </button>
                    
                    {/* User dropdown for authenticated users */}
                    {showUserDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserDropdown(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                        >
                          My Profile
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setShowUserDropdown(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                        >
                          My Orders
                        </Link>
                        {user?.isSeller && (
                          <Link
                            to="/dashboard"
                            onClick={() => setShowUserDropdown(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                          >
                            Seller Dashboard
                          </Link>
                        )}
                        {user?.isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserDropdown(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <div className="border-t my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 hover:text-red-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="focus:outline-none hover:opacity-80 transition-opacity"
                    >
                      <CgProfile size={30} color="rgb(255 255 255 / 83%)" />
                    </button>
                    
                    {/* Dropdown menu for non-authenticated users */}
                    {showUserDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                        <button
                          onClick={handleLoginClick}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                        >
                          Login as User
                        </button>
                        <button
                          onClick={handleSignupClick}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                        >
                          Sign Up as User
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={handleSellerLoginClick}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                        >
                          Seller Login
                        </button>
                        <button
                          onClick={handleCreateShopClick}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                        >
                          Become a Seller
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Cart popup */}
          {openCart && <Cart setOpenCart={setOpenCart} />}
          
          {/* Wishlist popup */}
          {openWishlist && <Wishlist setOpenWishlist={setOpenWishlist} />}
        </div>
      </div>

      {/* Mobile Header */}
      <div
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
        }
            w-full h-[60px] bg-[#fff] z-50 top-0 left-0 shadow-sm 800px:hidden`}
      >
        <div className="w-full flex items-center justify-between">
          <div>
            <BiMenuAltLeft
              size={40}
              className="ml-4"
              onClick={() => setOpen(true)}
            />
          </div>
          <div>
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt="Logo"
                className="h-8 mt-3 cursor-pointer"
              />
            </Link>
          </div>

          <div>
            <div
              className="relative mr-[20px]"
              onClick={() => setOpenCart(true)}
            >
              <AiOutlineShoppingCart size={30} />
              <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                {cart && cart.length}
              </span>
            </div>
          </div>
          
          {/* cart popup */}
          {openCart && <Cart setOpenCart={setOpenCart} />}

          {/* wishlist popup */}
          {openWishlist && <Wishlist setOpenWishlist={setOpenWishlist} />}
        </div>
      </div>

      {/* Sidebar */}
      {open && (
        <div className={`fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0`}>
          <div className="fixed w-[70%] bg-[#fff] h-screen top-0 left-0 z-10 overflow-y-scroll">
            <div className="w-full justify-between flex pr-3">
              <div>
                <div
                  className="relative mr-[15px]"
                  onClick={() => {
                    setOpenWishlist(true);
                    setOpen(false);
                  }}
                >
                  <AiOutlineHeart size={30} className="mt-5 ml-3" />
                  <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 top right p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                    {wishlist && wishlist.length}
                  </span>
                </div>
              </div>

              <RxCross1
                size={30}
                className="ml-4 mt-5 cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>

            {/* Search Bar */}
            <div className="my-8 w-[92%] m-auto h-[40px] relative">
              <input
                type="search"
                placeholder="Search for products"
                className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />

              {searchData && searchData.length > 0 && (
                <div className="absolute bg-[#fff] z-10 shadow w-full left-0 p-3 rounded-b-md">
                  {searchData.map((i, index) => (
                    <Link 
                      to={`/product/${i._id}`} 
                      key={index}
                      onClick={() => {
                        setSearchData(null);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center py-2 hover:bg-gray-100 px-2 rounded">
                        <img
                          src={getProductImageUrl(i.images && i.images[0])}
                          alt={i.name}
                          className="w-[50px] h-[50px] mr-2 object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/50x50?text=Product";
                          }}
                        />
                        <h5 className="truncate">{i.name}</h5>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <Navbar active={activeHeading} />
            
            <div className={`${styles.button} ml-4 !rounded-[4px]`}>
              <Link to={`${isSeller ? "/dashboard" : "/shop-create"}`}>
                <h1 className="text-[#fff] flex items-center">
                  {isSeller ? "Go Dashboard" : "Become Seller"}{" "}
                  <IoIosArrowForward className="ml-1" />
                </h1>
              </Link>
            </div>
            <br />
            <br />
            <br />

            {/* Mobile Login/Logout */}
            <div className="flex w-full justify-center items-center flex-col">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setOpen(false)}>
                    <img
                      src={getImageUrl(user?.avatar)}
                      alt="Profile"
                      className="w-[60px] h-[60px] rounded-full border-[3px] border-[#0eae88] object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/60x60?text=User";
                      }}
                    />
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setOpen(false);
                    }}
                    className="text-[18px] pr-[10px] text-[#000000b7] hover:text-blue-600"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/sign-up");
                      setOpen(false);
                    }}
                    className="text-[18px] text-[#000000b7] hover:text-blue-600"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;