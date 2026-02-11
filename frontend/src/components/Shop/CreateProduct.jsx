// Components/Shop/CreateProduct.jsx
import React, { useEffect, useState } from "react";
import { AiOutlinePlusCircle, AiOutlineDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../redux/actions/product";
import { categoriesData } from "../../static/data";
import { toast } from "react-toastify";

const CreateProduct = () => {
    const { seller } = useSelector((state) => state.seller);
    const { success, error } = useSelector((state) => state.products);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [stock, setStock] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (error) {
            toast.error(error);
            setLoading(false);
        }
        if (success) {
            toast.success("Product created successfully!");
            setLoading(false);
            setTimeout(() => {
                navigate("/dashboard-products");
            }, 1500);
        }
    }, [dispatch, error, success, navigate]);

    const handleImageChange = (e) => {
        e.preventDefault();

        const files = Array.from(e.target.files);
        
        if (files.length + images.length > 5) {
            toast.error("Maximum 5 images allowed");
            return;
        }

        setImages((prevImages) => [...prevImages, ...files]);
        
        // Create preview URLs
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setImagePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!name || !description || !category || !discountPrice || !stock) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (images.length === 0) {
            toast.error("Please upload at least one product image");
            return;
        }

        setLoading(true);

        const newForm = new FormData();

        images.forEach((image) => {
            newForm.append("images", image);
        });
        newForm.append("name", name);
        newForm.append("description", description);
        newForm.append("category", category);
        newForm.append("tags", tags);
        newForm.append("originalPrice", originalPrice || discountPrice);
        newForm.append("discountPrice", discountPrice);
        newForm.append("stock", stock);
        newForm.append("shopId", seller._id);
        
        dispatch(createProduct(newForm));
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setCategory("");
        setTags("");
        setOriginalPrice("");
        setDiscountPrice("");
        setStock("");
        setImages([]);
        setImagePreviews([]);
        setLoading(false);
    };

    return (
        <div className="w-[90%] 800px:w-[70%] bg-white shadow-lg rounded-lg p-6 m-4 overflow-y-auto max-h-[90vh]">
            <h5 className="text-2xl font-semibold font-Poppins text-center text-gray-800 mb-6">
                Create New Product
            </h5>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-1">
                        Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={name}
                        className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your product name..."
                        required
                    />
                </div>

                {/* Product Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-1">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        cols="30"
                        rows="6"
                        name="description"
                        value={description}
                        className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter your product description..."
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-1">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full mt-1 border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Select a category</option>
                        {categoriesData &&
                            categoriesData.map((i) => (
                                <option value={i.title} key={i.title}>
                                    {i.title}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-1">
                        Tags (Optional)
                    </label>
                    <input
                        type="text"
                        name="tags"
                        value={tags}
                        className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., fashion, electronics, home..."
                    />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 pb-1">
                            Original Price (USD)
                        </label>
                        <input
                            type="number"
                            name="originalPrice"
                            value={originalPrice}
                            min="0"
                            step="0.01"
                            className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            placeholder="Enter original price..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 pb-1">
                            Discount Price (USD) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="discountPrice"
                            value={discountPrice}
                            min="0"
                            step="0.01"
                            className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                            onChange={(e) => setDiscountPrice(e.target.value)}
                            placeholder="Enter discounted price..."
                            required
                        />
                    </div>
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-1">
                        Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="stock"
                        value={stock}
                        min="0"
                        className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Enter stock quantity..."
                        required
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-1">
                        Product Images <span className="text-red-500">*</span>
                        <span className="text-gray-500 text-xs ml-2">(Max 5 images)</span>
                    </label>
                    <input
                        type="file"
                        name="images"
                        id="upload"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="flex flex-wrap items-center">
                            <label 
                                htmlFor="upload"
                                className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition duration-150"
                            >
                                <AiOutlinePlusCircle size={30} className="text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Add Images</span>
                            </label>
                            
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative m-2">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition duration-150"
                                    >
                                        <AiOutlineDelete size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {imagePreviews.length > 0 && (
                            <p className="text-xs text-gray-500 mt-3">
                                {imagePreviews.length} image(s) selected
                            </p>
                        )}
                        
                        {imagePreviews.length === 0 && (
                            <p className="text-center text-gray-400 mt-4">
                                No images selected. Click the box above to upload product images.
                            </p>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition duration-150 ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {loading ? 'Creating Product...' : 'Create Product'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition duration-150"
                    >
                        Reset Form
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard-products")}
                        className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition duration-150"
                    >
                        Cancel
                    </button>
                </div>

                <div className="text-xs text-gray-500 pt-4">
                    <p><span className="text-red-500">*</span> Required fields</p>
                    <p className="mt-1">Images will be automatically optimized and stored securely.</p>
                </div>
            </form>
        </div>
    );
};

export default CreateProduct;