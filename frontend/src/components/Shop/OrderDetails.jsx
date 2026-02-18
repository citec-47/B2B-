import React, { useEffect, useState } from "react";
import styles from "../../styles/styles";
import { BsFillBagFill } from "react-icons/bs";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backend_url, server } from "../../server";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { useDispatch, useSelector } from "react-redux";

const OrderDetails = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();

  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const { id } = useParams();

  useEffect(() => {
    if (seller && seller._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller]);

  const data = orders && orders.find((item) => item._id === id);

  // Utility function to ensure image URLs are properly formatted - EXACTLY LIKE AllProducts.jsx
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/120x120?text=No+Image";
    }
    
    // If it's already a full URL, return it
    if (image.startsWith("http")) {
      return image;
    }
    
    // If it's just a filename, construct the full URL
    // Use environment variable or default to localhost for development
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    return `${backendUrl}/uploads/${image}`;
  };

  const orderUpdateHandler = async (e) => {
    await axios
      .put(
        `${server}/order/update-order-status/${id}`,
        {
          status,
        },
        { withCredentials: true }
      )
      .then((res) => {
        toast.success("Order updated!");
        navigate("/dashboard-orders");
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  const refundOrderUpdateHandler = async (e) => {
    await axios
      .put(
        `${server}/order/order-refund-success/${id}`,
        {
          status,
        },
        { withCredentials: true }
      )
      .then((res) => {
        toast.success("Order updated!");
        dispatch(getAllOrdersOfShop(seller._id));
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  return (
    <div className={`py-4 min-h-screen ${styles.section}`}>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center">
          <BsFillBagFill size={30} color="crimson" />
          <h1 className="pl-2 text-[25px]">Order Details</h1>
        </div>
        <Link to="/dashboard-orders">
          <div
            className={`${styles.button} !bg-[#fce1e6] !rounded-[4px] text-[#e94560] font-[600] !h-[45px] text-[18px]`}
          >
            Order List
          </div>
        </Link>
      </div>

      <div className="w-full flex items-center justify-between pt-6">
        <h5 className="text-[#00000084]">
          order ID: <span>#{data?._id?.slice(0, 8)}</span>
        </h5>
        <h5 className="text-[#000000084]">
          Placed On: <span>{data?.createdAt?.slice(0, 10)}</span>
        </h5>
      </div>

      {/* Order Items - USING SAME IMAGE HANDLING AS AllProducts.jsx */}
      <br />
      <br />
      {data && data?.cart?.length > 0 ? (
        data.cart.map((item, index) => {
          // Get the image URL EXACTLY like AllProducts.jsx
          const imageUrl = item.images && item.images.length > 0 
            ? getImageUrl(item.images[0])
            : "https://via.placeholder.com/80x80?text=No+Image";
          
          return (
            <div key={index} className="w-full flex items-start mb-5">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item.name || "Product"}
                  className="w-[80px] h-[80px] object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/80x80?text=Image+Error";
                  }}
                />
                {item.qty > 1 && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                    ×{item.qty}
                  </div>
                )}
              </div>
              <div className="w-full ml-4">
                <h5 className="text-[20px] font-semibold">{item.name}</h5>
                <h5 className="text-[18px] text-[#00000091]">
                  US${item.discountPrice || item.price || 0} x {item.qty || 1}
                </h5>
                <h5 className="text-[16px] text-[#00000091]">
                  Subtotal: US${((item.discountPrice || item.price || 0) * (item.qty || 1)).toFixed(2)}
                </h5>
                {item.color && (
                  <h5 className="text-[16px] text-[#00000091]">
                    Color: <span className="font-medium">{item.color}</span>
                  </h5>
                )}
                {item.size && (
                  <h5 className="text-[16px] text-[#00000091]">
                    Size: <span className="font-medium">{item.size}</span>
                  </h5>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No items found in this order</p>
        </div>
      )}
      
      <div className="border-t w-full text-right pt-4">
        <h5 className="text-[20px]">
          Total Price: <strong>US${data?.totalPrice ? data.totalPrice.toFixed(2) : "0.00"}</strong>
        </h5>
      </div>
      <br />
      <br />

      {/* Shipping Address */}
      <div className="w-full 800px:flex items-center">
        <div className="w-full 800px:w-[60%]">
          <h4 className="pt-3 text-[20px] font-[600]">Shipping Address:</h4>
          <h4 className="pt-3 text-[20px]">
            {data?.shippingAddress?.address1 || "Address not provided"}
            {data?.shippingAddress?.address2 && `, ${data.shippingAddress.address2}`}
          </h4>
          <h4 className="text-[20px]">{data?.shippingAddress?.country || "Country not provided"}</h4>
          <h4 className="text-[20px]">{data?.shippingAddress?.city || "City not provided"}</h4>
          <h4 className="text-[20px]">{data?.user?.phoneNumber || "Phone not provided"}</h4>
        </div>

        <div className="w-full 800px:w-[40%] mt-4 800px:mt-0">
          <h4 className="pt-3 text-[20px] font-[600]">Payment Info:</h4>
          <h4 className="text-[20px]">
            Status:{" "}
            <span className={
              data?.paymentInfo?.status === "Paid" 
                ? "text-green-600 font-semibold" 
                : "text-red-600 font-semibold"
            }>
              {data?.paymentInfo?.status || "Not Paid"}
            </span>
          </h4>
        </div>
      </div>
      <br />
      <br />

      <h4 className="pt-3 text-[20px] font-[600]">Order Status:</h4>
      {data?.status && data?.status !== "Processing refund" &&
        data?.status !== "Refund Success" && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-[200px] mt-2 border h-[35px] rounded-[5px] px-2"
          >
            {[
              "Processing",
              "Transferred to delivery partner",
              "Shipping",
              "Received",
              "On the way",
              "Delivered",
            ]
              .slice(
                [
                  "Processing",
                  "Transferred to delivery partner",
                  "Shipping",
                  "Received",
                  "On the way",
                  "Delivered",
                ].indexOf(data?.status)
              )
              .map((option, index) => (
                <option value={option} key={index}>
                  {option}
                </option>
              ))}
          </select>
        )}

      {data?.status && (data?.status === "Processing refund" ||
      data?.status === "Refund Success") ? (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-[200px] mt-2 border h-[35px] rounded-[5px] px-2"
        >
          {["Processing refund", "Refund Success"]
            .slice(
              ["Processing refund", "Refund Success"].indexOf(data?.status)
            )
            .map((option, index) => (
              <option value={option} key={index}>
                {option}
              </option>
            ))}
        </select>
      ) : null}

      <div
        className={`${styles.button} mt-5 !bg-[#FCE1E6] !rounded-[4px] text-[#E94560] font-[600] !h-[45px] text-[18px] cursor-pointer`}
        onClick={
          data?.status !== "Processing refund"
            ? orderUpdateHandler
            : refundOrderUpdateHandler
        }
      >
        Update Status
      </div>
    </div>
  );
};

export default OrderDetails;