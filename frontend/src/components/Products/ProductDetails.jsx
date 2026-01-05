import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { getAllProductsShop } from "../../redux/actions/product";
import { backend_url, server } from "../../server";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";
import axios from "axios";

// 🔧 FIX: Create a safe image URL helper
const getSafeImageUrl = (imagePath, type = "product") => {
  if (!imagePath) {
    // Use SVG data URLs instead of external placeholders
    if (type === "shop") {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%2310b981'/%3E%3Ctext x='25' y='28' font-size='12' fill='white' text-anchor='middle'%3EShop%3C/text%3E%3C/svg%3E";
    } else if (type === "user") {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%233b82f6'/%3E%3Ctext x='25' y='28' font-size='12' fill='white' text-anchor='middle'%3EUser%3C/text%3E%3C/svg%3E";
    } else {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%233b82f6'/%3E%3Ctext x='200' y='150' font-size='20' fill='white' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";
    }
  }
  
  // Check if it's already a full URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Check if it starts with a slash
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Otherwise, prepend backend_url
  return `${backend_url}${imagePath}`;
};

const ProductDetails = ({ data }) => {
  const { products } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [select, setSelect] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for data to be available
    if (data && data.shop && data.shop._id) {
      dispatch(getAllProductsShop(data.shop._id));
      setLoading(false);
    } else {
      console.log("Waiting for shop data...");
      // Set a timeout to stop loading after 3 seconds
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [data, wishlist, dispatch]);

  // Remove from wish list
  const removeFromWishlistHandler = (data) => {
    setClick(!click);
    dispatch(removeFromWishlist(data));
  };

  // add to wish list
  const addToWishlistHandler = (data) => {
    setClick(!click);
    dispatch(addToWishlist(data));
  };

  // Add to cart
  const addToCartHandler = (id) => {
    if (!data) {
      toast.error("Product data not available!");
      return;
    }
    
    const isItemExists = cart && cart.find((i) => i._id === id);

    if (isItemExists) {
      toast.error("Item already in cart!");
    } else {
      if (data.stock < 1) {
        toast.error("Product stock limited!");
      } else {
        const cartData = { ...data, qty: count };
        dispatch(addTocart(cartData));
        toast.success("Item added to cart successfully!");
      }
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
  };
  
  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  // Calculate ratings safely
  const totalReviewsLength = products?.reduce((acc, product) => 
    acc + (product.reviews?.length || 0), 0) || 0;

  const totalRatings = products?.reduce((acc, product) => 
    acc + (product.reviews?.reduce((sum, review) => sum + (review.rating || 0), 0) || 0), 0) || 0;

  const avg = totalReviewsLength > 0 ? totalRatings / totalReviewsLength : 0;
  const averageRating = avg.toFixed(2);

  // Send message
  const handleMessageSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to create a conversation");
      return;
    }
    
    if (!data || !data.shop || !data.shop._id) {
      toast.error("Seller information not available");
      return;
    }

    const groupTitle = data._id + user._id;
    const userId = user._id;
    const sellerId = data.shop._id;
    
    await axios
      .post(`${server}/conversation/create-new-conversation`, {
        groupTitle,
        userId,
        sellerId,
      })
      .then((res) => {
        navigate(`/inbox?${res.data.conversation._id}`);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Failed to create conversation");
      });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading product details...</div>
      </div>
    );
  }

  // Show error state if no data
  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-600">Product not found!</div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
        <div className="w-full py-5">
          <div className="block w-full 800px:flex">
            {/* Left side - Images */}
            <div className="w-full 800px:w-[50%]">
              <img
                src={getSafeImageUrl(data.images[select]?.url)}
                alt={data.name}
                className="w-[80%] h-auto object-contain"
              />
              <div className="w-full flex flex-wrap mt-3">
                {data.images.map((image, index) => (
                  <div
                    key={`product-image-${index}`}
                    className={`${
                      select === index ? "border-2 border-blue-500" : "border border-gray-300"
                    } cursor-pointer p-1 rounded mr-2 mb-2`}
                    onClick={() => setSelect(index)}
                  >
                    <img
                      src={getSafeImageUrl(image?.url, "thumbnail")}
                      alt={`${data.name} thumbnail ${index + 1}`}
                      className="h-[100px] w-[100px] object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right side - Details */}
            <div className="w-full 800px:w-[50%] pt-5">
              <h1 className={`${styles.productTitle}`}>{data.name}</h1>
              <p className="text-gray-600 mt-2">{data.description}</p>
              
              <div className="flex items-center pt-3">
                <h4 className={`${styles.productDiscountPrice} text-2xl font-bold`}>
                  ${data.discountPrice}
                </h4>
                {data.originalPrice && data.originalPrice > data.discountPrice && (
                  <h3 className={`${styles.price} text-lg line-through text-gray-500 ml-3`}>
                    ${data.originalPrice}
                  </h3>
                )}
              </div>

              {/* Quantity and Wishlist */}
              <div className="flex items-center mt-8 justify-between pr-3">
                <div className="flex items-center">
                  <button
                    className="bg-gradient-to-r from-teal-400 to-teal-500 text-white font-bold px-4 py-2 rounded-l hover:opacity-75 transition duration-300"
                    onClick={decrementCount}
                  >
                    -
                  </button>
                  <span className="bg-gray-100 text-gray-800 font-medium px-4 py-2 border-y">
                    {count}
                  </span>
                  <button
                    className="bg-gradient-to-r from-teal-400 to-teal-500 text-white font-bold px-4 py-2 rounded-r hover:opacity-75 transition duration-300"
                    onClick={incrementCount}
                  >
                    +
                  </button>
                </div>

                <div>
                  {click ? (
                    <AiFillHeart
                      size={30}
                      className="cursor-pointer"
                      onClick={() => removeFromWishlistHandler(data)}
                      color="red"
                      title="Remove from wishlist"
                    />
                  ) : (
                    <AiOutlineHeart
                      size={30}
                      className="cursor-pointer"
                      onClick={() => addToWishlistHandler(data)}
                      title="Add to wishlist"
                    />
                  )}
                </div>
              </div>
              
              {/* Add to Cart Button */}
              <button
                className={`${styles.button} !mt-6 !rounded !h-11 flex items-center justify-center w-full`}
                onClick={() => addToCartHandler(data._id)}
              >
                <span className="text-white flex items-center">
                  Add to Cart <AiOutlineShoppingCart className="ml-2" />
                </span>
              </button>
              
              {/* Shop Info */}
              <div className="flex items-center pt-8">
                <Link to={`/shop/preview/${data.shop?._id || ''}`}>
                  <img
                    src={getSafeImageUrl(data.shop?.avatar, "shop")}
                    alt={data.shop?.name || "Shop"}
                    className="w-[50px] h-[50px] rounded-full mr-3 border"
                  />
                </Link>

                <div className="flex-1">
                  <Link to={`/shop/preview/${data.shop?._id || ''}`}>
                    <h3 className={`${styles.shop_name} pb-1 cursor-pointer font-semibold`}>
                      {data.shop?.name || "Unknown Shop"}
                    </h3>
                  </Link>
                  <h5 className="text-gray-600 text-sm">
                    ({averageRating}/5) Ratings
                  </h5>
                </div>

                <button
                  className={`${styles.button} bg-[#6443d1] !rounded !h-11 px-4`}
                  onClick={handleMessageSubmit}
                >
                  <span className="text-white flex items-center">
                    Message <AiOutlineMessage className="ml-2" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Info */}
        <ProductDetailsInfo
          data={data}
          products={products}
          totalReviewsLength={totalReviewsLength}
          averageRating={averageRating}
        />
      </div>
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  products,
  totalReviewsLength,
  averageRating,
}) => {
  const [active, setActive] = useState(1);

  // Helper function for safe image URLs
  const getSafeImageUrl = (imagePath, type = "user") => {
    if (!imagePath) {
      if (type === "shop") {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%2310b981'/%3E%3Ctext x='30' y='34' font-size='14' fill='white' text-anchor='middle'%3EShop%3C/text%3E%3C/svg%3E";
      } else {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%233b82f6'/%3E%3Ctext x='25' y='28' font-size='12' fill='white' text-anchor='middle'%3EUser%3C/text%3E%3C/svg%3E";
      }
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    return `${backend_url}${imagePath}`;
  };

  return (
    <div className="bg-[#f5f6fb] px-3 800px:px-10 py-2 rounded mt-10">
      <div className="w-full flex justify-between border-b pt-5 pb-2">
        <button
          className={`relative text-[18px] font-[600] cursor-pointer 800px:text-[20px] ${
            active === 1 ? "text-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActive(1)}
        >
          Product Details
          {active === 1 && (
            <div className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          className={`relative text-[18px] font-[600] cursor-pointer 800px:text-[20px] ${
            active === 2 ? "text-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActive(2)}
        >
          Product Reviews
          {active === 2 && (
            <div className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          className={`relative text-[18px] font-[600] cursor-pointer 800px:text-[20px] ${
            active === 3 ? "text-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActive(3)}
        >
          Seller Information
          {active === 3 && (
            <div className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-blue-600" />
          )}
        </button>
      </div>

      {active === 1 && (
        <div className="py-5">
          <p className="text-[16px] leading-7 whitespace-pre-line">
            {data.description}
          </p>
        </div>
      )}

      {active === 2 && (
        <div className="w-full min-h-[40vh] py-5">
          {data.reviews?.length > 0 ? (
            data.reviews.map((item, index) => (
              <div key={`review-${index}`} className="flex mb-6">
                <img
                  src={getSafeImageUrl(item?.user?.avatar, "user")}
                  alt={item.user?.name || "User"}
                  className="w-[50px] h-[50px] rounded-full mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-[500] mr-3">{item.user?.name || "Anonymous"}</h4>
                    <Ratings rating={item.rating || 0} />
                  </div>
                  <p className="text-gray-600">{item.comment || "No comment provided."}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <h5 className="text-gray-500">No reviews yet for this product!</h5>
            </div>
          )}
        </div>
      )}

      {active === 3 && (
        <div className="w-full block 800px:flex p-5 py-8">
          <div className="w-full 800px:w-[50%]">
            <div className="flex items-center mb-5">
              <img
                src={getSafeImageUrl(data.shop?.avatar, "shop")}
                alt={data.shop?.name || "Shop"}
                className="w-[60px] h-[60px] rounded-full mr-4"
              />
              <div>
                <h3 className={`${styles.shop_name} font-bold`}>
                  {data.shop?.name || "Unknown Shop"}
                </h3>
                <p className="text-gray-600">({averageRating}/5) Ratings</p>
              </div>
            </div>
            <p className="text-gray-700">{data.shop?.description || "No shop description available."}</p>
          </div>

          <div className="w-full 800px:w-[50%] mt-8 800px:mt-0 800px:pl-10">
            <div className="space-y-3">
              <p className="font-[600]">
                Joined on:{" "}
                <span className="font-[500] text-gray-600">
                  {data.shop?.createdAt ? new Date(data.shop.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </p>
              <p className="font-[600]">
                Total Products:{" "}
                <span className="font-[500] text-gray-600">
                  {products?.length || 0}
                </span>
              </p>
              <p className="font-[600]">
                Total Reviews:{" "}
                <span className="font-[500] text-gray-600">
                  {totalReviewsLength}
                </span>
              </p>
              <Link to={`/shop/preview/${data.shop?._id || ''}`}>
                <button className={`${styles.button} !rounded !h-10 !mt-4`}>
                  <span className="text-white">Visit Shop</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;