// frontend/src/components/Layout/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/styles";
import { categoriesData } from "../../static/data";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
  AiOutlineLogout,
  AiOutlineUser,
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
import { toast } from "react-toastify";
import { handleLogout, redirectAfterLogout } from "./logout";

const Header = ({ activeHeading }) => {
  const { isSeller } = useSelector((state) => state.seller);
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { allProducts } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState(null);
  const [active, setActive] = useState(false);
  const [dropDown, setDropDown] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);
  const [open, setOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const dispatch = useDispatch();

  // Logout handler using the utility
  const performLogout = async (type = 'all') => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      // Close all dropdowns/modals
      setUserDropdown(false);
      setOpen(false);
      setOpenCart(false);
      setOpenWishlist(false);
      
      const loadingToast = toast.loading(`Logging out ${type === 'all' ? 'from all accounts' : `${type} account`}...`);
      
      // Perform logout
      const result = await handleLogout(dispatch, type);
      
      // Update toast based on result
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(result.message, { autoClose: 2000 });
        
        // Redirect after successful logout
        redirectAfterLogout(type);
      } else {
        toast.error("Logout completed with errors. Redirecting...", { autoClose: 2000 });
        
        // Still redirect even with errors
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    } catch (error) {
      console.error("Logout process error:", error);
      toast.error("Logout error. Redirecting...");
      
      // Force redirect on error
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Search handler
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

  // Scroll effect for header
  window.addEventListener("scroll", () => {
    if (window.scrollY > 70) {
      setActive(true);
    } else {
      setActive(false);
    }
  });

  // Auto-redirect from dashboard if not seller
  React.useEffect(() => {
    if (window.location.pathname.includes('/dashboard') && !isSeller) {
      setTimeout(() => {
        window.location.href = `/shop-login?redirect=dashboard`;
      }, 100);
    }
  }, [isSeller]);

  return (
    <>
      <div className={`${styles.section}`}>
        <div className="hidden 800px:h-[50px] 800px:my-[20px] 800px:flex items-center justify-between ">
          <div>
            <Link to="/">
              <img
                src="https://shopo.quomodothemes.website/assets/images/logo.svg"
                alt="Shop Logo"
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
            {searchData && searchData.length !== 0 && (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4 max-h-[400px] overflow-y-auto">
                {searchData.map((product, index) => (
                  <Link to={`/product/${product._id}`} key={index} onClick={() => setSearchTerm("")}>
                    <div className="w-full flex items-center py-3 hover:bg-gray-100 px-2 rounded">
                      <img
                        src={`${backend_url}${product.images[0]}`}
                        alt={product.name}
                        className="w-[40px] h-[40px] mr-[10px] object-cover rounded"
                      />
                      <div>
                        <h1 className="font-medium">{product.name}</h1>
                        <p className="text-sm text-gray-500">${product.discountPrice}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Search end */}

          {/* Become a Seller */}
          <div className={`${styles.button}`}>
            <Link to={`${isSeller ? "/dashboard" : "/shop-create"}`}>
              <h1 className="text-[#fff] flex items-center">
                {isSeller ? "Go Dashboard" : "Become Seller"}{" "}
                <IoIosArrowForward className="ml-1" />
              </h1>
            </Link>
          </div>
          {/* Become a Seller end */}
        </div>
      </div>

      {/* 2nd part of header start */}
      <div
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
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
              {dropDown && (
                <DropDown
                  categoriesData={categoriesData}
                  setDropDown={setDropDown}
                />
              )}
            </div>
          </div>

          {/* NavItems */}
          <div className={`${styles.noramlFlex}`}>
            <Navbar active={activeHeading} />
          </div>

          <div className="flex">
            {/* Wishlist */}
            <div className={`${styles.noramlFlex}`}>
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenWishlist(true)}
              >
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
                {wishlist && wishlist.length > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[#3bc177] w-5 h-5 text-white font-mono text-[12px] leading-tight text-center flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </div>
            </div>

            {/* Cart */}
            <div className={`${styles.noramlFlex}`}>
              <div
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setOpenCart(true)}
              >
                <AiOutlineShoppingCart
                  size={30}
                  color="rgb(255 255 255 / 83%)"
                />
                {cart && cart.length > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[#3bc177] w-5 h-5 text-white font-mono text-[12px] leading-tight text-center flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>

            {/* USER AVATAR WITH DROPDOWN */}
            <div className={`${styles.noramlFlex} relative`}>
              <div 
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setUserDropdown(!userDropdown)}
              >
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={`${backend_url}${user?.avatar || 'default-avatar.jpg'}`}
                      className="w-[35px] h-[35px] rounded-full border-2 border-white object-cover"
                      alt={user?.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/35';
                      }}
                    />
                    <span className="text-white text-sm hidden lg:block">
                      {user?.name?.split(" ")[0] || 'User'}
                    </span>
                  </div>
                ) : (
                  <Link to="/login">
                    <CgProfile size={30} color="rgb(255 255 255 / 83%)" />
                  </Link>
                )}
              </div>

              {/* USER DROPDOWN MENU */}
              {isAuthenticated && userDropdown && (
                <div className="absolute top-12 right-0 w-48 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-3 border-b">
                    <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    {isSeller && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Seller
                      </span>
                    )}
                  </div>
                  
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserDropdown(false)}
                    >
                      <AiOutlineUser className="mr-2" />
                      Profile
                    </Link>
                    
                    {isSeller && (
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdown(false)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Seller Dashboard
                      </Link>
                    )}
                    
                    <hr className="my-1" />
                    
                    {/* User Only Logout */}
                    <button
                      onClick={() => performLogout('user')}
                      disabled={isLoggingOut}
                      className="flex items-center w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <AiOutlineUser className="mr-2" />
                      {isLoggingOut ? "Logging out..." : "Logout User Only"}
                    </button>
                    
                    {/* Seller Only Logout */}
                    {isSeller && (
                      <button
                        onClick={() => performLogout('seller')}
                        disabled={isLoggingOut}
                        className="flex items-center w-full text-left px-4 py-2 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        {isLoggingOut ? "Logging out..." : "Logout Seller Only"}
                      </button>
                    )}
                    
                    {/* Complete Logout */}
                    <button
                      onClick={() => performLogout('all')}
                      disabled={isLoggingOut}
                      className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 border-t disabled:opacity-50"
                    >
                      <AiOutlineLogout className="mr-2" />
                      {isLoggingOut ? "Logging out..." : "Logout From All Accounts"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* USER AVATAR END */}
            
            {/* Card popup */}
            {openCart && <Cart setOpenCart={setOpenCart} />}
            
            {/* Wishlist popup */}
            {openWishlist && <Wishlist setOpenWishlist={setOpenWishlist} />}
          </div>
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
                alt="Shop Logo"
                className="mt-3 cursor-pointer h-8"
              />
            </Link>
          </div>

          <div>
            <div
              className="relative mr-[20px]"
              onClick={() => setOpenCart(true)}
            >
              <AiOutlineShoppingCart size={30} />
              {cart && cart.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#3bc177] w-5 h-5 text-white font-mono text-[12px] leading-tight text-center flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
          </div>
          {/* Cart popup */}
          {openCart && <Cart setOpenCart={setOpenCart} />}

          {/* Wishlist popup */}
          {openWishlist && <Wishlist setOpenWishlist={setOpenWishlist} />}
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {open && (
        <div className="fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0">
          <div className="fixed w-[70%] bg-[#fff] h-screen top-0 left-0 z-10 overflow-y-scroll">
            <div className="w-full justify-between flex pr-3">
              <div>
                <div
                  className="relative mr-[15px]"
                  onClick={() => { setOpenWishlist(true); setOpen(false); }}
                >
                  <AiOutlineHeart size={30} className="mt-5 ml-3" />
                  {wishlist && wishlist.length > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-[#3bc177] w-5 h-5 text-white font-mono text-[12px] leading-tight text-center flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </div>
              </div>

              <RxCross1
                size={30}
                className="ml-4 mt-5 cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>

            {/* Search Bar */}
            <div className="my-8 w-[92%] m-auto h-[40px relative]">
              <input
                type="search"
                placeholder="Search for products"
                className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />

              {searchData && searchData.length > 0 && (
                <div className="absolute bg-[#fff] z-10 shadow w-full left-0 p-3 max-h-[400px] overflow-y-auto">
                  {searchData.map((product) => (
                    <Link to={`/product/${product._id}`} key={product._id} onClick={() => setSearchTerm("")}>
                      <div className="flex items-center py-2 hover:bg-gray-100 px-2 rounded">
                        <img
                          src={`${backend_url}${product.images[0]}`}
                          alt={product.name}
                          className="w-[40px] h-[40px] mr-2 object-cover rounded"
                        />
                        <div>
                          <h5 className="font-medium">{product.name}</h5>
                          <p className="text-sm text-gray-500">${product.discountPrice}</p>
                        </div>
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

            {/* MOBILE LOGIN/LOGOUT SECTION */}
            <div className="flex flex-col w-full justify-center items-center px-4">
              {isAuthenticated ? (
                <div className="flex flex-col items-center w-full">
                  <Link to="/profile" onClick={() => setOpen(false)}>
                    <img
                      src={`${backend_url}${user?.avatar || 'default-avatar.jpg'}`}
                      alt="Profile"
                      className="w-[60px] h-[60px] rounded-full border-[3px] border-[#0eae88] mb-2 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60';
                      }}
                    />
                  </Link>
                  <p className="font-semibold text-center">{user?.name}</p>
                  <p className="text-sm text-gray-500 text-center mb-2">{user?.email}</p>
                  {isSeller && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mb-4">
                      Seller Account
                    </span>
                  )}
                  
                  <div className="w-full border-t pt-4 space-y-2">
                    {/* User Only Logout */}
                    <button
                      onClick={() => performLogout('user')}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-100 rounded flex items-center disabled:opacity-50"
                    >
                      <AiOutlineUser className="mr-2" />
                      {isLoggingOut ? "Logging out..." : "Logout User Only"}
                    </button>
                    
                    {/* Seller Only Logout */}
                    {isSeller && (
                      <button
                        onClick={() => performLogout('seller')}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-orange-600 hover:bg-orange-100 rounded flex items-center disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        {isLoggingOut ? "Logging out..." : "Logout Seller Only"}
                      </button>
                    )}
                    
                    {/* Complete Logout */}
                    <button
                      onClick={() => performLogout('all')}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded flex items-center border-t pt-3 disabled:opacity-50"
                    >
                      <AiOutlineLogout className="mr-2" />
                      {isLoggingOut ? "Logging out..." : "Logout From All Accounts"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="text-[18px] text-center text-[#000000b7] px-4 py-2 bg-gray-100 rounded"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/sign-up"
                    className="text-[18px] text-center text-[#000000b7] px-4 py-2 bg-gray-100 rounded"
                    onClick={() => setOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;