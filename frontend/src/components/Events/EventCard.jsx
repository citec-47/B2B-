// EventCard.jsx - Updated with modal functionality
import React, { useState } from "react";
import CountDown from "./CountDown";
import { useDispatch, useSelector } from "react-redux";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import EventModal from "./EventModal";

const EventCard = ({ active, data }) => {
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = () => {
    console.log("🖱️ EventCard clicked:", data?.name);
    setShowModal(true);
  };

  const addToCartHandler = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    
    if (data && data._id) {
      const isItemExists = cart && cart.find((i) => i._id === data._id);
      if (isItemExists) {
        toast.error("Event already in cart!");
      } else {
        if (data.stock < 1) {
          toast.error("Event stock limited!");
        } else {
          const cartData = { ...data, qty: 1 };
          dispatch(addTocart(cartData));
          toast.success("Event added to cart successfully!");
        }
      }
    }
  };

  const firstImage = data?.images?.[0] || "https://via.placeholder.com/400x300?text=No+Image";

  return (
    <>
      <div 
        className="w-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer active:scale-[0.98]"
        onClick={handleCardClick}
      >
        <div className="relative h-48 bg-gray-100">
          <img 
            src={firstImage} 
            alt={data?.name || "Event"} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x300/ef4444/ffffff?text=Image+Error";
            }}
          />
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            EVENT
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg truncate mb-2 hover:text-blue-600 transition-colors">
            {data?.name || "Unnamed Event"}
          </h3>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-xl font-bold text-blue-600">
              US$ {data?.discountPrice || data?.originalPrice || 0}
            </span>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {data?.sold_out || 0} sold
            </span>
          </div>
          
          <div className="mb-4">
            <CountDown data={data} />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Stock: <span className="font-bold">{data?.stock || 0}</span>
            </span>
            <button
              onClick={addToCartHandler}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors hover:scale-105 active:scale-95"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <EventModal 
          event={data} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
};

export default EventCard;