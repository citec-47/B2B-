// ProductCard.jsx
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

    // Function to get proper image URL
    const getImageUrl = (imageFilename) => {
        if (!imageFilename) {
            return "https://via.placeholder.com/300x300?text=No+Image";
        }
        
        // If it's already a full URL, return it
        if (imageFilename.startsWith("http")) {
            return imageFilename;
        }
        
        // Construct full URL from filename
        return `${backend_url}/uploads/${imageFilename}`;
    };

    // Get the first image URL
    const mainImage = data.images && data.images.length > 0 
        ? getImageUrl(data.images[0])
        : "https://via.placeholder.com/300x300?text=No+Image";

    useEffect(() => {
        if (wishlist && wishlist.find((i) => i._id === data._id)) {
            setClick(true);
        } else {
            setClick(false);
        }
    }, [wishlist]);

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
            toast.error("Item already in cart!")
        } else {
            if (data.stock < 1) {
                toast.error("Product stock limited!");
            } else {
                const cartData = { ...data, qty: 1 };
                dispatch(addTocart(cartData));
                toast.success("Item added to cart successfully!")
            }
        }
    }

    return (
        <>
            <div className='w-full h-[370px] bg-white rounded-lg shadow-sm p-3 relative cursor-pointer'>
                <div className='flex justify-end'>
                </div>

                <Link to={`${isEvent === true ? `/product/${data._id}?isEvent=true` : `/product/${data._id}`}`}>
                    <img
                        src={mainImage}
                        alt={data.name}
                        className='w-full h-[170px] object-contain'
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x300?text=Image+Error";
                        }}
                    />
                </Link>
                <Link to={`${isEvent === true ? `/product/${data._id}?isEvent=true` : `/product/${data._id}`}`}>
                    <h5 className={`${styles.shop_name}`} >
                        {data.shop?.name || "Unknown Shop"}
                    </h5>
                </Link>
                <Link to={`/product/${data._id}`}>
                    <h4 className='pb-3 font-[500]'>
                        {data.name.length > 40 ? data.name.slice(0, 40) + '...' : data.name}
                    </h4>
                    
                    {/* Star Rating */}
                    <div className='flex'>
                        <Ratings rating={data?.ratings} />
                    </div>

                    <div className='py-2 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <h5 className={`${styles.productDiscountPrice}`}>
                                {data.discountPrice ? data.discountPrice + "$" : data.originalPrice + "$"}
                            </h5>

                            {data.originalPrice && data.originalPrice > data.discountPrice && (
                                <h4 className={`${styles.price} line-through`}>
                                    {data.originalPrice + "$"}
                                </h4>
                            )}
                        </div>

                        <span className="font-[400] text-[14px] text-[#68d284]">
                            {data?.sold_out || 0} sold
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
                        onClick={() => addToCartHandler(data._id)}
                        color="#444"
                        title='Add to cart'
                    />
                    {open ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
                </div>
            </div>
        </>
    )
}

export default ProductCard