import React, { useState } from "react";
import styles from "../../styles/styles";
import { Country, State } from "country-state-city";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import CheckoutSteps from "./CheckoutSteps";

const Checkout = () => {
    const { user, isAuthenticated } = useSelector((state) => state.user || {});
    const { cart } = useSelector((state) => state.cart || { cart: [] });
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [userInfo, setUserInfo] = useState(false);
    const [address1, setAddress1] = useState("");
    const [address2, setAddress2] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [couponCode, setCouponCode] = useState("");
    const [couponCodeData, setCouponCodeData] = useState(null);
    const [discountPrice, setDiscountPrice] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        
        // Check authentication
        if (!isAuthenticated || !user) {
            console.log("❌ User not authenticated, redirecting to login");
            toast.error("Please login to continue with checkout");
            navigate("/login");
            return;
        }

        // Check if cart is empty
        if (!cart || cart.length === 0) {
            toast.error("Your cart is empty");
            navigate("/cart");
            return;
        }

        if (user?.phoneNumber) {
            setPhoneNumber(user.phoneNumber);
        }
    }, [user, isAuthenticated, navigate, cart]);

    // Calculate subtotal
    const calculateSubtotal = () => {
        if (!cart || !Array.isArray(cart)) return 0;
        
        return cart.reduce((acc, item) => {
            if (!item) return acc;
            const qty = Number(item.qty) || 0;
            const price = Number(item.discountPrice || item.price || 0);
            return acc + (qty * price);
        }, 0);
    };

    const subTotalPrice = calculateSubtotal();
    const shipping = subTotalPrice * 0.1;

    const paymentSubmit = () => {
        // Validate authentication
        if (!isAuthenticated || !user) {
            toast.error("Please login to continue with payment");
            navigate("/login");
            return;
        }

        // Validate cart
        if (!cart || cart.length === 0) {
            toast.error("Your cart is empty");
            navigate("/cart");
            return;
        }

        // Validate required fields
        const requiredFields = [
            { field: address1, message: "Address 1 is required" },
            { field: zipCode, message: "Zip code is required" },
            { field: country, message: "Country is required" },
            { field: city, message: "City is required" },
            { field: phoneNumber, message: "Phone number is required" }
        ];

        for (const { field, message } of requiredFields) {
            if (!field || !field.toString().trim()) {
                toast.error(message);
                return;
            }
        }

        // Prepare shipping address
        const shippingAddress = {
            address1: address1.trim(),
            address2: address2.trim(),
            zipCode: zipCode.trim(),
            country,
            city,
        };

        // Prepare order data
        const orderData = {
            cart: Array.isArray(cart) ? cart.map(item => ({
                _id: item._id,
                name: item.name,
                qty: item.qty,
                price: item.price,
                discountPrice: item.discountPrice,
                shopId: item.shopId,
                shopName: item.shop?.name || item.shopName,
                images: item.images,
                productId: item.productId || item._id
            })) : [],
            totalPrice: parseFloat(totalPrice) || 0,
            subTotalPrice: subTotalPrice || 0,
            shipping: shipping || 0,
            discountPrice: discountPrice || 0,
            shippingAddress,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: phoneNumber.trim()
            },
        };

        console.log("💾 Saving order data:", orderData);
        
        try {
            // Save to localStorage
            localStorage.setItem("latestOrder", JSON.stringify(orderData));
            
            // Show success message
            toast.success("Order details saved! Redirecting to payment...");
            
            // Navigate to payment page
            setTimeout(() => {
                navigate("/payment");
            }, 500);
            
        } catch (error) {
            console.error("❌ Error saving order data:", error);
            toast.error("Failed to save order data. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = couponCode.trim();
        
        if (!name) {
            toast.error("Please enter a coupon code");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(
                `${server}/coupon/get-coupon-value/${name}`,
                { withCredentials: true }
            );
            
            if (response?.data) {
                const couponData = response.data.couponCode;
                const couponCodeValue = response.data.couponCode?.value;

                if (couponData) {
                    const shopId = couponData.shopId;
                    
                    // Check if cart has items from this shop
                    const validCartItems = Array.isArray(cart) ? cart.filter((item) => {
                        return item && item.shopId === shopId;
                    }) : [];

                    if (validCartItems.length === 0) {
                        toast.error("Coupon code is not valid for items in your cart");
                        setCouponCode("");
                    } else {
                        const eligiblePrice = validCartItems.reduce((acc, item) => {
                            const qty = Number(item.qty) || 0;
                            const price = Number(item.discountPrice || item.price || 0);
                            return acc + (qty * price);
                        }, 0);
                        
                        const discountPriceValue = (eligiblePrice * couponCodeValue) / 100;
                        setDiscountPrice(discountPriceValue);
                        setCouponCodeData(couponData);
                        setCouponCode("");
                        toast.success(`Coupon applied! Discount: $${discountPriceValue.toFixed(2)}`);
                    }
                } else {
                    toast.error("Coupon code doesn't exist!");
                    setCouponCode("");
                }
            } else {
                toast.error("Invalid response from server");
                setCouponCode("");
            }
        } catch (error) {
            console.error("Coupon API error:", error);
            toast.error(error.response?.data?.message || "Failed to validate coupon code");
            setCouponCode("");
        } finally {
            setLoading(false);
        }
    };

    const discountPercentenge = couponCodeData ? (discountPrice || 0) : 0;
    const totalPrice = (subTotalPrice + shipping - discountPercentenge).toFixed(2);

    return (
        <div className="w-full flex flex-col items-center py-8">
            <div className="w-full mb-8">
                <CheckoutSteps active={1} />
            </div>
            
            <div className="w-[90%] 1000px:w-[70%] block 800px:flex">
                <div className="w-full 800px:w-[65%]">
                    <ShippingInfo
                        user={user}
                        country={country}
                        setCountry={setCountry}
                        city={city}
                        setCity={setCity}
                        userInfo={userInfo}
                        setUserInfo={setUserInfo}
                        address1={address1}
                        setAddress1={setAddress1}
                        address2={address2}
                        setAddress2={setAddress2}
                        zipCode={zipCode}
                        setZipCode={setZipCode}
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                    />
                </div>
                <div className="w-full 800px:w-[35%] 800px:mt-0 mt-8">
                    <CartData
                        handleSubmit={handleSubmit}
                        totalPrice={totalPrice}
                        shipping={shipping}
                        subTotalPrice={subTotalPrice}
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        discountPercentenge={discountPercentenge}
                        loading={loading}
                    />
                </div>
            </div>
            
            <button
                className={`${styles.button} w-[150px] 800px:w-[280px] mt-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300`}
                onClick={paymentSubmit}
                type="button"
                disabled={loading}
            >
                <h5 className="text-white font-medium">
                    {loading ? "Processing..." : "Go to Payment"}
                </h5>
            </button>
        </div>
    );
};

const ShippingInfo = ({
    user,
    country,
    setCountry,
    city,
    setCity,
    userInfo,
    setUserInfo,
    address1,
    setAddress1,
    address2,
    setAddress2,
    zipCode,
    setZipCode,
    phoneNumber,
    setPhoneNumber,
}) => {
    return (
        <div className="w-full 800px:w-[95%] bg-white rounded-xl p-6 pb-8 shadow-lg">
            <h5 className="text-2xl font-bold text-gray-800 mb-6">Shipping Address</h5>
            <form>
                <div className="w-full flex flex-col 800px:flex-row gap-4 pb-4">
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            value={user?.name || ""}
                            required
                            readOnly
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            required
                            readOnly
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                </div>

                <div className="w-full flex flex-col 800px:flex-row gap-4 pb-4">
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Phone Number *</label>
                        <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Enter your phone number"
                        />
                        <p className="text-sm text-gray-500 mt-1">Required for delivery updates</p>
                    </div>
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Zip Code *</label>
                        <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Enter zip code"
                        />
                    </div>
                </div>

                <div className="w-full flex flex-col 800px:flex-row gap-4 pb-4">
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Country *</label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                        >
                            <option value="">Choose your country</option>
                            {Country &&
                                Country.getAllCountries().map((item) => (
                                    <option key={item.isoCode} value={item.isoCode}>
                                        {item.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">City *</label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={!country}
                            required
                        >
                            <option value="">{country ? "Choose your city" : "Select country first"}</option>
                            {State && country &&
                                State.getStatesOfCountry(country).map((item) => (
                                    <option key={item.isoCode} value={item.isoCode}>
                                        {item.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="w-full flex flex-col 800px:flex-row gap-4 pb-4">
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Address 1 *</label>
                        <input
                            type="text"
                            required
                            value={address1}
                            onChange={(e) => setAddress1(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Street address, P.O. Box, etc."
                        />
                    </div>
                    <div className="w-full 800px:w-1/2">
                        <label className="block pb-2 font-medium text-gray-700">Address 2</label>
                        <input
                            type="text"
                            value={address2}
                            onChange={(e) => setAddress2(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Apartment, suite, unit, etc. (optional)"
                        />
                    </div>
                </div>

                {user?.addresses && user.addresses.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div 
                            className="flex items-center cursor-pointer mb-4"
                            onClick={() => setUserInfo(!userInfo)}
                        >
                            <h5 className="text-lg font-medium text-blue-600">
                                {userInfo ? "Hide saved addresses" : "Choose from saved addresses"}
                            </h5>
                            <span className="ml-2 text-blue-600">
                                {userInfo ? "▲" : "▼"}
                            </span>
                        </div>
                        
                        {userInfo && (
                            <div className="space-y-3">
                                {user.addresses.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setAddress1(item.address1 || "");
                                            setAddress2(item.address2 || "");
                                            setZipCode(item.zipCode || "");
                                            setCountry(item.country || "");
                                            setCity(item.city || "");
                                        }}
                                    >
                                        <div className="mr-3">
                                            <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{item.addressType || "Address"}</h3>
                                            <p className="text-sm text-gray-600">
                                                {item.address1 || ""} {item.address2 && `, ${item.address2}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {item.city || ""}, {item.country || ""} {item.zipCode && `- ${item.zipCode}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

const CartData = ({
    handleSubmit,
    totalPrice,
    shipping,
    subTotalPrice,
    couponCode,
    setCouponCode,
    discountPercentenge,
    loading
}) => {
    return (
        <div className="w-full bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h3>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${parseFloat(subTotalPrice || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">${parseFloat(shipping || 0).toFixed(2)}</span>
                </div>
                
                {discountPercentenge > 0 && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">-${parseFloat(discountPercentenge || 0).toFixed(2)}</span>
                    </div>
                )}
                
                <div className="border-t border-gray-300 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total:</span>
                        <span className="text-xl font-bold text-blue-600">${parseFloat(totalPrice || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-800 mb-3">Apply Coupon Code</h4>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Applying..." : "Apply Code"}
                    </button>
                </form>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Free shipping on orders over $100</span>
                    </div>
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>30-day return policy</span>
                    </div>
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Secure payment processing</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;