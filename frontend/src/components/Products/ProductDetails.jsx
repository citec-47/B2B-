// Components/Product/ProductDetails.jsx - UPDATED MESSAGE FUNCTION
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
import { backend_url, server } from "../../server";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";

const ProductDetails = ({ data }) => {
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [select, setSelect] = useState(0);
  const [shopProducts, setShopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if product is in wishlist
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }

    // Fetch shop products when data is available
    if (data && data.shop && data.shop._id) {
      fetchShopProducts(data.shop._id);
    }
  }, [data, wishlist]);

  // Fetch shop products from Firebase backend
  const fetchShopProducts = async (shopId) => {
    try {
      setLoading(true);
      const response = await fetch(`${server}/product/get-shop-products/${shopId}`);
      const result = await response.json();
      if (result.success) {
        setShopProducts(result.products || []);
      }
    } catch (error) {
      console.error("Error fetching shop products:", error);
      setShopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate ratings and reviews for ALL shop products
  const calculateShopStats = () => {
    if (!shopProducts || shopProducts.length === 0) {
      return { totalReviews: 0, averageRating: "0.00" };
    }

    let totalReviews = 0;
    let totalRatings = 0;

    shopProducts.forEach(product => {
      const reviews = product.reviews || [];
      totalReviews += reviews.length;
      totalRatings += reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    });

    const avg = totalReviews > 0 ? totalRatings / totalReviews : 0;
    return {
      totalReviews,
      averageRating: avg.toFixed(2)
    };
  };

  const shopStats = calculateShopStats();

  // Function to get correct image URL
  const getImageUrl = (image) => {
    if (!image) {
      return `${backend_url}/uploads/default-product.jpg`;
    }
    
    if (typeof image === 'string') {
      // If it's already a full URL
      if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
      }
      
      // If it's a relative path starting with uploads/
      if (image.startsWith('uploads/')) {
        return `${backend_url}/${image}`;
      }
      
      // If it's just a filename, add uploads path
      if (image.includes('.')) { // Has file extension
        return `${backend_url}/uploads/${image}`;
      }
      
      // Default case
      return `${backend_url}/uploads/${image}`;
    }
    
    // Handle image objects
    if (typeof image === 'object') {
      if (image.url) {
        return getImageUrl(image.url);
      }
      if (image.public_id) {
        // For Cloudinary or similar services
        return image.public_id;
      }
    }
    
    return `${backend_url}/uploads/default-product.jpg`;
  };

  // Remove from wish list
  const removeFromWishlistHandler = (product) => {
    setClick(!click);
    dispatch(removeFromWishlist(product));
    toast.success("Removed from wishlist!");
  };

  // add to wish list
  const addToWishlistHandler = (product) => {
    setClick(!click);
    dispatch(addToWishlist(product));
    toast.success("Added to wishlist!");
  };

  // Add to cart
  const addToCartHandler = (id) => {
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
    if (count < (data.stock || 0)) {
      setCount(count + 1);
    } else {
      toast.error("Cannot exceed available stock!");
    }
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  // Calculate product-specific ratings
  const productReviews = data?.reviews || [];
  const productTotalReviews = productReviews.length;
  const productTotalRatings = productReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const productAverageRating = productTotalReviews > 0 ? (productTotalRatings / productTotalReviews).toFixed(2) : "0.00";

  // ========== UPDATED: Message Seller ==========
  const handleMessageSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to contact the seller");
      navigate('/login');
      return;
    }

    if (!data.shop?._id) {
      toast.error("Unable to contact seller: Shop information missing");
      return;
    }

    try {
      // Store conversation data
      localStorage.setItem('NEW_CONVERSATION_DATA', JSON.stringify({
        shopId: data.shop._id,
        sellerId: data.shop._id,
        shopName: data.shop.name,
        shopAvatar: getImageUrl(data.shop.avatar),
        productId: data._id,
        productName: data.name,
        userId: user._id,
        userName: user.name,
        timestamp: Date.now()
      }));
      
      // Set flag to create new conversation
      localStorage.setItem('CREATE_NEW_CONVERSATION', 'true');
      
      // Navigate to inbox
      navigate('/inbox');
      
      toast.success("Opening chat with seller...");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Ensure images array exists and normalize URLs
  const productImages = Array.isArray(data.images) ? data.images.map(img => getImageUrl(img)) : [];
  const selectedImage = productImages[select] || productImages[0] || `${backend_url}/uploads/default-product.jpg`;

  return (
    <div className="bg-white">
      <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
        <div className="w-full py-5">
          <div className="block w-full 800px:flex">
            {/* Left Side - Product Images */}
            <div className="w-full 800px:w-[50%]">
              {/* Main Image */}
              <div className="mb-4 flex justify-center">
                <img
                  src={selectedImage}
                  alt={data.name || "Product"}
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${backend_url}/uploads/default-product.jpg`;
                  }}
                />
              </div>
              
              {/* Image Thumbnails */}
              {productImages.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {productImages.map((image, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        select === index 
                          ? "border-blue-500 border-3" 
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                      onClick={() => setSelect(index)}
                    >
                      <img
                        src={image}
                        alt={`${data.name || 'Product'} thumbnail ${index + 1}`}
                        className="w-16 h-16 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${backend_url}/uploads/default-product.jpg`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-4">
                  No images available
                </div>
              )}
            </div>

            {/* Right Side - Product Info */}
            <div className="w-full 800px:w-[50%] pt-5 800px:pt-0 800px:pl-8">
              <h1 className="text-2xl 800px:text-3xl font-bold text-gray-900 mb-2">
                {data.name || "Product Name"}
              </h1>
              
              {/* Product Rating */}
              <div className="flex items-center mb-3">
                <Ratings rating={parseFloat(productAverageRating)} />
                <span className="ml-2 text-gray-600">
                  ({productTotalReviews} review{productTotalReviews !== 1 ? 's' : ''})
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{data.description || "No description available"}</p>
              
              {/* Price Section */}
              <div className="flex items-center mb-6">
                <span className="text-2xl font-bold text-blue-600">
                  ${data.discountPrice || data.originalPrice || "0.00"}
                </span>
                {data.originalPrice && data.originalPrice > (data.discountPrice || data.originalPrice) && (
                  <span className="ml-3 text-lg text-gray-500 line-through">
                    ${data.originalPrice}
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center mb-6">
                <span className="mr-4 font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <button
                    className="px-3 py-1 text-lg hover:bg-gray-100 disabled:opacity-50"
                    onClick={decrementCount}
                    disabled={count <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x">{count}</span>
                  <button
                    className="px-3 py-1 text-lg hover:bg-gray-100 disabled:opacity-50"
                    onClick={incrementCount}
                    disabled={!data.stock || count >= data.stock}
                  >
                    +
                  </button>
                </div>
                <span className="ml-4 text-sm text-gray-500">
                  {data.stock || 0} available in stock
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col 800px:flex-row gap-3 mb-6">
                <button
                  onClick={() => addToCartHandler(data._id)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={!data.stock || data.stock < 1}
                >
                  <AiOutlineShoppingCart className="mr-2" />
                  {data.stock < 1 ? "Out of Stock" : "Add to Cart"}
                </button>
                
                <button
                  onClick={() => click ? removeFromWishlistHandler(data) : addToWishlistHandler(data)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center transition-all"
                >
                  {click ? (
                    <>
                      <AiFillHeart className="mr-2 text-red-500" />
                      Remove from Wishlist
                    </>
                  ) : (
                    <>
                      <AiOutlineHeart className="mr-2" />
                      Add to Wishlist
                    </>
                  )}
                </button>
              </div>

              {/* Seller Info */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <img
                    src={getImageUrl(data?.shop?.avatar)}
                    alt={data.shop?.name || "Shop"}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${backend_url}/uploads/default-shop.jpg`;
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {data.shop?.name || "Unknown Shop"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {data.shop?.description || "Seller"}
                    </p>
                  </div>
                </div>
                
                {/* ========== Message Seller Button ========== */}
                <button
                  onClick={handleMessageSubmit}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-md"
                  disabled={!isAuthenticated || !data.shop?._id}
                >
                  <AiOutlineMessage className="mr-2 text-xl" />
                  {isAuthenticated ? "Message Seller" : "Login to Message Seller"}
                </button>
                {!data.shop?._id && isAuthenticated && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Unable to contact seller: Shop information missing
                  </p>
                )}
                {isAuthenticated && data.shop?._id && (
                  <p className="text-gray-500 text-xs mt-2 text-center">
                    Click to start a new chat with the seller
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Info Sections */}
        <ProductDetailsInfo
          data={data}
          shopProducts={shopProducts}
          shopStats={shopStats}
          getImageUrl={getImageUrl}
          productAverageRating={productAverageRating}
          productTotalReviews={productTotalReviews}
          handleMessageSubmit={handleMessageSubmit}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  shopProducts,
  shopStats,
  getImageUrl,
  productAverageRating,
  productTotalReviews,
  handleMessageSubmit,
  isAuthenticated
}) => {
  const [active, setActive] = useState(1);

  return (
    <div className="bg-[#f5f6fb] px-3 800px:px-10 py-2 rounded mt-6">
      <div className="w-full flex justify-between border-b pt-6 pb-2">
        <button
          className={`text-lg font-medium px-4 py-2 transition-all ${active === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActive(1)}
        >
          Product Details
        </button>

        <button
          className={`text-lg font-medium px-4 py-2 transition-all ${active === 2 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActive(2)}
        >
          Product Reviews
        </button>

        <button
          className={`text-lg font-medium px-4 py-2 transition-all ${active === 3 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActive(3)}
        >
          Seller Information
        </button>
      </div>

      {active === 1 && (
        <div className="py-6">
          <h3 className="text-xl font-bold mb-4">Product Description</h3>
          <div className="prose max-w-none">
            {data.description ? (
              <div className="space-y-4">
                <p className="whitespace-pre-line">{data.description}</p>
                {data.tags && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.split(',').map((tag, index) => (
                        <span key={index} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No description available.</p>
            )}
          </div>
        </div>
      )}

      {active === 2 && (
        <div className="py-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold">Customer Reviews</h3>
            <div className="flex items-center mt-2">
              <div className="text-2xl font-bold">{productAverageRating}</div>
              <div className="ml-3">
                <Ratings rating={parseFloat(productAverageRating)} />
                <p className="text-gray-600 text-sm">
                  {productTotalReviews} review{productTotalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          
          {data.reviews && data.reviews.length > 0 ? (
            <div className="space-y-4">
              {data.reviews.map((review, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center mb-2">
                    <img
                      src={getImageUrl(review?.user?.avatar)}
                      alt={review.user?.name || "User"}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${backend_url}/uploads/default-avatar.jpg`;
                      }}
                    />
                    <div>
                      <h4 className="font-bold">{review.user?.name || "Anonymous"}</h4>
                      <div className="flex items-center">
                        <Ratings rating={review.rating} />
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date not available"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No reviews yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Be the first to review this product!
              </p>
            </div>
          )}
        </div>
      )}

      {active === 3 && (
        <div className="py-6">
          <h3 className="text-xl font-bold mb-4">Seller Information</h3>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <img
                src={getImageUrl(data?.shop?.avatar)}
                alt={data.shop?.name || "Shop"}
                className="w-16 h-16 rounded-full mr-4 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${backend_url}/uploads/default-shop.jpg`;
                }}
              />
              <div>
                <h4 className="text-lg font-bold">{data.shop?.name || "Unknown Shop"}</h4>
                <p className="text-gray-600">{data.shop?.description || "No description available"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-gray-500 text-sm">Joined</p>
                <p className="font-medium">
                  {data.shop?.createdAt ? 
                    new Date(data.shop.createdAt).toLocaleDateString() : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Products</p>
                <p className="font-medium">{shopProducts?.length || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Shop Rating</p>
                <p className="font-medium">{shopStats.averageRating}/5</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Shop Reviews</p>
                <p className="font-medium">{shopStats.totalReviews}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Link to={`/shop/preview/${data.shop._id}`} className="flex-1">
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-medium">
                  Visit Shop
                </button>
              </Link>
              
              <button
                onClick={handleMessageSubmit}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={!isAuthenticated || !data.shop?._id}
              >
                <AiOutlineMessage className="inline mr-2" />
                {isAuthenticated ? "Message Seller" : "Login to Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;