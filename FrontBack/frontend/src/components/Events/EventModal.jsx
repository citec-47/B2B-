// Components/Event/EventModal.jsx
import React from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { addTocart } from "../../redux/actions/cart";
import { addToWishlist } from "../../redux/actions/wishlist";
import { toast } from "react-toastify";
import CountDown from "./CountDown";

const EventModal = ({ event, onClose }) => {
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  const isInCart = cart?.some(item => item._id === event._id);
  const isInWishlist = wishlist?.some(item => item._id === event._id);

  const handleAddToCart = () => {
    if (isInCart) {
      toast.error("Event already in cart!");
      return;
    }

    if (event.stock < 1) {
      toast.error("Event is out of stock!");
      return;
    }

    const cartData = { ...event, qty: 1 };
    dispatch(addTocart(cartData));
    toast.success("Event added to cart!");
  };

  const handleAddToWishlist = () => {
    if (isInWishlist) {
      toast.error("Event already in wishlist!");
      return;
    }

    dispatch(addToWishlist(event));
    toast.success("Event added to wishlist!");
  };

  const firstImage = event?.images?.[0] || "https://via.placeholder.com/600x400?text=No+Image";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-900"
        >
          <AiOutlineClose size={24} />
        </button>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side - Image */}
            <div className="relative">
              <img
                src={firstImage}
                alt={event.name}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600x400/ef4444/ffffff?text=Image+Error";
                }}
              />
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                EVENT
              </div>
            </div>
            
            {/* Right side - Details */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {event.name}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {event.description || "No description available."}
              </p>
              
              <div className="mb-4">
                <CountDown data={event} />
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Price:</span>
                  <div className="flex items-center gap-2">
                    {event.originalPrice > event.discountPrice && (
                      <span className="text-gray-500 line-through">
                        US$ {event.originalPrice}
                      </span>
                    )}
                    <span className="text-xl font-bold text-blue-600">
                      US$ {event.discountPrice || event.originalPrice || 0}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Stock:</span>
                  <span className={`font-semibold ${event.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {event.stock || 0} available
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Sold:</span>
                  <span className="font-semibold">
                    {event.sold_out || 0} sold
                  </span>
                </div>
                
                {event.shop?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Seller:</span>
                    <span className="font-semibold">
                      {event.shop.name}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium ${
                    isInCart
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isInCart ? 'Added to Cart' : 'Add to Cart'}
                </button>
                
                <button
                  onClick={handleAddToWishlist}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium ${
                    isInWishlist
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;