import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/styles";
import { productData, categoriesData } from "../../static/data";
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
import { logout } from "../../redux/actions/user";

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
  const [userDropdown, setUserDropdown] = useState(false); // User dropdown state
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Dispatch logout action
      dispatch({ type: "LogoutSuccess" });
      dispatch({ type: "SellerLogoutSuccess" });
      
      toast.success("Logged out successfully!");
      
      // Close dropdowns
      setUserDropdown(false);
      setOpen(false);
      
      // Redirect to login page with cache busting
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}`;
      
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  // Handle seller only logout
  const handleSellerLogout = () => {
    localStorage.removeItem("seller-token");
    localStorage.removeItem("seller-info");
    toast.success("Seller logged out successfully!");
    
    // Redirect to shop login
    setTimeout(() => {
      window.location.href = "/shop-login";
    }, 1000);
  };

  // Handle search change
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
                alt=""
              />
            </Link>
          </div>
          {/*Search box  */}
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
              // Search data if length is not 0 then show
              searchData && searchData.length !== 0 ? (
                <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-[9] p-4">
                  {searchData &&
                    searchData.map((i, index) => {
                      const d = i.name;

                      return (
                        <Link to={`/product/${i._id}`}>
                          <div className="w-full flex items-start-py-3">
                            <img
                              src={`${backend_url}${i.images[0]}`}
                              alt="img"
                              className="w-[40px] h-[40px] mr-[10px]"
                            />
                            <h1>{i.name}</h1>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              ) : null
            }
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

      {/*  2nd part of header start */}
      <div
        className={`${
          active == true ? "shadow-sm fixed top-0 left-0 z-10" : null
        } transition hidden 800px:flex items-center justify-between w-full bg-[#3321c8] h-[70px]`}
      >
        <div
          className={`${styles.section} relative ${styles.noramlFlex} justify-between`}
        >
          {/* Catagories */}
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

            {/* USER AVATAR WITH DROPDOWN */}
            <div className={`${styles.noramlFlex} relative`}>
              <div 
                className="relative cursor-pointer mr-[15px]"
                onClick={() => setUserDropdown(!userDropdown)}
              >
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={`${backend_url}${user.avatar}`}
                      className="w-[35px] h-[35px] rounded-full border-2 border-white"
                      alt=""
                    />
                    <span className="text-white text-sm hidden lg:block">
                      {user.name?.split(" ")[0]}
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
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
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
                    
                    {isSeller && (
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdown(false)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Settings
                      </Link>
                    )}
                    
                    <hr className="my-1" />
                    
                    {isSeller && (
                      <button
                        onClick={() => {
                          handleSellerLogout();
                          setUserDropdown(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Logout Seller Only
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserDropdown(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <AiOutlineLogout className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* USER AVATAR END */}
            
            {/* card  popup start */}
            {openCart ? <Cart setOpenCart={setOpenCart} /> : null}
            {/* card popup end */}

            {/* Wish list pop uo Start */}
            {openWishlist ? (
              <Wishlist setOpenWishlist={setOpenWishlist} />
            ) : null}
            {/* Wish list pop uo end */}
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
                alt=""
                className="mt-3 cursor-pointer"
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
          {openCart ? <Cart setOpenCart={setOpenCart} /> : null}

          {/* wishlist popup */}
          {openWishlist ? <Wishlist setOpenWishlist={setOpenWishlist} /> : null}
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {open ? (
        <div className={`fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0`}>
          <div className="fixed w-[70%] bg-[#fff] h-screen top-0 left-0 z-10 overflow-y-scroll">
            <div className="w-full justify-between flex pr-3">
              <div>
                <div
                  className="relative mr-[15px]"
                  onClick={() => setOpenWishlist(true) || setOpen(false)}
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
            <div className="my-8 w-[92%] m-auto h-[40px relative]">
              <input
                type="search"
                placeholder="Search for products"
                className="h-[40px] w-full px-2 border-[#3957db] border-[2px] rounded-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />

              {searchData && (
                <div className="absolute bg-[#fff] z-10 shadow w-full left-0 p-3">
                  {searchData.map((i) => {
                    const d = i.name;

                    const Product_name = d.replace(/\s+/g, "-");
                    return (
                      <Link to={`/product/${Product_name}`}>
                        <div className="flex items-center">
                          <img
                            src={i.image_Url[0].url}
                            alt=""
                            className="w-[50px] mr-2"
                          />
                          <h5>{i.name}</h5>
                        </div>
                      </Link>
                    );
                  })}
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
                      src={`${backend_url}${user.avatar}`}
                      alt="Profile img"
                      className="w-[60px] h-[60px] rounded-full border-[3px] border-[#0eae88] mb-2"
                    />
                  </Link>
                  <p className="font-semibold text-center">{user.name}</p>
                  <p className="text-sm text-gray-500 text-center mb-4">{user.email}</p>
                  
                  <div className="w-full border-t pt-4">
                    {isSeller && (
                      <button
                        onClick={() => {
                          handleSellerLogout();
                          setOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      >
                        Logout Seller Only
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded flex items-center mt-2"
                    >
                      <AiOutlineLogout className="mr-2" />
                      Logout
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
      ) : null}
    </>
  );
};

export default Header;