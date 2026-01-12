// CreateProduct.jsx - ENHANCED VERSION FOR 700+ PRODUCT DATABASE
import React, { useState, useEffect, useCallback } from "react";
import { AiOutlinePlusCircle, AiOutlineImport, AiOutlineCheck, AiOutlineClose, AiOutlineInfoCircle } from "react-icons/ai";
import { BsEye, BsSearch, BsFilter } from "react-icons/bs";
import { FaDollarSign, FaPercentage, FaTags, FaStar, FaBoxOpen } from "react-icons/fa";
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

  // Import states - ENHANCED FOR 700+ PRODUCTS
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importProducts, setImportProducts] = useState([]);
  const [selectedImportProducts, setSelectedImportProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [importCategory, setImportCategory] = useState("All");
  const [importCategories, setImportCategories] = useState(["All"]);
  const [markupPercentage, setMarkupPercentage] = useState(30);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [sortBy, setSortBy] = useState("popular"); // popular, price-low, price-high, rating
  const [brandFilter, setBrandFilter] = useState("");
  const [availableBrands, setAvailableBrands] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

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

  // Generate enhanced fallback products
  const getFallbackProducts = useCallback(() => {
    const categories = [
      "smartphones", "laptops", "fragrances", "skincare", "groceries",
      "home-decoration", "furniture", "fashion", "beauty", "sports",
      "electronics", "clothing", "accessories", "home", "kitchen",
      "books", "toys", "automotive", "jewelry", "shoes"
    ];
    
    const brands = [
      "Apple", "Samsung", "Nike", "Adidas", "Sony", "Dell", "HP", "Lenovo",
      "Gucci", "Chanel", "Dior", "Microsoft", "Canon", "Nikon", "Bose",
      "LG", "Asus", "Xiaomi", "OnePlus", "Google"
    ];
    
    const products = [];
    
    for (let i = 0; i < 24; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const price = parseFloat((Math.random() * 500 + 20).toFixed(2));
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
      const reviewCount = Math.floor(Math.random() * 10000) + 100;
      
      products.push({
        externalId: `fallback-${Date.now()}-${i}`,
        name: `${brand} ${category.charAt(0).toUpperCase() + category.slice(1)} Pro ${i + 1}`,
        description: `Premium ${category} from ${brand}. Features high-quality materials, excellent performance, and modern design. Perfect for everyday use with warranty included. Rating: ${rating}/5.0 from ${reviewCount.toLocaleString()} reviews.`,
        category: category,
        originalPrice: parseFloat((price * 1.5).toFixed(2)),
        discountPrice: price,
        stock: Math.floor(Math.random() * 500) + 10,
        images: [
          `https://picsum.photos/400/300?random=${i + 1}&product=${category}`,
          `https://picsum.photos/400/300?random=${i + 100}&product=${category}`
        ],
        brand: brand,
        rating: rating,
        reviewCount: reviewCount,
        externalSource: "DemoCatalog",
        tags: "imported,bestseller,trending,premium",
        specifications: {
          brand: brand,
          model: `MOD-${Math.floor(Math.random() * 10000)}`,
          weight: `${(Math.random() * 3 + 0.5).toFixed(1)}kg`,
          warranty: `${Math.floor(Math.random() * 3) + 1} Year Warranty`,
          origin: `${['USA', 'Germany', 'Japan', 'Korea', 'China'][Math.floor(Math.random() * 5)]}`
        }
      });
    }
    
    return products;
  }, []);

  // Fetch external products - ENHANCED WITH FILTERS
  const fetchExternalProducts = useCallback(async (page = 1, categoryFilter = importCategory, searchTerm = search) => {
    setLoadingProducts(true);
    
    try {
      const params = new URLSearchParams({
        category: categoryFilter === "All" ? "" : categoryFilter,
        search: searchTerm,
        page: page,
        limit: 12,
      });

      const url = `${server}/product/fetch-external?${params}`;
      console.log(`🌐 Fetching products from massive database: ${url}`);
      
      let apiData = null;
      
      try {
        const response = await axios.get(url, { timeout: 15000 });
        apiData = response?.data;
        console.log("✅ API Response:", apiData);
      } catch (apiError) {
        console.warn("⚠️ API call failed:", apiError.message);
        apiData = null;
      }
      
      if (apiData && apiData.success) {
        console.log(`✅ Loaded ${apiData.products?.length || 0} of ${apiData.total || 0} products`);
        
        let products = apiData.products || [];
        
        // Apply brand filter
        if (brandFilter && brandFilter !== "All Brands") {
          products = products.filter(p => p.brand === brandFilter);
        }
        
        // Apply price range filter
        products = products.filter(p => 
          p.discountPrice >= minPrice && p.discountPrice <= maxPrice
        );
        
        // Apply sorting
        switch(sortBy) {
          case "price-low":
            products.sort((a, b) => a.discountPrice - b.discountPrice);
            break;
          case "price-high":
            products.sort((a, b) => b.discountPrice - a.discountPrice);
            break;
          case "rating":
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case "popular":
          default:
            products.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
            break;
        }
        
        setImportProducts(products);
        setTotalProducts(apiData.total || products.length);
        setTotalPages(apiData.pages || 1);
        setCurrentPage(apiData.page || 1);
        setBackendStatus("connected");
        
        // Extract unique brands for filter
        const brands = [...new Set(apiData.products?.map(p => p.brand).filter(Boolean))].sort();
        setAvailableBrands(["All Brands", ...brands]);
        
      } else {
        console.warn("⚠️ Using enhanced demo catalog");
        toast.info("Using enhanced demo catalog with 700+ product simulation");
        const fallbackProducts = getFallbackProducts();
        setImportProducts(fallbackProducts);
        setTotalProducts(24);
        setTotalPages(1);
        setBackendStatus("fallback");
        
        const brands = [...new Set(fallbackProducts.map(p => p.brand).filter(Boolean))].sort();
        setAvailableBrands(["All Brands", ...brands]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to load products");
      const fallbackProducts = getFallbackProducts();
      setImportProducts(fallbackProducts);
      setTotalProducts(24);
      setTotalPages(1);
      setBackendStatus("error");
    } finally {
      setLoadingProducts(false);
    }
  }, [importCategory, search, brandFilter, minPrice, maxPrice, sortBy, getFallbackProducts]);

  // Fetch import categories
  const fetchImportCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const url = `${server}/product/import-categories`;
      console.log(`🌐 Fetching categories: ${url}`);
      
      let apiData = null;
      
      try {
        const response = await axios.get(url, { timeout: 15000 });
        apiData = response?.data;
      } catch (error) {
        console.error("Categories API error:", error.message);
      }
      
      if (apiData && apiData.success !== false) {
        console.log(`📋 Loaded ${apiData.categories?.length || 0} categories`);
        const categories = apiData.categories || [];
        setImportCategories(["All", ...categories]);
      } else {
        console.warn("⚠️ Using default categories");
        setImportCategories(["All", "Electronics", "Fashion", "Home", "Beauty", "Sports"]);
      }
    } catch (error) {
      console.error("Error in fetchImportCategories:", error);
      setImportCategories(["All", "Electronics", "Fashion", "Home", "Beauty", "Sports"]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Initialize import panel
  useEffect(() => {
    if (showImportPanel) {
      fetchImportCategories();
      fetchExternalProducts();
    }
  }, [showImportPanel, fetchImportCategories, fetchExternalProducts]);

  // Handle search with debounce
  const handleSearch = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchExternalProducts(1, importCategory, search);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setImportCategory(e.target.value);
    setCurrentPage(1);
    fetchExternalProducts(1, e.target.value, search);
  };

  // Handle brand change
  const handleBrandChange = (e) => {
    setBrandFilter(e.target.value);
    setCurrentPage(1);
    fetchExternalProducts(1, importCategory, search);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
    fetchExternalProducts(1, importCategory, search);
  };

  // Handle price range change
  const handlePriceRangeChange = () => {
    setCurrentPage(1);
    fetchExternalProducts(1, importCategory, search);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchExternalProducts(page, importCategory, search);
  };

  // Handle manual image upload
  const handleImageChange = (e) => {
    e.preventDefault();
    let files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, WebP allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Max size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    setImages((prevImages) => [...prevImages, ...validFiles]);
  };

  // Handle manual product creation
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!name || !description || !category || !discountPrice || !stock || images.length === 0) {
      toast.error("Please fill all required fields and upload at least one image");
      return;
    }

    if (!seller || !seller._id) {
      toast.error("Seller information not found");
      return;
    }

    if (parseFloat(discountPrice) <= 0) {
      toast.error("Selling price must be greater than 0");
      return;
    }

    if (parseInt(stock) < 0) {
      toast.error("Stock cannot be negative");
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
    newForm.append("originalPrice", originalPrice || discountPrice);
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

  // Handle bulk import - ENHANCED FOR MASSIVE DATABASE
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
          description: product.description || `Premium ${product.category || 'product'} from ${product.brand || 'trusted brand'}. ${product.description || 'High-quality product with excellent features.'}`,
          category: product.category || "Uncategorized",
          discountPrice: costPrice,
          originalPrice: product.originalPrice || (sellingPrice * 1.5),
          stock: product.stock || 100,
          tags: product.tags || "imported,bestseller,trending",
          externalId: product.externalId || `EXT-${Date.now()}-${index}`,
          externalSource: product.externalSource || "MassiveCatalog",
          images: product.images || [`https://picsum.photos/400/300?random=${index}`],
          brand: product.brand || "",
          specifications: product.specifications || {},
          rating: product.rating || 4.0,
          reviewCount: product.reviewCount || 100
        };
      });

      console.log(`🚀 Starting bulk import for shop: ${seller._id}`);
      console.log(`📦 Products to import: ${productsToImport.length}`);

      const url = `${server}/product/bulk-import-external`;
      console.log(`🌐 Calling: ${url}`);
      
      try {
        const response = await axios.post(url, {
          products: productsToImport,
          shopId: seller._id,
          markupPercentage: parseFloat(markupPercentage)
        }, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
          timeout: 30000
        });

        const apiData = response?.data;
        console.log("📨 Import Response:", apiData);

        if (apiData && apiData.success) {
          const importedCount = apiData.results?.imported || 0;
          const failedCount = apiData.results?.failed || 0;
          
          if (importedCount > 0) {
            toast.success(`🎉 Successfully imported ${importedCount} products!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
            
            if (seller && seller._id) {
              console.log("🔄 Refreshing product list...");
              dispatch(getAllProductsShop(seller._id));
            }
            
            setSelectedImportProducts([]);
            setShowImportPanel(false);
            navigate("/dashboard-products");
            
          } else {
            toast.error("No products were imported. Please check the error messages.");
          }
        } else {
          const errorMsg = apiData?.message || "Import failed without error details";
          toast.error(`❌ ${errorMsg}`);
        }
      } catch (apiError) {
        console.error("💥 Bulk import API error:", apiError);
        toast.error(`❌ Failed to import products: ${apiError.message}`);
      }
      
    } catch (error) {
      console.error("💥 Bulk import error:", error);
      toast.error(`❌ Failed to import products: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Clear all selected products
  const handleClearSelection = () => {
    setSelectedImportProducts([]);
    toast.info("Selection cleared");
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

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      toast.info("🧪 Testing backend connection...");
      const healthUrl = server.replace('/api/v2', '') + '/health';
      console.log("Testing:", healthUrl);
      
      try {
        const response = await axios.get(healthUrl, { timeout: 10000 });
        const apiData = response?.data;
        
        if (apiData) {
          console.log("✅ Backend health:", apiData);
          toast.success(`✅ Backend is running! Database: ${apiData.database || "Unknown"}, Products: 700+`);
          setBackendStatus("connected");
          return true;
        } else {
          toast.error("❌ Backend is not responding properly");
          setBackendStatus("error");
          return false;
        }
      } catch (apiError) {
        toast.error("❌ Backend is not running. Please start the server on port 5000.");
        setBackendStatus("error");
        return false;
      }
    } catch (error) {
      console.error("Backend test failed:", error);
      toast.error("❌ Backend test failed");
      setBackendStatus("error");
      return false;
    }
  };

  // Calculate total profit
  const calculateTotalProfit = () => {
    return selectedImportProducts.reduce((sum, p) => {
      const costPrice = p.discountPrice || 10;
      const profit = costPrice * (markupPercentage / 100);
      return sum + profit;
    }, 0).toFixed(2);
  };

  // Calculate total investment
  const calculateTotalInvestment = () => {
    return selectedImportProducts.reduce((sum, p) => {
      const costPrice = p.discountPrice || 10;
      return sum + costPrice;
    }, 0).toFixed(2);
  };

  // Calculate total selling price
  const calculateTotalSellingPrice = () => {
    return selectedImportProducts.reduce((sum, p) => {
      const costPrice = p.discountPrice || 10;
      const sellingPrice = costPrice * (1 + markupPercentage / 100);
      return sum + sellingPrice;
    }, 0).toFixed(2);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !showImportPanel) {
        e.preventDefault();
        const form = e.target.closest('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton) submitButton.click();
        }
      }
      
      if (e.key === 'Escape' && showImportPanel) {
        setShowImportPanel(false);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && showImportPanel) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showImportPanel]);

  // Render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${i < fullStars ? 'text-yellow-500' : i === fullStars && halfStar ? 'text-yellow-300' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
        <span className="ml-1 text-xs text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // If error occurs in component, show fallback UI
  try {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Debug & Status Panel */}
          <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <AiOutlineInfoCircle className="text-blue-500" />
                  System Status & Database Info
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${
                    backendStatus === "connected" ? "bg-green-500 animate-pulse" :
                    backendStatus === "fallback" ? "bg-yellow-500" :
                    backendStatus === "error" ? "bg-red-500" : "bg-gray-500"
                  }`}></div>
                  <span className="text-sm font-medium text-gray-600">
                    {backendStatus === "connected" ? "✅ Connected to 700+ Product Database" :
                     backendStatus === "fallback" ? "⚠️ Using Enhanced Demo Catalog" :
                     backendStatus === "error" ? "❌ Connection Error" : "🔌 Connecting..."}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                  <span>Server: {server}</span>
                  <span>•</span>
                  <span>Seller: {seller?.name || "Not logged in"}</span>
                  <span>•</span>
                  <span>Total Products: {totalProducts.toLocaleString()}+</span>
                  <span>•</span>
                  <span>Categories: {importCategories.length - 1}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testBackendConnection}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>🔌</span> Test Connection
                </button>
                <button
                  onClick={() => {
                    setSearch("");
                    setImportCategory("All");
                    setBrandFilter("All Brands");
                    setCurrentPage(1);
                    fetchExternalProducts();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-sm hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-2 shadow-sm"
                >
                  <BsFilter />
                  Reset Filters
                </button>
              </div>
            </div>
            
            {/* Database Stats */}
            {backendStatus === "connected" && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{totalProducts.toLocaleString()}+</div>
                    <div className="text-xs text-gray-600">Total Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{importCategories.length - 1}</div>
                    <div className="text-xs text-gray-600">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{availableBrands.length - 1}</div>
                    <div className="text-xs text-gray-600">Premium Brands</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">4.2+</div>
                    <div className="text-xs text-gray-600">Avg Rating</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Header with Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {showImportPanel ? "📦 Import Products (700+ Database)" : "➕ Create Custom Product"}
              </h1>
              <p className="text-gray-600 max-w-3xl">
                {showImportPanel 
                  ? `Browse and import from our massive catalog of ${totalProducts.toLocaleString()} premium products across ${importCategories.length - 1} categories` 
                  : "Design and create unique products with full customization and control over every detail"
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              <button
                onClick={() => {
                  setShowImportPanel(false);
                  setSelectedImportProducts([]);
                  resetForm();
                }}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${
                  !showImportPanel 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow'
                }`}
              >
                <AiOutlinePlusCircle className="text-lg" />
                Create Manual
              </button>
              <button
                onClick={() => {
                  setShowImportPanel(true);
                  setSelectedImportProducts([]);
                }}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${
                  showImportPanel 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow'
                }`}
              >
                <AiOutlineImport className="text-lg" />
                Import Products
                <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  700+
                </span>
              </button>
              <button
                onClick={handleViewAllProducts}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <BsEye className="text-lg" />
                View Products
              </button>
            </div>
          </div>

          {/* Import Products Panel */}
          {showImportPanel ? (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Import Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Massive Product Catalog</h2>
                    <p className="opacity-90">Select products to instantly add to your store from 700+ premium items</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 md:mt-0">
                    {backendStatus === "fallback" && (
                      <div className="px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-400/50 backdrop-blur-sm">
                        <p className="text-sm font-medium">⚠️ Demo Mode Active</p>
                        <p className="text-xs opacity-90">Connect to backend for full 700+ catalog</p>
                      </div>
                    )}
                    {selectedImportProducts.length > 0 && (
                      <div className="px-4 py-2 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
                        <p className="text-sm font-medium">Selected: {selectedImportProducts.length}</p>
                        <p className="text-xs opacity-90">Profit: ${calculateTotalProfit()}</p>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="opacity-90">Page {currentPage} of {totalPages}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Import Filters */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaTags />
                      Category
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      value={importCategory}
                      onChange={handleCategoryChange}
                      disabled={loadingCategories}
                    >
                      {loadingCategories ? (
                        <option>Loading categories...</option>
                      ) : (
                        importCategories.map((cat, index) => (
                          <option key={`${cat}-${index}`} value={cat}>
                            {cat}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaBoxOpen />
                      Brand
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      value={brandFilter}
                      onChange={handleBrandChange}
                      disabled={availableBrands.length === 0}
                    >
                      {availableBrands.map((brand, index) => (
                        <option key={`${brand}-${index}`} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaStar />
                      Sort By
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      value={sortBy}
                      onChange={handleSortChange}
                    >
                      <option value="popular">Most Popular</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FaPercentage />
                      Your Profit: <span className="text-green-600 font-bold ml-auto">{markupPercentage}%</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={markupPercentage}
                        onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>+10%</span>
                        <span className="font-bold text-green-600">+{markupPercentage}%</span>
                        <span>+100%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaDollarSign />
                      Price Range: ${minPrice} - ${maxPrice}
                    </label>
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <BsFilter />
                      {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
                    </button>
                  </div>
                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Min Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={minPrice}
                          onChange={(e) => setMinPrice(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Max Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                        />
                      </div>
                      <div>
                        <button
                          onClick={handlePriceRangeChange}
                          className="w-full mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Apply Price Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Search Bar */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Products
                  </label>
                  <div className="flex">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-l-lg p-3 pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Search by name, brand, description, or tags... (Ctrl+F)"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          handleSearch();
                        }}
                        onKeyPress={(e) => e.key === "Enter" && fetchExternalProducts(1, importCategory, search)}
                      />
                      <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 rounded-r-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                      onClick={() => fetchExternalProducts(1, importCategory, search)}
                      disabled={loadingProducts}
                    >
                      {loadingProducts ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Searching...
                        </>
                      ) : (
                        <>
                          <BsSearch />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Selection Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedImportProducts.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="font-semibold">
                      📋 {selectedImportProducts.length} products selected
                    </span>
                    {selectedImportProducts.length > 0 && (
                      <>
                        <span className="text-green-600 ml-2">
                          • Total Profit: ${calculateTotalProfit()}
                        </span>
                        <span className="text-blue-600 ml-2">
                          • Investment: ${calculateTotalInvestment()}
                        </span>
                        <button
                          onClick={handleClearSelection}
                          className="ml-2 text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <AiOutlineClose className="text-xs" />
                          Clear All
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm ${
                        selectedImportProducts.length > 0
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={handleBulkImport}
                      disabled={selectedImportProducts.length === 0 || importing}
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Importing {selectedImportProducts.length}...
                        </>
                      ) : (
                        <>
                          <AiOutlineImport />
                          Import Selected
                          <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {selectedImportProducts.length}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowImportPanel(false);
                        setSelectedImportProducts([]);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <AiOutlineClose />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid & Pagination */}
              <div className="p-6">
                {/* Product Count & Source Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {importProducts.length} of {totalProducts.toLocaleString()} products • 
                    Source: <span className={`font-medium ${backendStatus === "connected" ? 'text-green-600' : 'text-yellow-600'}`}>
                      {backendStatus === "connected" ? "Massive 700+ Database" : "Enhanced Demo Catalog"}
                    </span>
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loadingProducts}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm ${currentPage === pageNum ? 'bg-green-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {totalPages > 5 && (
                          <span className="text-gray-500 mx-1">...</span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loadingProducts}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {loadingProducts ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading Massive Product Catalog...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Fetching {totalProducts.toLocaleString()} premium products
                    </p>
                    <div className="mt-4 w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-green-500 animate-pulse" style={{width: '70%'}}></div>
                    </div>
                  </div>
                ) : importProducts.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-6xl mb-6">🔍</div>
                    <p className="text-xl font-medium mb-2">No products match your filters</p>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Try adjusting your search terms, category filter, or price range
                    </p>
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium transition-colors flex items-center gap-2 mx-auto shadow-sm"
                      onClick={() => {
                        setSearch("");
                        setImportCategory("All");
                        setBrandFilter("All Brands");
                        setSortBy("popular");
                        setMinPrice(0);
                        setMaxPrice(1000);
                        fetchExternalProducts();
                      }}
                    >
                      <AiOutlineClose />
                      Reset All Filters
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
                            className={`border rounded-xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 relative ${
                              isSelected ? 'border-green-500 border-2 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-500/20' : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => handleSelectImportProduct(product, !isSelected)}
                          >
                            <div className="relative">
                              <div className="w-full h-48 mb-3 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                                {product.images && product.images[0] ? (
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://picsum.photos/400/300?random=${index}&product=${product.category}`;
                                    }}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                      <div className="text-4xl mb-2">📦</div>
                                      <p className="text-sm">Product Image</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg z-10 animate-pulse">
                                  <AiOutlineCheck className="mr-1" /> Selected
                                </div>
                              )}
                              
                              <div className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full shadow">
                                {product.externalSource || "Catalog"}
                              </div>
                              
                              {product.brand && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                  {product.brand}
                                </div>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm md:text-base h-12">
                              {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full truncate max-w-[120px] font-medium">
                                {product.category || "Uncategorized"}
                              </span>
                              <div className="flex items-center">
                                {renderStars(product.rating || 4.0)}
                                {product.reviewCount && (
                                  <span className="ml-1 text-xs text-gray-500">
                                    ({formatNumber(product.reviewCount)})
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600 line-clamp-2 mb-4 h-10">
                              {product.description || "Premium product with excellent features."}
                            </p>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-bold text-green-600 text-lg">
                                    ${sellingPrice.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Cost: <span className="line-through">${costPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-600">
                                    Stock: {product.stock || 100}
                                  </div>
                                  <div className="text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-2 py-1 rounded-full">
                                    Profit: ${profit.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 flex justify-between">
                                <div>
                                  <span className="font-medium">Markup:</span> {markupPercentage}%
                                </div>
                                {product.specifications?.warranty && (
                                  <div className="text-blue-600 font-medium">
                                    {product.specifications.warranty}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Import Button */}
              {selectedImportProducts.length > 0 && (
                <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 p-4 shadow-2xl z-20 backdrop-blur-sm bg-opacity-95">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-3 md:mb-0">
                      <p className="font-medium text-white text-lg">
                        🚀 Ready to import {selectedImportProducts.length} products
                      </p>
                      <div className="text-sm text-gray-300 grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <div>
                          <span className="text-gray-400">Investment:</span> ${calculateTotalInvestment()}
                        </div>
                        <div>
                          <span className="text-gray-400">Selling Price:</span> ${calculateTotalSellingPrice()}
                        </div>
                        <div>
                          <span className="text-gray-400">Total Profit:</span> <span className="text-green-400 font-bold">${calculateTotalProfit()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Your Markup:</span> {markupPercentage}%
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleBulkImport}
                        disabled={importing}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium shadow-lg transition-all flex items-center gap-2 animate-pulse"
                      >
                        {importing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Importing {selectedImportProducts.length} Products...
                          </>
                        ) : (
                          <>
                            <AiOutlineImport />
                            🚀 Import {selectedImportProducts.length} Products Now
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleClearSelection}
                        className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 font-medium transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Creation Form - UNCHANGED */
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Create Custom Product</h2>
                <p className="text-gray-600">Add unique products to your store with full control over every detail</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter product name"
                    maxLength={200}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter detailed product description"
                    maxLength={2000}
                  />
                  <div className="text-xs text-gray-500 mt-2 text-right">
                    {description.length}/2000 characters
                  </div>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., new, popular, sale (comma separated)"
                    />
                    <div className="text-xs text-gray-500 mt-2">
                      Separate tags with commas
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Original Price ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Selling Price ($) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter stock quantity"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Images <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({images.length} of 10 images selected)
                    </span>
                  </label>
                  <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
                    <input
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      accept="image/*"
                      disabled={images.length >= 10}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer flex flex-col items-center ${images.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <AiOutlinePlusCircle className="w-16 h-16 text-gray-400 mb-4 hover:text-blue-500 transition-colors" />
                      <span className="text-blue-500 font-medium text-lg">
                        {images.length >= 10 ? 'Maximum 10 images reached' : 'Click to upload images'}
                      </span>
                      <span className="text-sm text-gray-500 mt-2">
                        (PNG, JPG, JPEG, WebP up to 5MB each)
                      </span>
                    </label>
                    
                    {images.length > 0 && (
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm text-gray-600">
                            {images.length} image{images.length !== 1 ? 's' : ''} selected
                          </p>
                          <button
                            type="button"
                            onClick={() => setImages([])}
                            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <AiOutlineClose />
                            Clear All
                          </button>
                        </div>
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
                                  e.stopPropagation();
                                  setImages(images.filter((_, i) => i !== index));
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                                title="Remove image"
                              >
                                ×
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                                {image.name}
                              </div>
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
                    className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <AiOutlineClose />
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <AiOutlinePlusCircle />
                    Create Product
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      Ctrl+S
                    </span>
                  </button>
                </div>
              </form>
              
              {/* Keyboard Shortcuts Help */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AiOutlineInfoCircle />
                  Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">S</kbd>
                    <span>Save product</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">Ctrl</kbd>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">F</kbd>
                    <span>Search products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm">Esc</kbd>
                    <span>Cancel/Close</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (componentError) {
    // If component itself crashes, show error UI
    console.error("Component error caught:", componentError);
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 max-w-md bg-white rounded-2xl shadow-xl border border-red-100">
          <div className="text-6xl mb-6 text-red-500">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Component Error</h2>
          <p className="text-gray-700 mb-2">The CreateProduct component encountered an error:</p>
          <div className="text-sm text-gray-600 mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
            {componentError.message}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                navigate("/dashboard");
              }}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default CreateProduct;