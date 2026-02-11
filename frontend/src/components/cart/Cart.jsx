import React, { useState } from "react";
import { RxCross1 } from "react-icons/rx";
import styles from "../../styles/styles";
import { Link } from "react-router-dom";
import { IoBagHandleOutline } from "react-icons/io5";
import { HiOutlineMinus, HiPlus } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { backend_url } from "../../server";
import { addTocart, removeFromCart } from "../../redux/actions/cart";

const Cart = ({ setOpenCart }) => {
  const { cart } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  // Function to get correct image URL
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/130x130?text=No+Image";
    }
    
    if (typeof image === 'string') {
      // If it's already a full URL (from backend), return it
      if (image.startsWith("http")) {
        return image;
      }
      
      // If it's just a filename without path
      if (!image.includes('/')) {
        return `${backend_url}/uploads/${image}`;
      }
      
      // If it already includes uploads path
      if (image.includes('uploads/')) {
        return `${backend_url}/${image}`;
      }
      
      // Default: construct the URL
      return `${backend_url}/uploads/${image}`;
    }
    
    return "https://via.placeholder.com/130x130?text=Image+Error";
  };

  //remove from cart
  const removeFromCartHandler = (data) => {
    dispatch(removeFromCart(data));
  };

  // Total price
  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.qty || 1) * (item.discountPrice || item.originalPrice || 0),
    0
  );

  const quantityChangeHandler = (data) => {
    dispatch(addTocart(data));
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-50">
      <div className="fixed top-0 right-0 h-full w-[90%] 400px:w-[80%] 600px:w-[60%] 800px:w-[35%] lg:w-[25%] bg-white flex flex-col overflow-y-auto shadow-sm">
        {cart && cart.length === 0 ? (
          <div className="w-full h-screen flex flex-col items-center justify-center">
            <div className="flex w-full justify-end pt-5 pr-5 fixed top-3 right-3">
              <RxCross1
                size={25}
                className="cursor-pointer hover:text-red-500 transition-colors"
                onClick={() => setOpenCart(false)}
              />
            </div>
            <div className="text-center">
              <IoBagHandleOutline size={60} className="mx-auto text-gray-400 mb-4" />
              <h5 className="text-xl font-medium text-gray-600">Your cart is empty!</h5>
              <p className="text-gray-400 mt-2">Add some items to get started</p>
              <button
                onClick={() => setOpenCart(false)}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex w-full justify-between items-center p-5 border-b">
                <div className="flex items-center">
                  <IoBagHandleOutline size={25} className="text-blue-600" />
                  <h5 className="pl-2 text-[20px] font-[600]">
                    {cart && cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </h5>
                </div>
                <RxCross1
                  size={25}
                  className="cursor-pointer hover:text-red-500 transition-colors"
                  onClick={() => setOpenCart(false)}
                />
              </div>

              {/* Cart Items */}
              <div className="p-4 space-y-4">
                {cart &&
                  cart.map((item, index) => (
                    <CartSingle
                      key={index}
                      data={item}
                      quantityChangeHandler={quantityChangeHandler}
                      removeFromCartHandler={removeFromCartHandler}
                      getImageUrl={getImageUrl}
                    />
                  ))}
              </div>
            </div>

            <div className="mt-auto p-5 border-t bg-gray-50">
              {/* Cart Summary */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between mb-4 text-lg font-bold">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Check out btn */}
              <Link 
                to="/checkout" 
                onClick={() => setOpenCart(false)}
                className="block"
              >
                <div
                  className={`h-[50px] flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors`}
                >
                  <h1 className="text-white text-[18px] font-[600]">
                    Checkout Now (${totalPrice.toFixed(2)})
                  </h1>
                </div>
              </Link>
              
              <button
                onClick={() => setOpenCart(false)}
                className="w-full h-[45px] mt-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700 font-medium">Continue Shopping</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CartSingle = ({ data, quantityChangeHandler, removeFromCartHandler, getImageUrl }) => {
  const [value, setValue] = useState(data.qty || 1);
  
  // Get the first image or use placeholder
  const productImage = data.images && data.images.length > 0 ? data.images[0] : null;
  const imageUrl = getImageUrl(productImage);
  
  const price = data.discountPrice || data.originalPrice || 0;
  const totalPrice = price * value;

  const increment = () => {
    if (data.stock && data.stock <= value) {
      toast.error("Product stock limited!");
      return;
    }
    const newValue = value + 1;
    setValue(newValue);
    const updateCartData = { ...data, qty: newValue };
    quantityChangeHandler(updateCartData);
  };

  const decrement = () => {
    const newValue = value > 1 ? value - 1 : 1;
    setValue(newValue);
    const updateCartData = { ...data, qty: newValue };
    quantityChangeHandler(updateCartData);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
      {/* Product Image */}
      <div className="flex-shrink-0 mr-3">
        <img
          src={imageUrl}
          className="w-[80px] h-[80px] object-cover rounded-md"
          alt={data.name || "Product"}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/80x80?text=Product";
          }}
        />
      </div>
      
      {/* Product Info */}
      <div className="flex-grow">
        <h3 className="font-medium text-gray-900 line-clamp-1">{data.name}</h3>
        <p className="text-sm text-gray-500">${price.toFixed(2)} each</p>
        
        {/* Quantity Controls */}
        <div className="flex items-center mt-2">
          <button
            onClick={decrement}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-l hover:bg-gray-100"
            disabled={value <= 1}
          >
            <HiOutlineMinus size={14} />
          </button>
          <span className="w-10 h-7 flex items-center justify-center border-t border-b border-gray-300 text-sm">
            {value}
          </span>
          <button
            onClick={increment}
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-r hover:bg-gray-100"
            disabled={data.stock && data.stock <= value}
          >
            <HiPlus size={14} />
          </button>
        </div>
      </div>
      
      {/* Price and Remove */}
      <div className="flex flex-col items-end justify-between h-full ml-2">
        <button
          onClick={() => removeFromCartHandler(data)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Remove item"
        >
          <RxCross1 size={18} />
        </button>
        <div className="text-right mt-2">
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-bold text-blue-600">${totalPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;