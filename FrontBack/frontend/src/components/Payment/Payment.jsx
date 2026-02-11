// Components/Payment/Payment.jsx - COMPLETE UPDATED VERSION WITH FIXED AUTH
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CardNumberElement,
    CardCvcElement,
    CardExpiryElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useSelector } from "react-redux";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { RxCross1 } from "react-icons/rx";
import CheckoutSteps from "../Checkout/CheckoutSteps";

const Payment = () => {
    const [orderData, setOrderData] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();

    // Debug logs
    console.log('🔍 Payment Component Mounted');
    console.log('👤 Redux User State:', user);
    console.log('📦 Latest Order:', localStorage.getItem('latestOrder'));
    
    // Create axios config with token
    const createAxiosConfig = (additionalHeaders = {}) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const config = {
            headers: {
                "Content-Type": "application/json",
                ...additionalHeaders
            },
            withCredentials: true
        };
        
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        
        console.log('📡 Axios Config:', {
            hasToken: !!token,
            withCredentials: true
        });
        
        return config;
    };

    useEffect(() => {
        console.log('🔐 Payment - Starting authentication check');
        
        // SIMPLE AND EFFECTIVE AUTH CHECK:
        // Check if user exists in Redux store with proper authentication data
        if (!user || !user._id || !user.isAuthenticated) {
            console.log('❌ User not authenticated in Redux store');
            console.log('User object:', user);
            
            // Also check localStorage as fallback
            const localStorageUser = localStorage.getItem('user');
            if (localStorageUser) {
                try {
                    const parsedUser = JSON.parse(localStorageUser);
                    if (parsedUser && parsedUser._id) {
                        console.log('✅ Found user in localStorage, proceeding');
                        // User found in localStorage, continue with order loading
                        loadOrderData();
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing localStorage user:', e);
                }
            }
            
            toast.error("Please login to continue with payment");
            navigate("/login", { 
                state: { 
                    from: "/payment",
                    message: "Please login to complete your payment"
                } 
            });
            setLoading(false);
            return;
        }
        
        console.log('✅ User authenticated via Redux');
        loadOrderData();
        
        function loadOrderData() {
            const fetchOrderData = async () => {
                try {
                    const storedOrder = localStorage.getItem("latestOrder");
                    if (!storedOrder) {
                        toast.error("No order data found. Please complete checkout first.");
                        navigate("/checkout");
                        return;
                    }
                    
                    const parsedOrder = JSON.parse(storedOrder);
                    console.log("✅ Loaded order data:", parsedOrder);
                    
                    // Validate order data
                    if (!parsedOrder.cart || !parsedOrder.cart.length) {
                        toast.error("Cart is empty. Please add items to cart.");
                        navigate("/cart");
                        return;
                    }
                    
                    if (!parsedOrder.totalPrice || parsedOrder.totalPrice <= 0) {
                        toast.error("Invalid order total. Please try again.");
                        navigate("/checkout");
                        return;
                    }
                    
                    // Validate shipping address
                    if (!parsedOrder.shippingAddress || !parsedOrder.shippingAddress.address1) {
                        toast.error("Shipping address is required.");
                        navigate("/checkout");
                        return;
                    }
                    
                    // Ensure user data is attached to order
                    if (!parsedOrder.user) {
                        parsedOrder.user = user;
                    }
                    
                    setOrderData(parsedOrder);
                } catch (error) {
                    console.error("❌ Error parsing order data:", error);
                    toast.error("Error loading order data");
                    navigate("/checkout");
                } finally {
                    setLoading(false);
                }
            };

            fetchOrderData();
        }
    }, [navigate, user]); // Add user to dependencies

    // PayPal order creation
    const createOrder = (data, actions) => {
        if (!orderData?.totalPrice) {
            toast.error("Order amount is not available");
            return;
        }
        
        const amount = parseFloat(orderData.totalPrice).toFixed(2);
        console.log('💳 PayPal creating order for amount:', amount);
        
        return actions.order
            .create({
                purchase_units: [
                    {
                        description: "Order Purchase",
                        amount: {
                            currency_code: "USD",
                            value: amount,
                        },
                    },
                ],
                application_context: {
                    shipping_preference: "NO_SHIPPING",
                },
            })
            .then((orderID) => {
                console.log('✅ PayPal order created:', orderID);
                return orderID;
            })
            .catch((error) => {
                console.error('❌ PayPal order creation error:', error);
                toast.error("Failed to create PayPal order");
            });
    };

    // PayPal approval handler
    const onApprove = async (data, actions) => {
        console.log('✅ PayPal order approved:', data.orderID);
        return actions.order.capture().then(function (details) {
            console.log('💰 PayPal payment captured:', details);
            const { payer } = details;
            paypalPaymentHandler(payer);
        }).catch((error) => {
            console.error('❌ PayPal capture error:', error);
            toast.error("Failed to capture PayPal payment");
        });
    };

    // PayPal payment handler
    const paypalPaymentHandler = async (paymentInfo) => {
        setPaymentLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            toast.error("Authentication required. Please login again.");
            setPaymentLoading(false);
            navigate("/login");
            return;
        }
        
        const config = createAxiosConfig();
        
        const order = {
            cart: orderData?.cart || [],
            shippingAddress: orderData?.shippingAddress || {},
            user: user || {},
            totalPrice: orderData?.totalPrice || 0,
            subTotalPrice: orderData?.subTotalPrice || 0,
            shipping: orderData?.shipping || 0,
            discountPrice: orderData?.discountPrice || 0,
            paymentInfo: {
                id: paymentInfo.payer_id,
                status: "succeeded",
                type: "Paypal",
            },
        };

        try {
            console.log("📤 Sending PayPal order:", order);
            const response = await axios.post(`${server}/order/create-order`, order, config);
            console.log("✅ PayPal response:", response.data);
            
            setOpen(false);
            toast.success("Order successful!");
            
            // Clear local storage
            localStorage.setItem("cartItems", JSON.stringify([]));
            localStorage.setItem("latestOrder", JSON.stringify([]));
            
            // Navigate to success page
            navigate("/order/success");
            
        } catch (error) {
            console.error("❌ PayPal payment error:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error("Session expired. Please login again.");
                navigate("/login");
            } else {
                toast.error(error.response?.data?.message || "Payment failed. Please try again.");
            }
        } finally {
            setPaymentLoading(false);
        }
    };

    // Stripe card payment handler
    const paymentHandler = async (e) => {
        e.preventDefault();
        console.log('💳 Stripe payment handler triggered');
        setPaymentLoading(true);
        
        if (!stripe || !elements) {
            toast.error("Payment system not ready. Please try again.");
            setPaymentLoading(false);
            return;
        }

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            toast.error("Authentication required");
            setPaymentLoading(false);
            navigate("/login");
            return;
        }

        try {
            const config = createAxiosConfig();

            const paymentData = {
                amount: Math.round(parseFloat(orderData?.totalPrice) * 100) || 0,
            };

            console.log("📤 Sending payment request:", paymentData);
            
            // Step 1: Create payment intent
            const { data } = await axios.post(
                `${server}/payment/process`,
                paymentData,
                config
            );

            console.log("✅ Payment process response:", data);

            if (!data.client_secret) {
                throw new Error("No client secret received from server");
            }

            const client_secret = data.client_secret;

            // Step 2: Confirm card payment
            const result = await stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: elements.getElement(CardNumberElement),
                    billing_details: {
                        name: user?.name || "Customer",
                        email: user?.email || "",
                    },
                },
            });

            console.log("✅ Stripe payment result:", result);

            if (result.error) {
                console.error("❌ Stripe error:", result.error);
                toast.error(result.error.message);
                setPaymentLoading(false);
            } else {
                if (result.paymentIntent.status === "succeeded") {
                    const order = {
                        cart: orderData?.cart || [],
                        shippingAddress: orderData?.shippingAddress || {},
                        user: user || {},
                        totalPrice: orderData?.totalPrice || 0,
                        subTotalPrice: orderData?.subTotalPrice || 0,
                        shipping: orderData?.shipping || 0,
                        discountPrice: orderData?.discountPrice || 0,
                        paymentInfo: {
                            id: result.paymentIntent.id,
                            status: result.paymentIntent.status,
                            type: "Credit Card",
                        },
                    };

                    console.log("📤 Sending card order:", order);
                    
                    // Step 3: Create order in backend
                    const response = await axios.post(`${server}/order/create-order`, order, config);
                    console.log("✅ Card order response:", response.data);

                    toast.success("Order successful!");
                    
                    // Clear local storage
                    localStorage.setItem("cartItems", JSON.stringify([]));
                    localStorage.setItem("latestOrder", JSON.stringify([]));
                    
                    // Navigate to success page
                    navigate("/order/success");
                }
            }
        } catch (error) {
            console.error("❌ Payment error:", error);
            if (error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    toast.error("Session expired. Please login again.");
                    navigate("/login");
                } else {
                    toast.error(error.response.data?.message || `Server error: ${error.response.status}`);
                }
            } else if (error.request) {
                console.error("❌ No response received:", error.request);
                toast.error("No response from server. Please check if backend is running.");
            } else {
                toast.error(`Payment error: ${error.message}`);
            }
            setPaymentLoading(false);
        }
    };

    // Cash on Delivery handler
    const cashOnDeliveryHandler = async (e) => {
        e.preventDefault();
        console.log('💰 COD payment handler triggered');
        setPaymentLoading(true);

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            toast.error("Authentication required");
            setPaymentLoading(false);
            navigate("/login");
            return;
        }

        const config = createAxiosConfig();

        const order = {
            cart: orderData?.cart || [],
            shippingAddress: orderData?.shippingAddress || {},
            user: user || {},
            totalPrice: orderData?.totalPrice || 0,
            subTotalPrice: orderData?.subTotalPrice || 0,
            shipping: orderData?.shipping || 0,
            discountPrice: orderData?.discountPrice || 0,
            paymentInfo: {
                type: "Cash On Delivery",
                status: "Pending"
            },
        };

        try {
            console.log("📤 Sending COD order:", order);
            const response = await axios.post(`${server}/order/create-order`, order, config);
            console.log("✅ COD response:", response.data);

            toast.success("Order placed successfully!");
            
            // Clear local storage
            localStorage.setItem("cartItems", JSON.stringify([]));
            localStorage.setItem("latestOrder", JSON.stringify([]));
            
            // Navigate to success page
            navigate("/order/success");
            
        } catch (error) {
            console.error("❌ COD error:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error("Session expired. Please login again.");
                navigate("/login");
            } else {
                toast.error(error.response?.data?.message || "Order creation failed");
            }
            setPaymentLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="w-full flex justify-center items-center py-20 min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-6 text-lg text-gray-700 font-medium">Loading payment details...</p>
                    <p className="mt-2 text-sm text-gray-500">Checking authentication and order information</p>
                </div>
            </div>
        );
    }

    // No order data state
    if (!orderData) {
        return (
            <div className="w-full flex justify-center items-center py-20 min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Order Data Found</h3>
                    <p className="text-gray-600 mb-6">Please complete the checkout process first</p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => navigate("/checkout")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                        >
                            Go to Checkout
                        </button>
                        <button 
                            onClick={() => navigate("/cart")}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                        >
                            Back to Cart
                        </button>
                        <button 
                            onClick={() => navigate("/")}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center py-8 min-h-screen bg-gray-50">
            <div className="w-full max-w-6xl mb-8">
                <CheckoutSteps active={2} />
            </div>
            
            <div className="w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <PaymentInfo
                        user={user}
                        open={open}
                        setOpen={setOpen}
                        onApprove={onApprove}
                        createOrder={createOrder}
                        paymentHandler={paymentHandler}
                        cashOnDeliveryHandler={cashOnDeliveryHandler}
                        paymentLoading={paymentLoading}
                    />
                </div>
                <div className="lg:col-span-1">
                    <CartData
                        orderData={orderData}
                    />
                </div>
            </div>
            
            {/* Debug info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
                    <p className="font-medium mb-2">Debug Info:</p>
                    <p>User ID: {user?._id || 'No ID'}</p>
                    <p>User Name: {user?.name || 'No Name'}</p>
                    <p>User Authenticated: {user?.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
                    <p>Order Items: {orderData?.cart?.length || 0}</p>
                    <p>Total: ${orderData?.totalPrice || 0}</p>
                </div>
            )}
        </div>
    );
};

const PaymentInfo = ({
    user,
    open,
    setOpen,
    onApprove,
    createOrder,
    paymentHandler,
    cashOnDeliveryHandler,
    paymentLoading,
}) => {
    const [select, setSelect] = useState(1);

    return (
        <div className="w-full bg-white rounded-xl p-6 pb-8 shadow-lg">
            {/* Payment Loading Overlay */}
            {paymentLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h3>
                            <p className="text-gray-600 text-center mb-6">Please wait while we process your payment. Do not refresh or close this page.</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{width: '60%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Payment Method Selection */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Payment Method</h2>
            
            {/* Credit/Debit Card */}
            <div className="mb-8">
                <div className="flex items-center mb-4 cursor-pointer" onClick={() => setSelect(1)}>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center mr-3">
                        {select === 1 ? (
                            <div className="w-3 h-3 bg-gray-800 rounded-full" />
                        ) : null}
                    </div>
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-gray-700 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800">Credit/Debit Card</h3>
                    </div>
                </div>

                {select === 1 && (
                    <div className="ml-9 mb-6">
                        <form onSubmit={paymentHandler}>
                            {/* Cardholder Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                                <input 
                                    required
                                    readOnly
                                    value={user?.name || ""}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                                />
                            </div>

                            {/* Card Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                    <CardNumberElement
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: "16px",
                                                    color: "#374151",
                                                    "::placeholder": {
                                                        color: "#9CA3AF",
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                                    <CardExpiryElement
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: "16px",
                                                    color: "#374151",
                                                    "::placeholder": {
                                                        color: "#9CA3AF",
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>

                            {/* CVV and Submit */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                    <CardCvcElement
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: "16px",
                                                    color: "#374151",
                                                    "::placeholder": {
                                                        color: "#9CA3AF",
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={paymentLoading}
                                        className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${
                                            paymentLoading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {paymentLoading ? 'Processing...' : 'Pay Now'}
                                    </button>
                                </div>
                            </div>
                        </form>
                        <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            <span>Secure SSL encryption & PCI compliant</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="flex items-center mb-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* PayPal */}
            <div className="mb-8">
                <div className="flex items-center mb-4 cursor-pointer" onClick={() => setSelect(2)}>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center mr-3">
                        {select === 2 ? (
                            <div className="w-3 h-3 bg-gray-800 rounded-full" />
                        ) : null}
                    </div>
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.818-1.22-4.694-1.685-7.925-1.685h-4.806a.896.896 0 0 0-.885 1.034l1.566 9.923a.897.897 0 0 0 .885.756h3.73c3.82 0 6.614-1.527 7.426-5.838.269-1.382.116-2.634-.56-3.65z"/>
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800">PayPal</h3>
                    </div>
                </div>

                {select === 2 && (
                    <div className="ml-9 mb-6">
                        <button
                            className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${
                                paymentLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => setOpen(true)}
                            disabled={paymentLoading}
                        >
                            Pay with PayPal
                        </button>
                        
                        {open && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-800">PayPal Checkout</h3>
                                            <button
                                                onClick={() => setOpen(false)}
                                                className="text-gray-500 hover:text-gray-700 transition"
                                            >
                                                <RxCross1 size={24} />
                                            </button>
                                        </div>
                                        <PayPalScriptProvider
                                            options={{
                                                "client-id": "test", // Use 'test' for sandbox
                                                currency: "USD",
                                                intent: "capture",
                                            }}
                                        >
                                            <PayPalButtons
                                                style={{ 
                                                    layout: "vertical",
                                                    color: "blue",
                                                    shape: "rect",
                                                    label: "paypal",
                                                    height: 48
                                                }}
                                                onApprove={onApprove}
                                                createOrder={createOrder}
                                                disabled={paymentLoading}
                                                onError={(err) => {
                                                    console.error('❌ PayPal error:', err);
                                                    toast.error("PayPal payment failed");
                                                    setOpen(false);
                                                }}
                                                onCancel={() => {
                                                    console.log('❌ PayPal payment cancelled');
                                                    setOpen(false);
                                                }}
                                            />
                                        </PayPalScriptProvider>
                                        <div className="mt-6 text-center">
                                            <p className="text-sm text-gray-500">
                                                You will be redirected to PayPal to complete your payment
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cash on Delivery */}
            <div>
                <div className="flex items-center mb-4 cursor-pointer" onClick={() => setSelect(3)}>
                    <div className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center mr-3">
                        {select === 3 ? (
                            <div className="w-3 h-3 bg-gray-800 rounded-full" />
                        ) : null}
                    </div>
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"></path>
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-800">Cash on Delivery</h3>
                    </div>
                </div>

                {select === 3 && (
                    <div className="ml-9">
                        <form onSubmit={cashOnDeliveryHandler}>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                    </svg>
                                    <div>
                                        <p className="text-sm text-yellow-700 font-medium">Important Note</p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            Please have the exact amount ready. Our delivery agent will collect payment upon delivery.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={paymentLoading}
                                className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${
                                    paymentLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {paymentLoading ? 'Processing...' : 'Confirm Cash on Delivery'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const CartData = ({ orderData }) => {
    if (!orderData) return null;
    
    const shipping = parseFloat(orderData?.shipping || 0).toFixed(2);
    const subTotalPrice = parseFloat(orderData?.subTotalPrice || 0).toFixed(2);
    const discountPrice = parseFloat(orderData?.discountPrice || 0).toFixed(2);
    const totalPrice = parseFloat(orderData?.totalPrice || 0).toFixed(2);

    return (
        <div className="w-full bg-white rounded-xl p-6 shadow-lg sticky top-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h3>
            
            <div className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${subTotalPrice}</span>
                </div>
                
                {/* Shipping */}
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                        {parseFloat(shipping) > 0 ? `$${shipping}` : 'FREE'}
                    </span>
                </div>
                
                {/* Discount */}
                {parseFloat(discountPrice) > 0 && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-semibold text-green-600">-${discountPrice}</span>
                    </div>
                )}
                
                {/* Divider */}
                <div className="border-t border-gray-300 my-4"></div>
                
                {/* Total */}
                <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">${totalPrice}</div>
                        <div className="text-sm text-gray-500">USD</div>
                    </div>
                </div>
            </div>
            
            {/* Order Items Preview */}
            {orderData.cart && orderData.cart.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Order Items ({orderData.cart.length})</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {orderData.cart.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                                    {item.images && item.images.length > 0 ? (
                                        <img 
                                            src={item.images[0]} 
                                            alt={item.name}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-800">
                                        ${((item.discountPrice || item.originalPrice || 0) * item.qty).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {orderData.cart.length > 3 && (
                            <div className="text-center py-2">
                                <p className="text-sm text-gray-500">
                                    + {orderData.cart.length - 3} more item(s)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Shipping Address */}
            {orderData.shippingAddress && (
                <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Shipping Address</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-800 font-medium">{orderData.shippingAddress.address1}</p>
                        {orderData.shippingAddress.address2 && (
                            <p className="text-sm text-gray-800">{orderData.shippingAddress.address2}</p>
                        )}
                        <p className="text-sm text-gray-600">
                            {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
                        </p>
                        <p className="text-sm text-gray-600">{orderData.shippingAddress.country}</p>
                    </div>
                </div>
            )}
            
            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-300">
                <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        Free shipping on orders over $100
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        30-day return policy
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        Secure payment processing
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        24/7 customer support
                    </div>
                </div>
            </div>
            
            {/* Need Help */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    Need help? <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default Payment;