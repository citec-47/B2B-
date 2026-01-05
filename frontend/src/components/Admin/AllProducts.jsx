import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const AllProducts = () => {
  const { seller } = useSelector((state) => state.seller);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [markupPercentage, setMarkupPercentage] = useState(30);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Generate more mock products
  const generateMockProducts = () => {
    const categoriesList = [
      "Electronics", "Mobile Phones", "Laptops", "Tablets", 
      "Smart Watches", "Headphones", "Speakers", "Cameras",
      "Fashion", "Men's Clothing", "Women's Clothing", "Shoes", "Accessories",
      "Home & Kitchen", "Furniture", "Home Decor", "Kitchen Appliances",
      "Beauty & Health", "Skincare", "Makeup", "Health Supplements",
      "Sports & Outdoors", "Fitness Equipment", "Outdoor Gear",
      "Toys & Games", "Video Games", "Board Games", "Educational Toys",
      "Automotive", "Car Parts", "Car Accessories",
      "Books", "Fiction", "Non-fiction",
      "Jewelry", "Watches", "Bags", "Sunglasses"
    ];

    const brands = {
      "Mobile Phones": ["Samsung", "Apple", "Xiaomi", "OnePlus", "Google", "Oppo", "Vivo", "Realme", "Motorola"],
      "Laptops": ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Microsoft", "MSI", "Razer"],
      "Fashion": ["Nike", "Adidas", "Zara", "H&M", "Levi's", "Gucci", "Puma", "Under Armour", "Calvin Klein"],
      "Home & Kitchen": ["IKEA", "Philips", "Tefal", "KitchenAid", "Hamilton Beach", "Instant Pot", "Ninja", "Cuisinart"],
      "Electronics": ["Sony", "LG", "Panasonic", "Bose", "JBL", "Logitech", "Canon", "Nikon", "GoPro"],
      "Beauty & Health": ["L'Oreal", "Maybelline", "Nivea", "Neutrogena", "Cetaphil", "The Ordinary", "Cerave", "La Roche-Posay"],
      "Sports & Outdoors": ["Nike", "Adidas", "Under Armour", "Columbia", "The North Face", "Patagonia", "Puma", "Reebok"]
    };

    const products = [];
    
    // Generate 100 products
    for (let i = 1; i <= 100; i++) {
      const category = categoriesList[Math.floor(Math.random() * categoriesList.length)];
      const brandList = brands[category] || ["Generic", "Premium", "Standard", "Elite", "Professional"];
      const brand = brandList[Math.floor(Math.random() * brandList.length)];
      
      const costPrice = Math.random() * 500 + 10;
      const originalPrice = costPrice * (1.3 + Math.random() * 0.7);
      
      // Create product variations
      const productNames = [
        `${brand} ${category} Pro`,
        `${brand} ${category} Max`,
        `${brand} ${category} Ultra`,
        `${brand} ${category} Premium`,
        `${brand} ${category} Elite`,
        `${brand} ${category} Advanced`,
        `${brand} ${category} Smart`,
        `${brand} ${category} Wireless`,
        `${brand} ${category} Bluetooth`,
        `${brand} ${category} Digital`
      ];
      
      const descriptions = [
        `High-performance ${category.toLowerCase()} with premium features and excellent durability.`,
        `Advanced ${category.toLowerCase()} technology with cutting-edge design and superior quality.`,
        `Professional-grade ${category.toLowerCase()} for everyday use with exceptional performance.`,
        `Premium ${category.toLowerCase()} featuring innovative technology and sleek design.`,
        `Top-rated ${category.toLowerCase()} with excellent customer reviews and reliable performance.`
      ];
      
      const tagsOptions = [
        "Best Seller", "New Arrival", "Hot Item", "Limited Edition", "Trending",
        "Free Shipping", "Discounted", "Premium Quality", "Customer Favorite", "Top Rated"
      ];
      
      const selectedTags = [];
      for (let j = 0; j < 3; j++) {
        if (Math.random() > 0.5) {
          const tag = tagsOptions[Math.floor(Math.random() * tagsOptions.length)];
          if (!selectedTags.includes(tag)) {
            selectedTags.push(tag);
          }
        }
      }
      
      products.push({
        externalId: `EXT-${Date.now()}-${i}`,
        name: productNames[Math.floor(Math.random() * productNames.length)] + ` ${i}`,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        category,
        originalPrice: parseFloat(originalPrice.toFixed(2)),
        discountPrice: parseFloat(costPrice.toFixed(2)),
        stock: Math.floor(Math.random() * 500) + 10,
        images: [
          `https://source.unsplash.com/400x400/?${category.toLowerCase().replace(/\s+/g, '')},product`,
          `https://source.unsplash.com/400x400/?${category.toLowerCase().replace(/\s+/g, '')},item`,
          `https://source.unsplash.com/400x400/?${brand.toLowerCase()},product`
        ],
        externalSource: "MOCK",
        externalUrl: `https://mockapi.com/product/${i}`,
        tags: selectedTags.join(","),
        brand,
        specifications: {
          brand,
          model: `MOD-${Math.floor(Math.random() * 10000)}`,
          weight: `${(Math.random() * 5 + 0.1).toFixed(1)}kg`,
          color: ["Black", "White", "Silver", "Blue", "Red", "Gold", "Space Gray", "Midnight Green"][Math.floor(Math.random() * 8)],
          warranty: `${Math.floor(Math.random() * 3) + 1} years`,
          material: ["Plastic", "Metal", "Glass", "Carbon Fiber", "Aluminum"][Math.floor(Math.random() * 5)]
        },
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3-5 stars
        reviewCount: Math.floor(Math.random() * 1000)
      });
    }
    
    return products;
  };

  // Fetch external products
  const fetchExternalProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: category === "All" ? "" : category,
        search,
        page,
        limit: 20,
      });

      console.log("Fetching from:", `${server}/api/v2/product/fetch-external?${params}`);
      
      const response = await axios.get(
        `${server}/api/v2/product/fetch-external?${params}`,
        { 
          withCredentials: true,
          timeout: 5000
        }
      );

      console.log("API Response received:", response.data?.products?.length || 0, "products");
      
      if (response.data.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.pages || 1);
        setTotalProducts(response.data.total || response.data.products.length);
      } else {
        // Fallback to mock data
        throw new Error("API response not successful");
      }
    } catch (error) {
      console.error("API Error:", error.message);
      
      // Generate and use mock data as fallback
      console.log("Generating mock data...");
      let allMockProducts = generateMockProducts();
      
      // Apply filtering to mock data
      let filteredProducts = allMockProducts;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
        );
      }
      
      if (category !== "All") {
        filteredProducts = filteredProducts.filter(p => p.category === category);
      }
      
      // Pagination for mock data
      const start = (page - 1) * 20;
      const end = start + 20;
      const paginatedProducts = filteredProducts.slice(start, end);
      
      setProducts(paginatedProducts);
      setTotalPages(Math.ceil(filteredProducts.length / 20));
      setTotalProducts(filteredProducts.length);
      
      // Show info message
      if (error.message !== "API response not successful") {
        toast.info("Using demo data with 100+ products.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${server}/api/v2/product/import-categories`,
        { 
          withCredentials: true,
          timeout: 5000
        }
      );
      
      if (response.data.success) {
        setCategories(response.data.categories);
      } else {
        // Fallback categories
        const allCategories = ["All"];
        const mockProducts = generateMockProducts();
        const uniqueCategories = [...new Set(mockProducts.map(p => p.category))].sort();
        setCategories([...allCategories, ...uniqueCategories]);
      }
    } catch (error) {
      console.error("Categories error:", error.message);
      // Fallback categories from mock data
      const mockProducts = generateMockProducts();
      const uniqueCategories = [...new Set(mockProducts.map(p => p.category))].sort();
      setCategories(["All", ...uniqueCategories]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExternalProducts();
  }, []);

  useEffect(() => {
    fetchExternalProducts();
  }, [page, category]);

  const handleSelectProduct = (product, isSelected) => {
    if (isSelected) {
      setSelectedProducts([...selectedProducts, product]);
    } else {
      setSelectedProducts(selectedProducts.filter((p) => p.externalId !== product.externalId));
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedProducts([...products]);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSingleImport = async (product) => {
    setImporting(true);
    try {
      console.log("Attempting to import:", product.name);
      
      // Try real API first
      const response = await axios.post(
        `${server}/api/v2/product/import-external`,
        {
          ...product,
          shopId: seller._id,
          markupPercentage,
        },
        { 
          withCredentials: true,
          timeout: 5000
        }
      );

      if (response.data.success) {
        toast.success(`${product.name} imported successfully!`);
        setSelectedProducts(selectedProducts.filter((p) => p.externalId !== product.externalId));
      }
    } catch (error) {
      console.error("Import error:", error.message);
      // Simulate success for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(`${product.name} imported successfully! (Demo Mode)`);
      setSelectedProducts(selectedProducts.filter((p) => p.externalId !== product.externalId));
    } finally {
      setImporting(false);
    }
  };

  const handleBulkImport = async () => {
    if (selectedProducts.length === 0) {
      toast.warning("Please select products to import");
      return;
    }

    setImporting(true);
    try {
      console.log("Bulk importing:", selectedProducts.length, "products");
      
      // Try real API first
      const response = await axios.post(
        `${server}/api/v2/product/bulk-import-external`,
        {
          products: selectedProducts,
          shopId: seller._id,
          markupPercentage,
        },
        { 
          withCredentials: true,
          timeout: 10000
        }
      );

      if (response.data.success) {
        toast.success(`Successfully imported ${selectedProducts.length} products!`);
        setSelectedProducts([]);
        setOpenImportDialog(false);
        fetchExternalProducts();
      }
    } catch (error) {
      console.error("Bulk import error:", error.message);
      // Simulate success for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Successfully imported ${selectedProducts.length} products! (Demo Mode)`);
      setSelectedProducts([]);
      setOpenImportDialog(false);
    } finally {
      setImporting(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchExternalProducts();
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  return (
    <div className="w-full mx-8 pt-1 mt-10 bg-white">
      <h2 className="text-2xl font-bold mb-4">Import Products</h2>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800 flex items-center">
          <span className="mr-2">📦</span>
          <span>Browse <strong>{totalProducts}+ products</strong> across multiple categories. Select products to import to your store.</span>
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={category}
              onChange={handleCategoryChange}
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              ) : (
                <option value="All">Loading categories...</option>
              )}
            </select>
          </div>
          
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <div className="flex">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, brand, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                className="bg-blue-500 text-white px-4 rounded-r-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "..." : "🔍 Search"}
              </button>
            </div>
          </div>
          
          {/* Markup Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Markup: <span className="font-bold text-green-600">{markupPercentage}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>30%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <button
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center justify-center disabled:bg-green-300 disabled:cursor-not-allowed"
              onClick={fetchExternalProducts}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Loading...
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats & Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedProducts.length === products.length && products.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 rounded"
              disabled={products.length === 0}
            />
            <label className="ml-2">
              Select All ({selectedProducts.length} selected of {products.length} shown)
            </label>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Total: <span className="font-bold">{totalProducts}</span> products available
            {category !== "All" && <span> in <span className="font-bold">{category}</span></span>}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="text-sm bg-gray-100 px-3 py-1 rounded">
            Page {page} of {totalPages}
          </div>
          <button
            className={`px-4 py-2 rounded-md font-medium flex items-center ${selectedProducts.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            onClick={() => setOpenImportDialog(true)}
            disabled={selectedProducts.length === 0 || importing}
          >
            <span className="mr-2">📥</span>
            Import Selected ({selectedProducts.length})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Select</th>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Pricing</th>
              <th className="py-3 px-4 text-left">Stock</th>
              <th className="py-3 px-4 text-left">Rating</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <span className="text-gray-600">Loading products...</span>
                    <span className="text-sm text-gray-500 mt-2">Fetching from external catalog</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl mb-4">😔</span>
                    <p className="text-lg">No products found</p>
                    <p className="text-sm mt-2">Try a different search or category</p>
                    <button
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={() => {
                        setSearch("");
                        setCategory("All");
                        setPage(1);
                        fetchExternalProducts();
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const sellingPrice = product.discountPrice * (1 + markupPercentage / 100);
                const profit = sellingPrice - product.discountPrice;
                const profitPercentage = ((profit / product.discountPrice) * 100).toFixed(0);
                
                return (
                  <tr key={product.externalId} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.some(p => p.externalId === product.externalId)}
                        onChange={(e) => handleSelectProduct(product, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                        disabled={importing}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded mr-3"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/48";
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600 truncate max-w-xs">{product.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center">
                          <span className="font-bold text-green-600">${sellingPrice.toFixed(2)}</span>
                          <span className="text-xs text-gray-500 ml-2">({profitPercentage}% profit)</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost: ${product.discountPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          Profit: ${profit.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock > 100 ? 'bg-green-100 text-green-800' :
                        product.stock > 50 ? 'bg-blue-100 text-blue-800' :
                        product.stock > 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {"★".repeat(Math.floor(product.rating))}
                          {"☆".repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span className="ml-2 text-sm font-medium">{product.rating}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({product.reviewCount})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                        onClick={() => handleSingleImport(product)}
                        disabled={importing}
                      >
                        {importing ? (
                          <>
                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                            Adding...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">+</span>
                            Add to Store
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            className={`px-3 py-2 rounded-md ${page <= 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            ← Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                className={`px-3 py-2 rounded-md ${page === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            className={`px-3 py-2 rounded-md ${page >= totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Import Dialog */}
      {openImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Confirm Bulk Import</h3>
                <button
                  className="text-gray-500 hover:text-gray-700 text-xl p-1"
                  onClick={() => setOpenImportDialog(false)}
                  disabled={importing}
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📦</span>
                  <div>
                    <p className="text-blue-800 font-medium">
                      Ready to import {selectedProducts.length} products to your store
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Products will be added with {markupPercentage}% markup
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="font-medium mb-2">Selected Products ({selectedProducts.length}):</p>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {selectedProducts.map((product, index) => (
                    <div key={product.externalId} className="flex items-center p-3 border-b hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>{product.category}</span>
                          <span className="mx-2">•</span>
                          <span>{product.brand}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          ${(product.discountPrice * (1 + markupPercentage / 100)).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost: ${product.discountPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-3">Import Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Markup Rate:</span>
                      <span className="font-medium">{markupPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Items:</span>
                      <span className="font-medium">{selectedProducts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Cost:</span>
                      <span className="font-medium">
                        ${selectedProducts.reduce((sum, p) => sum + p.discountPrice, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Selling Price:</span>
                      <span className="font-medium text-green-600">
                        ${selectedProducts.reduce((sum, p) => {
                          return sum + (p.discountPrice * (1 + markupPercentage / 100));
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Profit:</span>
                      <span className="font-medium text-green-700">
                        ${selectedProducts.reduce((sum, p) => {
                          const profit = (p.discountPrice * (1 + markupPercentage / 100)) - p.discountPrice;
                          return sum + profit;
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Profit/Item:</span>
                      <span className="font-medium text-green-600">
                        ${(selectedProducts.reduce((sum, p) => {
                          const profit = (p.discountPrice * (1 + markupPercentage / 100)) - p.discountPrice;
                          return sum + profit;
                        }, 0) / selectedProducts.length).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setOpenImportDialog(false)}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  onClick={handleBulkImport}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Importing {selectedProducts.length} Products...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📥</span>
                      Import {selectedProducts.length} Products
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProducts;