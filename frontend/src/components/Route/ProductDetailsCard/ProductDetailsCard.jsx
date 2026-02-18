import React, { useEffect, useState } from 'react'
import {
    AiFillHeart,
    AiOutlineHeart,
    AiOutlineMessage,
    AiOutlineShoppingCart,
    AiFillStar,
    AiOutlineStar,
} from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import { Link } from "react-router-dom";
import { backend_url } from "../../../server";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify"
import { addTocart } from "../../../redux/actions/cart"
import { addToWishlist, removeFromWishlist } from '../../../redux/actions/wishlist';

const ProductDetailsCard = ({ setOpen, data }) => {
    const { cart } = useSelector((state) => state.cart);
    const { wishlist } = useSelector((state) => state.wishlist);
    const dispatch = useDispatch();
    const [count, setCount] = useState(1)
    const [click, setClick] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)

    // Debug: Log the data received
    useEffect(() => {
        console.log("🎯 ProductDetailsCard received data:", {
            name: data?.name,
            images: data?.images,
            firstImage: data?.images?.[0],
            typeOfFirstImage: typeof data?.images?.[0],
            containsUploads: data?.images?.[0]?.includes?.('uploads')
        });
    }, [data]);

    // Function to handle image URLs - SIMPLIFIED VERSION
    // The backend already provides full URLs, so we should use them as-is
    const getImageUrl = (image) => {
        if (!image) {
            console.log("❌ No image provided");
            return "https://via.placeholder.com/500x500?text=No+Image";
        }
        
        console.log("📸 Processing image:", image);
        
        // If it's already a full URL (from backend), return it
        if (typeof image === 'string' && image.startsWith('http')) {
            console.log("✅ Already a full URL from backend");
            return image;
        }
        
        // If it's just a filename, construct URL
        if (typeof image === 'string') {
            const url = `${backend_url}/uploads/${image}`;
            console.log("✅ Constructed URL from filename:", url);
            return url;
        }
        
        // Default fallback
        console.log("⚠️ Unknown image format, using placeholder");
        return "https://via.placeholder.com/500x500?text=Image+Error";
    };

    // Get current image URL
    const getCurrentImage = () => {
        if (!data?.images || data.images.length === 0) {
            console.log("⚠️ No images in product data");
            return "https://via.placeholder.com/500x500?text=No+Image";
        }
        
        const image = data.images[selectedImageIndex] || data.images[0];
        return getImageUrl(image);
    };

    // Get shop avatar URL
    const getShopAvatarUrl = (avatar) => {
        if (!avatar) {
            return "https://via.placeholder.com/50x50?text=Shop";
        }
        
        // If it's already a full URL, return it
        if (typeof avatar === 'string' && avatar.startsWith('http')) {
            return avatar;
        }
        
        // If it's just a filename, construct URL
        if (typeof avatar === 'string') {
            return `${backend_url}/uploads/${avatar}`;
        }
        
        return "https://via.placeholder.com/50x50?text=Shop";
    };

    const currentImageUrl = getCurrentImage();
    const shopAvatar = data?.shop?.avatar 
        ? getShopAvatarUrl(data.shop.avatar)
        : "https://via.placeholder.com/50x50?text=Shop";

    // Star rating
    const renderStars = () => {
        const rating = data?.ratings || 0;
        const ratingValue = parseFloat(rating) || 0;
        const stars = [];
        
        for (let i = 1; i <= 5; i++) {
            if (i <= ratingValue) {
                stars.push(<AiFillStar key={i} className="text-yellow-500" size={20} />);
            } else if (i - 0.5 <= ratingValue) {
                stars.push(
                    <div key={i} className="relative inline-block" style={{ width: '20px', height: '20px' }}>
                        <AiOutlineStar className="text-gray-300" size={20} />
                        <AiFillStar 
                            className="text-yellow-500 absolute left-0 top-0" 
                            style={{ clipPath: 'inset(0 50% 0 0)' }}
                            size={20} 
                        />
                    </div>
                );
            } else {
                stars.push(<AiOutlineStar key={i} className="text-gray-300" size={20} />);
            }
        }
        
        return stars;
    };

    const handleMessageSubmit = () => {
        toast.info("Message feature coming soon!");
    }

    const decrementCount = () => {
        if (count > 1) {
            setCount(count - 1)
        }
    }
    
    const incrementCount = () => {
        if (!data?.stock || count < data.stock) {
            setCount(count + 1)
        } else {
            toast.error("Maximum stock reached!");
        }
    }

    // Add to cart
    const addToCartHandler = (id) => {
        const isItemExists = cart && cart.find((i) => i._id === id);

        if (isItemExists) {
            toast.error("Item already in cart!")
        } else {
            if (data.stock < 1) {
                toast.error("Product out of stock!");
            } else if (data.stock < count) {
                toast.error(`Only ${data.stock} items available in stock!`);
            } else {
                const cartData = { ...data, qty: count };
                dispatch(addTocart(cartData));
                toast.success("Item added to cart successfully!");
                setOpen(false);
            }
        }
    }

    useEffect(() => {
        if (wishlist && wishlist.find((i) => i._id === data?._id)) {
            setClick(true);
        } else {
            setClick(false);
        }
    }, [wishlist, data]);

    const removeFromWishlistHandler = (productData) => {
        setClick(!click);
        dispatch(removeFromWishlist(productData));
        toast.success("Removed from wishlist!");
    }

    const addToWishlistHandler = (productData) => {
        setClick(!click);
        dispatch(addToWishlist(productData));
        toast.success("Added to wishlist!");
    }

    if (!data) {
        console.log("❌ No data provided to ProductDetailsCard");
        return null;
    }

    const rating = parseFloat(data.ratings) || 0;

    return (
        <div className='fixed w-full h-screen top-0 left-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
            <div className='w-full max-w-5xl bg-white rounded-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto'>
                {/* Close button */}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                    <RxCross1 size={24} />
                </button>

                <div className="flex flex-col lg:flex-row">
                    {/* LEFT SIDE - IMAGES */}
                    <div className='lg:w-1/2 p-6'>
                        {/* Main Image */}
                        <div className="mb-4 h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                            <img 
                                src={currentImageUrl}
                                alt={data.name || "Product image"}
                                className='max-h-full max-w-full object-contain'
                                onError={(e) => {
                                    console.error("❌ Image failed to load:", currentImageUrl);
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/400x400?text=Image+Not+Found";
                                }}
                                onLoad={() => console.log("✅ Image loaded successfully:", currentImageUrl)}
                            />
                        </div>
                        
                        {/* Thumbnail Images */}
                        {data.images && data.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {data.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`flex-shrink-0 w-16 h-16 rounded border overflow-hidden ${selectedImageIndex === index ? 'border-blue-500 border-2' : 'border-gray-300'}`}
                                    >
                                        <img
                                            src={getImageUrl(image)}
                                            alt={`${data.name || 'Product'} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/64x64?text=Thumb";
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Debug Info (remove in production) */}
                        <div className="mt-4 p-3 bg-yellow-50 rounded text-xs">
                            <div className="font-semibold">Image Debug:</div>
                            <div>URL: <code className="break-all">{currentImageUrl}</code></div>
                            <div>Images in data: {data.images?.length || 0}</div>
                        </div>
                    </div>
                    
                    {/* RIGHT SIDE - PRODUCT INFO */}
                    <div className='lg:w-1/2 p-6'>
                        {/* Product Title */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            {data.name || "Product"}
                        </h1>
                        
                        {/* Rating */}
                        <div className="flex items-center mb-4">
                            <div className="flex items-center">
                                <div className="flex mr-2">
                                    {renderStars()}
                                </div>
                                <span className="text-gray-700 font-medium">
                                    {rating.toFixed(1)}
                                </span>
                                <span className="text-gray-500 text-sm ml-1">/5</span>
                            </div>
                            <span className="mx-3 text-gray-400">•</span>
                            <span className="text-green-600 font-medium">
                                {data.sold_out || 0} sold
                            </span>
                        </div>
                        
                        {/* Price */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-3xl font-bold text-gray-900">
                                    ${data.discountPrice || data.originalPrice || "0.00"}
                                </span>
                                {data.originalPrice && data.originalPrice > (data.discountPrice || 0) && (
                                    <>
                                        <span className="ml-4 text-xl text-gray-500 line-through">
                                            ${data.originalPrice}
                                        </span>
                                        <span className="ml-4 bg-red-100 text-red-600 px-3 py-1 rounded text-sm font-medium">
                                            Save ${(data.originalPrice - (data.discountPrice || 0)).toFixed(2)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Description */}
                        <div className="mb-6">
                            <p className="text-gray-600">
                                {data.description || "No description available."}
                            </p>
                        </div>
                        
                        {/* Quantity */}
                        <div className="mb-6">
                            <div className="flex items-center">
                                <button
                                    className="w-10 h-10 border rounded-l hover:bg-gray-100 disabled:opacity-50"
                                    onClick={decrementCount}
                                    disabled={count <= 1}
                                >
                                    -
                                </button>
                                <div className="w-12 h-10 border-t border-b flex items-center justify-center">
                                    <span className="font-medium">{count}</span>
                                </div>
                                <button
                                    className="w-10 h-10 border rounded-r hover:bg-gray-100 disabled:opacity-50"
                                    onClick={incrementCount}
                                    disabled={!data.stock || count >= data.stock}
                                >
                                    +
                                </button>
                                <span className="ml-3 text-gray-600 text-sm">
                                    {data.stock || 0} available
                                </span>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-6">
                            <button
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center disabled:opacity-50"
                                onClick={() => addToCartHandler(data._id)}
                                disabled={!data.stock || data.stock < 1}
                            >
                                <AiOutlineShoppingCart className="mr-2" size={20} />
                                Add to Cart
                            </button>
                            
                            <button
                                className="w-12 h-12 border rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                onClick={() => click ? removeFromWishlistHandler(data) : addToWishlistHandler(data)}
                            >
                                {click ? (
                                    <AiFillHeart size={22} className="text-red-500" />
                                ) : (
                                    <AiOutlineHeart size={22} className="text-gray-600" />
                                )}
                            </button>
                        </div>
                        
                        {/* Shop Info */}
                        <div className="border-t pt-6">
                            <div className="flex items-center">
                                <img
                                    src={shopAvatar}
                                    alt={data.shop?.name || "Shop"}
                                    className='w-10 h-10 rounded-full mr-3 object-cover'
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/40x40?text=Shop";
                                    }}
                                />
                                <div>
                                    <h3 className="font-medium">
                                        {data.shop?.name || "Unknown Shop"}
                                    </h3>
                                    <button
                                        className="mt-2 bg-blue-50 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-100 flex items-center"
                                        onClick={handleMessageSubmit}
                                    >
                                        <AiOutlineMessage className="mr-1" />
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailsCard