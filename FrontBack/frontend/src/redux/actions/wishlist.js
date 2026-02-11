// redux/actions/wishlist.js - UPDATED VERSION
import { backend_url } from "../../server";

// Helper function to get proper image URL
const getProperImageUrl = (image) => {
  if (!image) {
    return `${backend_url}/uploads/default-product.jpg`;
  }
  
  if (typeof image === 'string') {
    // If it's already a full URL, return it
    if (image.startsWith('http')) {
      return image;
    }
    
    // If it starts with /uploads or uploads/, add backend_url
    if (image.includes('uploads/')) {
      // Remove leading slash if present
      const cleanImage = image.replace(/^\/+/, '');
      return `${backend_url}/${cleanImage}`;
    }
    
    // If it's just a filename, assume it's in uploads folder
    return `${backend_url}/uploads/${image}`;
  }
  
  return `${backend_url}/uploads/default-product.jpg`;
};

// Process product for wishlist
const processProductForWishlist = (product) => {
  // Make sure we have all necessary fields
  const processedProduct = {
    ...product,
    _id: product._id || product.id,
    name: product.name || 'Product',
    description: product.description || '',
    discountPrice: product.discountPrice || product.originalPrice || 0,
    originalPrice: product.originalPrice || 0,
    stock: product.stock || 0,
    ratings: product.ratings || 0,
    shopId: product.shopId || product.shop?._id || '',
    shop: product.shop || {
      _id: product.shopId || '',
      name: 'Shop',
      avatar: getProperImageUrl(product.shop?.avatar),
    },
    reviews: product.reviews || [],
    sold_out: product.sold_out || 0,
    category: product.category || '',
    tags: product.tags || '',
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  };
  
  // Process images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    processedProduct.images = product.images.map(img => getProperImageUrl(img));
    processedProduct.image = getProperImageUrl(product.images[0]);
  } else if (product.image) {
    processedProduct.images = [getProperImageUrl(product.image)];
    processedProduct.image = getProperImageUrl(product.image);
  } else if (product.avatar) {
    processedProduct.images = [getProperImageUrl(product.avatar)];
    processedProduct.image = getProperImageUrl(product.avatar);
  } else {
    processedProduct.images = [`${backend_url}/uploads/default-product.jpg`];
    processedProduct.image = `${backend_url}/uploads/default-product.jpg`;
  }
  
  return processedProduct;
};

// add to wishlist
export const addToWishlist = (data) => async (dispatch, getState) => {
  try {
    // Process the product data
    const processedData = processProductForWishlist(data);
    
    dispatch({
      type: "addToWishlist",
      payload: processedData,
    });

    // Save to localStorage
    const updatedWishlist = getState().wishlist.wishlist;
    localStorage.setItem("wishlistItems", JSON.stringify(updatedWishlist));
    
    return processedData;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

// remove from wishlist
export const removeFromWishlist = (data) => async (dispatch, getState) => {
  dispatch({
    type: "removeFromWishlist",
    payload: data._id,
  });
  
  // Save to localStorage
  const updatedWishlist = getState().wishlist.wishlist;
  localStorage.setItem("wishlistItems", JSON.stringify(updatedWishlist));
  
  return data;
};