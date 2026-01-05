import React, { useEffect, useState } from "react";
import { AiOutlinePlusCircle, AiOutlineImport, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { BsEye } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct, getAllProductsShop } from "../../redux/actions/product";
import { categoriesData } from "../../static/data";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../../server";

const CreateProduct = () => {
    const { seller } = useSelector((state) => state.seller);
    const { success, error } = useSelector((state) => state.products);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Manual creation states
    const [images, setImages] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [stock, setStock] = useState("");

    // Import states
    const [showImportPanel, setShowImportPanel] = useState(false);
    const [importProducts, setImportProducts] = useState([]);
    const [selectedImportProducts, setSelectedImportProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [importing, setImporting] = useState(false);
    const [search, setSearch] = useState("");
    const [importCategory, setImportCategory] = useState("All");
    const [importCategories, setImportCategories] = useState([]);
    const [markupPercentage, setMarkupPercentage] = useState(30);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Load existing products on component mount
    useEffect(() => {
        if (seller && seller._id) {
            dispatch(getAllProductsShop(seller._id));
        }
    }, [dispatch, seller]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
        if (success) {
            toast.success("Product created successfully!");
            if (seller && seller._id) {
                dispatch(getAllProductsShop(seller._id));
            }
            resetForm();
        }
    }, [dispatch, error, success, seller]);

    // Fetch external products for import
    const fetchExternalProducts = async () => {
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams({
                category: importCategory === "All" ? "" : importCategory,
                search,
                page,
                limit: 12,
            });

            console.log(`Fetching external products: ${server}/product/fetch-external?${params}`);
            
            const response = await axios.get(
                `${server}/product/fetch-external?${params}`,
                { 
                    withCredentials: true,
                    timeout: 10000
                }
            );

            if (response.data.success) {
                console.log(`Fetched ${response.data.products?.length || 0} products`);
                setImportProducts(response.data.products || []);
                setTotalPages(response.data.pages || 1);
                setTotalProducts(response.data.total || 0);
            } else {
                toast.error("Failed to fetch products: " + (response.data.message || "Unknown error"));
                setImportProducts([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Error fetching products. Using demo data.");
            // Generate demo data
            generateDemoProducts();
        } finally {
            setLoadingProducts(false);
        }
    };

    // Generate demo products (fallback)
    const generateDemoProducts = () => {
        const demoCategories = [
            "Electronics", "Mobile Phones", "Laptops", "Fashion", 
            "Home & Kitchen", "Beauty & Health", "Sports & Outdoors"
        ];
        
        const demoProducts = [];
        for (let i = 1; i <= 12; i++) {
            const category = demoCategories[Math.floor(Math.random() * demoCategories.length)];
            const price = Math.random() * 500 + 20;
            
            demoProducts.push({
                externalId: `DEMO-${Date.now()}-${i}`,
                name: `${category} Product ${i}`,
                description: `High-quality ${category.toLowerCase()} with excellent features. Perfect for everyday use.`,
                category,
                originalPrice: parseFloat((price * 1.3).toFixed(2)),
                discountPrice: parseFloat(price.toFixed(2)),
                stock: Math.floor(Math.random() * 200) + 10,
                images: ["default-product.jpg"],
                brand: ["Brand A", "Brand B", "Brand C", "Brand D"][Math.floor(Math.random() * 4)],
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                reviewCount: Math.floor(Math.random() * 500),
                externalSource: "DEMO_API",
                tags: "imported,demo,test"
            });
        }
        
        setImportProducts(demoProducts);
        setTotalPages(1);
        setTotalProducts(demoProducts.length);
    };

    // Fetch import categories
    const fetchImportCategories = async () => {
        try {
            const response = await axios.get(
                `${server}/product/import-categories`,
                { 
                    withCredentials: true,
                    timeout: 5000
                }
            );
            
            if (response.data.success) {
                const categories = response.data.categories || [];
                setImportCategories(categories);
            } else {
                setImportCategories(["All", "Electronics", "Fashion", "Home & Kitchen", "Beauty & Health"]);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setImportCategories(["All", "Electronics", "Fashion", "Home & Kitchen", "Beauty & Health"]);
        }
    };

    // Initialize import panel
    useEffect(() => {
        if (showImportPanel) {
            fetchImportCategories();
            fetchExternalProducts();
        }
    }, [showImportPanel, page, importCategory]);

    // Handle search
    const handleSearch = () => {
        setPage(1);
        fetchExternalProducts();
    };

    // Handle manual image upload
    const handleImageChange = (e) => {
        e.preventDefault();
        let files = Array.from(e.target.files);
        setImages((prevImages) => [...prevImages, ...files]);
    };

    // Handle manual product creation
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!name || !description || !category || !discountPrice || !stock || images.length === 0) {
            toast.error("Please fill all required fields and upload at least one image");
            return;
        }

        const newForm = new FormData();

        images.forEach((image) => {
            newForm.append("images", image);
        });
        newForm.append("name", name);
        newForm.append("description", description);
        newForm.append("category", category);
        newForm.append("tags", tags);
        newForm.append("originalPrice", originalPrice);
        newForm.append("discountPrice", discountPrice);
        newForm.append("stock", stock);
        newForm.append("shopId", seller._id);
        
        dispatch(createProduct(newForm));
    };

    // Handle import product selection
    const handleSelectImportProduct = (product, isSelected) => {
        if (isSelected) {
            setSelectedImportProducts([...selectedImportProducts, product]);
        } else {
            setSelectedImportProducts(selectedImportProducts.filter((p) => p.externalId !== product.externalId));
        }
    };

    // Handle select all import products
    const handleSelectAllImport = (event) => {
        if (event.target.checked) {
            setSelectedImportProducts([...importProducts]);
        } else {
            setSelectedImportProducts([]);
        }
    };

    // Handle bulk import
    const handleBulkImport = async () => {
        if (selectedImportProducts.length === 0) {
            toast.warning("Please select products to import");
            return;
        }

        if (!seller || !seller._id) {
            toast.error("Seller information not found");
            return;
        }

        setImporting(true);
        try {
            // Prepare products data
            const productsToImport = selectedImportProducts.map((product, index) => {
                const costPrice = product.discountPrice || 10;
                const sellingPrice = parseFloat((costPrice * (1 + (markupPercentage / 100))).toFixed(2));
                
                return {
                    name: product.name || `Imported Product ${index + 1}`,
                    description: product.description || `Description for ${product.name || `Product ${index + 1}`}`,
                    category: product.category || "Uncategorized",
                    discountPrice: costPrice,
                    originalPrice: product.originalPrice || (sellingPrice * 1.5),
                    stock: product.stock || 100,
                    tags: product.tags || "imported",
                    externalId: product.externalId || `EXT-${Date.now()}-${index}`,
                    externalSource: product.externalSource || "IMPORTED",
                    images: ["default-product.jpg"]
                };
            });

            console.log(`[IMPORT] Starting bulk import for shop: ${seller._id}`);
            console.log(`[IMPORT] Products to import: ${productsToImport.length}`);
            console.log('[IMPORT] Sample product:', productsToImport[0]);

            // Make API call to bulk import
            const response = await axios.post(
                `${server}/product/bulk-import-external`,
                {
                    products: productsToImport,
                    shopId: seller._id,
                    markupPercentage: parseFloat(markupPercentage)
                },
                { 
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" }
                }
            );

            console.log("[IMPORT] Response:", response.data);
            setImportResult(response.data);

            if (response.data.success) {
                const importedCount = response.data.results?.imported || 0;
                
                if (importedCount > 0) {
                    toast.success(`Successfully imported ${importedCount} products!`);
                    setShowSuccessMessage(true);
                    
                    // Immediately refresh the product list
                    if (seller && seller._id) {
                        console.log("[IMPORT] Refreshing product list...");
                        await dispatch(getAllProductsShop(seller._id));
                    }
                    
                    // Reset import panel
                    setSelectedImportProducts([]);
                    setImportProducts([]);
                    
                    // Close import panel after 3 seconds
                    setTimeout(() => {
                        setShowImportPanel(false);
                        setShowSuccessMessage(false);
                        navigate("/dashboard-products");
                    }, 3000);
                    
                } else {
                    toast.error("No products were imported. Please check the error messages.");
                }
                
            } else {
                toast.error(response.data.message || "Import failed");
            }
            
        } catch (error) {
            console.error("[IMPORT] Bulk import error:", error);
            
            let errorMessage = "Failed to import products";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setImporting(false);
        }
    };

    // Handle single product import
    const handleSingleImport = async (product) => {
        if (!seller || !seller._id) {
            toast.error("Seller information not found");
            return;
        }

        setImporting(true);
        try {
            const costPrice = product.discountPrice || 10;
            const sellingPrice = parseFloat((costPrice * (1 + (markupPercentage / 100))).toFixed(2));
            
            const productData = {
                name: product.name,
                description: product.description || product.name,
                category: product.category || "Uncategorized",
                discountPrice: costPrice,
                originalPrice: product.originalPrice || (sellingPrice * 1.5),
                stock: product.stock || 100,
                tags: product.tags || "imported",
                externalId: product.externalId,
                externalSource: product.externalSource || "IMPORTED",
                shopId: seller._id,
                markupPercentage: parseFloat(markupPercentage),
                images: ["default-product.jpg"]
            };

            console.log("[IMPORT] Single import data:", productData);

            const response = await axios.post(
                `${server}/product/import-external`,
                productData,
                { 
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" }
                }
            );

            if (response.data.success) {
                toast.success(`"${product.name}" imported successfully!`);
                
                // Refresh product list
                if (seller && seller._id) {
                    await dispatch(getAllProductsShop(seller._id));
                }
                
                // Remove from selected products
                setSelectedImportProducts(prev => 
                    prev.filter(p => p.externalId !== product.externalId)
                );
                
                // Remove from import products list
                setImportProducts(prev => 
                    prev.filter(p => p.externalId !== product.externalId)
                );
            } else {
                toast.error(response.data.message || "Failed to import product");
            }
        } catch (error) {
            console.error("[IMPORT] Single import error:", error);
            toast.error(error.response?.data?.message || "Failed to import product");
        } finally {
            setImporting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setImages([]);
        setName("");
        setDescription("");
        setCategory("");
        setTags("");
        setOriginalPrice("");
        setDiscountPrice("");
        setStock("");
    };

    // View all products
    const handleViewAllProducts = () => {
        navigate("/dashboard-products");
    };

    // Debug function to test import
    const handleTestImport = async () => {
        try {
            toast.info("Testing import connection...");
            
            const response = await axios.get(
                `${server}/product/test-import-connection`,
                { 
                    withCredentials: true,
                    timeout: 5000
                }
            );
            
            console.log("Test import response:", response.data);
            toast.success("Import API is working!");
        } catch (error) {
            console.error("Test import error:", error);
            toast.error("Test import failed: " + error.message);
        }
    };

    // Fix imported products
    const handleFixImportedProducts = async () => {
        if (!seller || !seller._id) {
            toast.error("Seller information not found");
            return;
        }

        try {
            toast.info("Fixing imported products...");
            
            const response = await axios.post(
                `${server}/product/fix-imported-products/${seller._id}`,
                {},
                { 
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" }
                }
            );
            
            if (response.data.success) {
                toast.success(`Fixed ${response.data.results.totalFixed} products`);
                // Refresh product list
                await dispatch(getAllProductsShop(seller._id));
            }
        } catch (error) {
            console.error("Fix error:", error);
            toast.error("Failed to fix products: " + error.message);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Success Message Modal */}
                {showSuccessMessage && importResult && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <AiOutlineCheck className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                                Import Successful!
                            </h3>
                            <p className="text-center text-gray-600 mb-4">
                                Successfully imported {importResult.results?.imported || 0} products.
                            </p>
                            <button
                                onClick={() => {
                                    setShowSuccessMessage(false);
                                    setShowImportPanel(false);
                                    navigate("/dashboard-products");
                                }}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                View Imported Products
                            </button>
                        </div>
                    </div>
                )}

                {/* Header with Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            {showImportPanel ? "Import Products" : "Create Product"}
                        </h1>
                        <p className="text-gray-600">
                            {showImportPanel 
                                ? "Browse and import products from external catalog" 
                                : "Add new products to your store manually"
                            }
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                        <button
                            onClick={() => {
                                setShowImportPanel(false);
                                setSelectedImportProducts([]);
                                setImportResult(null);
                            }}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center ${
                                !showImportPanel 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <AiOutlinePlusCircle className="mr-2" />
                            Create Manual
                        </button>
                        <button
                            onClick={() => setShowImportPanel(true)}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center ${
                                showImportPanel 
                                ? 'bg-green-600 text-white shadow-lg' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <AiOutlineImport className="mr-2" />
                            Import Products
                        </button>
                        <button
                            onClick={handleViewAllProducts}
                            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center"
                        >
                            <BsEye className="mr-2" />
                            View All Products
                        </button>
                    </div>
                </div>

                {/* Debug buttons */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 mb-2 font-medium">Debug Tools:</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleTestImport}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                                Test API
                            </button>
                            <button
                                onClick={handleFixImportedProducts}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                                Fix Imported
                            </button>
                        </div>
                    </div>
                )}

                {/* Import Products Panel */}
                {showImportPanel ? (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Import Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                            <h2 className="text-2xl font-bold mb-2">Import Products Catalog</h2>
                            <p className="opacity-90">Select products to add to your store. Imported products will be marked accordingly.</p>
                        </div>

                        {/* Import Filters */}
                        <div className="p-6 border-b">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category Filter
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        value={importCategory}
                                        onChange={(e) => {
                                            setImportCategory(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        {importCategories.length > 0 ? (
                                            importCategories.map((cat, index) => (
                                                <option key={`${cat}-${index}`} value={cat}>
                                                    {cat}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="All">Loading categories...</option>
                                        )}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Products
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-l-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Search by name, brand, or description..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                        />
                                        <button
                                            className="bg-green-500 text-white px-5 rounded-r-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                                            onClick={handleSearch}
                                            disabled={loadingProducts}
                                        >
                                            {loadingProducts ? "..." : "Search"}
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Markup ({markupPercentage}%)
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            step="5"
                                            value={markupPercentage}
                                            onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="text-lg font-bold text-green-600 min-w-[60px]">
                                            {markupPercentage}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Adds {markupPercentage}% to cost price
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quick Actions
                                    </label>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => fetchExternalProducts()}
                                            disabled={loadingProducts}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            Refresh List
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Selection Controls */}
                            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedImportProducts.length === importProducts.length && importProducts.length > 0}
                                        onChange={handleSelectAllImport}
                                        className="mr-3 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                                        disabled={importProducts.length === 0}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Select All ({selectedImportProducts.length} selected)
                                    </span>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                            selectedImportProducts.length > 0
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        onClick={handleBulkImport}
                                        disabled={selectedImportProducts.length === 0 || importing}
                                    >
                                        {importing ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                Importing...
                                            </div>
                                        ) : (
                                            `Import Selected (${selectedImportProducts.length})`
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowImportPanel(false)}
                                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="p-6">
                            {loadingProducts ? (
                                <div className="text-center py-16">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
                                    <p className="text-gray-600 text-lg">Loading products catalog...</p>
                                </div>
                            ) : importProducts.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    <div className="text-6xl mb-6">📦</div>
                                    <p className="text-xl font-medium mb-2">No products found</p>
                                    <p className="text-gray-600 mb-6">Try adjusting your search or category filters</p>
                                    <button
                                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                                        onClick={() => {
                                            setSearch("");
                                            setImportCategory("All");
                                            setPage(1);
                                            fetchExternalProducts();
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {importProducts.map((product, index) => {
                                            const isSelected = selectedImportProducts.some(p => p.externalId === product.externalId);
                                            const costPrice = product.discountPrice || 10;
                                            const sellingPrice = parseFloat((costPrice * (1 + markupPercentage / 100)).toFixed(2));
                                            const profit = parseFloat((sellingPrice - costPrice).toFixed(2));
                                            
                                            return (
                                                <div 
                                                    key={`${product.externalId}-${index}`}
                                                    className={`border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1 ${
                                                        isSelected ? 'border-green-500 border-2 bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                    onClick={() => handleSelectImportProduct(product, !isSelected)}
                                                >
                                                    <div className="flex items-start mb-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleSelectImportProduct(product, e.target.checked)}
                                                            className="mr-4 mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="relative w-full h-48 mb-3 overflow-hidden rounded-lg bg-gray-100">
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                                                                    <div className="text-center p-4">
                                                                        <div className="text-4xl mb-2 text-gray-400">📦</div>
                                                                        <p className="text-sm font-medium text-gray-700">{product.category || "Product"}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">Click to select</p>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                                                        <AiOutlineCheck className="mr-1" /> Selected
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 h-12">
                                                                {product.name}
                                                            </h3>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                                                    {product.category || "Uncategorized"}
                                                                </span>
                                                                <div className="flex items-center text-yellow-500">
                                                                    {"★".repeat(Math.floor(product.rating || 4))}
                                                                    <span className="text-gray-600 ml-1 text-sm">
                                                                        {product.rating?.toFixed(1) || "4.0"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                                                        {product.description || "No description available"}
                                                    </p>
                                                    
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="font-bold text-green-600 text-lg">
                                                                    ${sellingPrice.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    Cost: ${costPrice.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-green-500 font-medium">
                                                                    Profit: ${profit.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-600 text-right">
                                                                <div className="font-medium">Stock: {product.stock || 100}</div>
                                                                <div className="text-xs">Markup: {markupPercentage}%</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="pt-3 border-t border-gray-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSingleImport(product);
                                                                }}
                                                                disabled={importing}
                                                                className="w-full py-2.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
                                                            >
                                                                {importing ? "Importing..." : "Import Single"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center mt-10">
                                            <nav className="flex items-center space-x-2">
                                                <button
                                                    className={`px-4 py-2 rounded-lg ${
                                                        page <= 1 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                                    onClick={() => setPage(page - 1)}
                                                    disabled={page <= 1}
                                                >
                                                    ← Previous
                                                </button>
                                                
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) pageNum = i + 1;
                                                    else if (page <= 3) pageNum = i + 1;
                                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                    else pageNum = page - 2 + i;
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            className={`px-4 py-2 rounded-lg ${
                                                                page === pageNum 
                                                                ? 'bg-green-500 text-white' 
                                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                            }`}
                                                            onClick={() => setPage(pageNum)}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                                
                                                <button
                                                    className={`px-4 py-2 rounded-lg ${
                                                        page >= totalPages 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                                    onClick={() => setPage(page + 1)}
                                                    disabled={page >= totalPages}
                                                >
                                                    Next →
                                                </button>
                                            </nav>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Import Summary Footer */}
                        {selectedImportProducts.length > 0 && (
                            <div className="bg-green-50 border-t border-green-200 p-4">
                                <div className="flex flex-col md:flex-row justify-between items-center">
                                    <div className="mb-3 md:mb-0">
                                        <h4 className="font-medium text-green-800">Import Summary</h4>
                                        <p className="text-sm text-green-600">
                                            {selectedImportProducts.length} products selected • 
                                            Markup: {markupPercentage}% • 
                                            Total Profit: ${selectedImportProducts.reduce((sum, p) => 
                                                sum + ((p.discountPrice || 10) * (markupPercentage / 100)), 0
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleBulkImport}
                                        disabled={importing}
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium shadow-lg transition-all"
                                    >
                                        {importing ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                Importing...
                                            </div>
                                        ) : (
                                            "Complete Import"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Manual Creation Form */
                    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">Create New Product</h2>
                            <p className="text-gray-600">Fill in all required fields to add a new product to your store</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter product name"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="5"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter detailed product description"
                                />
                            </div>

                            {/* Category and Tags */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a category</option>
                                        {categoriesData.map((cat) => (
                                            <option key={cat.title} value={cat.title}>
                                                {cat.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., new, popular, sale (comma separated)"
                                    />
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Original Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={originalPrice}
                                        onChange={(e) => setOriginalPrice(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter original price"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Selling Price ($) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={discountPrice}
                                        onChange={(e) => setDiscountPrice(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter selling price"
                                    />
                                </div>
                            </div>

                            {/* Stock */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter stock quantity"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Product Images <span className="text-red-500">*</span>
                                </label>
                                <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                        accept="image/*"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <AiOutlinePlusCircle className="w-16 h-16 text-gray-400 mb-4 hover:text-blue-500 transition-colors" />
                                        <span className="text-blue-500 font-medium text-lg">
                                            Click to upload images
                                        </span>
                                        <span className="text-sm text-gray-500 mt-2">
                                            or drag and drop (PNG, JPG, JPEG up to 5MB each)
                                        </span>
                                    </label>
                                    
                                    {images.length > 0 && (
                                        <div className="mt-8">
                                            <p className="text-sm text-gray-600 mb-4">
                                                {images.length} image(s) selected
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                {images.map((image, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={URL.createObjectURL(image)}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-32 h-32 object-cover rounded-lg shadow-md group-hover:opacity-75 transition-opacity"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setImages(images.filter((_, i) => i !== index));
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                                        >
                                                            <AiOutlineClose />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4 pt-8 border-t">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Reset Form
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg"
                                >
                                    Create Product
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateProduct;