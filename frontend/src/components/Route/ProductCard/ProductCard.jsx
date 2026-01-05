import React, { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import styles from "../../../styles/styles";
import {
    AiFillHeart,
    AiFillStar,
    AiOutlineEye,
    AiOutlineHeart,
    AiOutlineShoppingCart,
    AiOutlineStar,
} from "react-icons/ai";
import { backend_url } from "../../../server";
import ProductDetailsCard from "../ProductDetailsCard/ProductDetailsCard.jsx";
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '../../../redux/actions/wishlist';
import { addTocart } from '../../../redux/actions/cart';
import { toast } from 'react-toastify';
import Ratings from "../../Products/Ratings";

const ProductCard = ({ data, isEvent }) => {
    const { wishlist } = useSelector((state) => state.wishlist);
    const { cart } = useSelector((state) => state.cart);
    const [click, setClick] = useState(false);
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();

    // ✅ Hooks MUST come BEFORE any conditional returns
    useEffect(() => {
        if (wishlist && data?._id && wishlist.find((i) => i._id === data._id)) {
            setClick(true);
        } else {
            setClick(false);
        }
    }, [wishlist, data]);

    // Check if data is valid - but AFTER all hooks
    if (!data || typeof data !== 'object') {
        return (
            <div className='w-full h-[370px] bg-white rounded-lg shadow-sm p-3 relative'>
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Product data not available</p>
                </div>
            </div>
        );
    }

    // Remove from wish list 
    const removeFromWishlistHandler = (data) => {
        setClick(!click);
        dispatch(removeFromWishlist(data));
    }

    // add to wish list
    const addToWishlistHandler = (data) => {
        setClick(!click);
        dispatch(addToWishlist(data))
    }

    // Add to cart
    const addToCartHandler = (id) => {
        const isItemExists = cart && cart.find((i) => i._id === id);

        if (isItemExists) {
            toast.error("item already in cart!")
        } else {
            if (data?.stock < 1) {
                toast.error("Product stock limited!");
            } else {
                const cartData = { ...data, qty: 1 };
                dispatch(addTocart(cartData));
                toast.success("Item added to cart Successfully!")
            }
        }
    }

    // Safe access to properties
    const productName = data?.name || "Unnamed Product";
    const shopName = data?.shop?.name || "Unknown Shop";
    const imageSrc = data?.images?.[0] ? `${backend_url}${data.images[0]}` : "/default-product.jpg";
    const productId = data?._id || "";
    const discountPrice = data?.discountPrice || 0;
    const originalPrice = data?.originalPrice || 0;
    const soldCount = data?.sold_out || 0;
    const ratings = data?.ratings || 0;

    return (
        <>
            <div className='w-full h-[370px] bg-white rounded-lg shadow-sm p-3 relative cursor-pointer'>
                <div className='flex justify-end'>
                </div>

                <Link to={`${isEvent === true ? `/product/${productId}?isEvent=true` : `/product/${productId}`}`}>
                    <img
                        src={imageSrc}
                        alt={productName}
                        className='w-full h-[170px] object-contain'
                        onError={(e) => {
                            e.target.src = "/default-product.jpg";
                        }}
                    />
                </Link>
                <Link to={`${isEvent === true ? `/product/${productId}?isEvent=true` : `/product/${productId}`}`}>
                    <h5 className={`${styles.shop_name}`}>
                        {shopName}
                    </h5>
                </Link>
                <Link to={`/product/${productId}`}>
                    <h4 className='pb-3 font-[500]'>
                        {productName.length > 40 ? productName.slice(0, 40) + '...' : productName}
                    </h4>
                    {/* Star Rating */}
                    <div className='flex'>
                        <Ratings rating={ratings} />
                    </div>

                    <div className='py-2 flex items-center justify-between'>
                        <div className='flex'>
                            <h5 className={`${styles.productDiscountPrice}`}>
                                {originalPrice === 0 ? originalPrice : discountPrice}$
                            </h5>

                            <h4 className={`${styles.price}`}>
                                {originalPrice ? originalPrice + " $" : null}
                            </h4>
                        </div>

                        <span className="font-[400] text-[17px] text-[#68d284]">
                            {soldCount} sold
                        </span>
                    </div>
                </Link>

                {/* side option */}
                <div>
                    {
                        click ? (
                            <AiFillHeart
                                size={22}
                                className="cursor-pointer absolute right-2 top-5"
                                onClick={() => removeFromWishlistHandler(data)}
                                color={click ? "red" : "#333"}
                                title='Remove from wishlist'
                            />
                        ) : (
                            <AiOutlineHeart
                                size={22}
                                className="cursor-pointer absolute right-2 top-5"
                                onClick={() => addToWishlistHandler(data)}
                                color={click ? "red" : "#333"}
                                title='Add to wishlist'

                            />
                        )}
                    <AiOutlineEye
                        size={22}
                        className="cursor-pointer absolute right-2 top-14"
                        onClick={() => setOpen(!open)}
                        color="#333"
                        title='Quick view'
                    />

                    <AiOutlineShoppingCart
                        size={25}
                        className="cursor-pointer absolute right-2 top-24"
                        onClick={() => addToCartHandler(productId)}
                        color="#444"
                        title='Add to cart'
                    />
                    {open && data ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
                </div>
            </div>
        </>
    )
}

export default ProductCard