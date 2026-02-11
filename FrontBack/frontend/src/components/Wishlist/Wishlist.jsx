import React, { useState } from "react";
import { RxCross1 } from "react-icons/rx";
import styles from "../../styles/styles";
import { Link } from "react-router-dom";
import { BsCartPlus } from "react-icons/bs";
import { AiOutlineHeart, AiOutlineDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { backend_url } from "../../server";

const Wishlist = ({ setOpenWishlist }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const removeFromWishlistHandler = (data) => {
    dispatch(removeFromWishlist(data));
  };

  const addToCartHandler = (data) => {
    // Check if item already exists in cart
    const isItemExists = cart && cart.find((item) => item._id === data._id);
    
    if (isItemExists) {
      alert("Item already in cart!");
      return;
    }
    
    const newData = { ...data, qty: 1 };
    dispatch(addTocart(newData));
    setOpenWishlist(false);
  };

  // Calculate total value of wishlist items
  const calculateTotal = () => {
    return wishlist.reduce((total, item) => {
      const price = item.discountPrice || item.price || 0;
      return total + price;
    }, 0);
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-10">
      <div className="fixed top-0 right-0 h-full w-[80%] overflow-y-scroll 800px:w-[400px] bg-white flex flex-col shadow-sm">
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center p-5">
            <div className="flex items-center">
              <AiOutlineHeart size={25} className="text-red-500" />
              <h5 className="pl-2 text-[20px] font-[600]">
                My Wishlist ({wishlist?.length || 0})
              </h5>
            </div>
            <RxCross1
              size={25}
              className="cursor-pointer hover:bg-gray-100 rounded-full p-1"
              onClick={() => setOpenWishlist(false)}
            />
          </div>
          
          {wishlist && wishlist.length > 0 && (
            <div className="px-5 pb-3">
              <div className="text-sm text-gray-600">
                Total Value: <span className="font-bold text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {wishlist && wishlist.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <div className="w-24 h-24 mb-4">
              <AiOutlineHeart size={80} className="text-gray-300 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 text-center mb-6">
              Save items you love for later. They'll appear here.
            </p>
            <button
              onClick={() => setOpenWishlist(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              {wishlist &&
                wishlist.map((item, index) => {
                  return (
                    <CartSingle
                      key={item._id || index}
                      data={item}
                      removeFromWishlistHandler={removeFromWishlistHandler}
                      addToCartHandler={addToCartHandler}
                    />
                  );
                })}
            </div>
          </div>
        )}
        
        {wishlist && wishlist.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t p-5">
            <button
              onClick={() => setOpenWishlist(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors mb-3"
            >
              Continue Shopping
            </button>
            <p className="text-xs text-gray-500 text-center">
              Items are saved until you remove them
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const CartSingle = ({ data, removeFromWishlistHandler, addToCartHandler }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Format image URL like in Cart component
  const getImageUrl = (image) => {
    if (!image) return `${backend_url}/uploads/default-product.jpg`;
    
    if (typeof image === 'string') {
      // If it's already a full URL
      if (image.startsWith('http')) {
        return image;
      }
      // If it starts with /uploads, add backend_url
      if (image.startsWith('/uploads')) {
        return `${backend_url}${image}`;
      }
      // If it's just a filename
      return `${backend_url}/uploads/${image}`;
    }
    
    return `${backend_url}/uploads/default-product.jpg`;
  };

  // Get first image
  const mainImage = Array.isArray(data.images) && data.images.length > 0 
    ? getImageUrl(data.images[0])
    : getImageUrl(data.image);

  const price = data.discountPrice || data.price || 0;
  const originalPrice = data.price || 0;
  const hasDiscount = data.discountPrice && data.discountPrice < originalPrice;

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeFromWishlistHandler(data);
    }, 300);
  };

  const handleAddToCart = () => {
    addToCartHandler(data);
  };

  return (
    <div className={`relative bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-300 ${isRemoving ? 'opacity-50 scale-95' : ''}`}>
      <button
        onClick={handleRemove}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors z-10"
        title="Remove from wishlist"
      >
        <AiOutlineDelete size={16} />
      </button>
      
      <div className="flex space-x-4">
        {/* Product Image - Same style as Cart */}
        <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border">
          <Link to={`/product/${data._id}`}>
            <img
              src={mainImage}
              alt={data.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = `${backend_url}/uploads/default-product.jpg`;
              }}
            />
          </Link>
          
          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br">
              SAVE {Math.round(((originalPrice - data.discountPrice) / originalPrice) * 100)}%
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <Link to={`/product/${data._id}`}>
            <h3 className="font-medium text-gray-800 hover:text-blue-600 line-clamp-2 mb-1 text-sm">
              {data.name}
            </h3>
          </Link>
          
          {/* Price display like Cart */}
          <div className="mb-2">
            {hasDiscount ? (
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  ${data.discountPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Shop info if available */}
          {data.shop && (
            <div className="flex items-center mb-3">
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2 border">
                <img
                  src={data.shop.avatar ? getImageUrl(data.shop.avatar) : `${backend_url}/uploads/default-shop.jpg`}
                  alt={data.shop.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `${backend_url}/uploads/default-shop.jpg`;
                  }}
                />
              </div>
              <span className="text-xs text-gray-600">{data.shop.name}</span>
            </div>
          )}

          {/* Stock status */}
          <div className="mb-3">
            <span className={`text-xs px-2 py-1 rounded-full ${data.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {data.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleAddToCart}
              disabled={data.stock <= 0}
              className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center space-x-1 text-sm transition-colors ${
                data.stock > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <BsCartPlus size={16} />
              <span>Add to Cart</span>
            </button>
            
            <button
              onClick={handleRemove}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Remove"
            >
              <AiOutlineDelete size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;