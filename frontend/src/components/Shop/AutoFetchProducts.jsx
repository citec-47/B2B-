// Components/Shop/AutoFetchProducts.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  AiOutlineSearch, 
  AiOutlineDownload, 
  AiOutlineCheckCircle, 
  AiOutlineCheck,
  AiOutlineShoppingCart,
  AiOutlineArrowRight,
  AiOutlineStar,
  AiOutlineAppstore,
  AiOutlineFilter,
  AiOutlineReload,
  AiOutlineRise,
  AiOutlineFall,
  AiOutlineFire,
  AiOutlineShop,
  AiOutlineTag
} from "react-icons/ai";

import { 
  fetchDummyJSONProducts, 
  importDummyJSONProducts, 
  clearErrors,
  fetchDummyJSONCategories 
} from "../../redux/actions/product";

// ==================== CONSTANTS ====================
const DEFAULT_CATEGORIES = [
  'smartphones', 'laptops', 'fragrances', 'skincare', 'groceries',
  'home-decoration', 'furniture', 'tops', 'womens-dresses',
  'womens-shoes', 'mens-shirts', 'mens-shoes', 'mens-watches',
  'womens-watches', 'womens-bags', 'womens-jewellery',
  'sunglasses', 'automotive', 'motorcycle', 'lighting'
];

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular", icon: AiOutlineFire },
  { value: "price_asc", label: "Price: Low to High", icon: AiOutlineRise },
  { value: "price_desc", label: "Price: High to Low", icon: AiOutlineFall },
  { value: "rating_desc", label: "Highest Rated", icon: AiOutlineStar },
  { value: "title_asc", label: "Name: A to Z", icon: AiOutlineTag }
];

const PRODUCTS_PER_PAGE = [12, 24, 36, 48];

// ==================== UTILITY FUNCTIONS ====================
const formatCategoryName = (category) => {
  if (!category) return '';
  if (typeof category === 'string') {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  if (typeof category === 'object') {
    return category.name || category.slug || String(category);
  }
  return String(category);
};

const formatPrice = (price) => {
  return parseFloat(price || 0).toFixed(2);
};

// ==================== MAIN COMPONENT ====================
const AutoFetchProducts = () => {
  const { seller, isSeller } = useSelector((state) => state.seller || {});
  const productsState = useSelector((state) => state.products || {});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ==================== STATE ====================
  const [filters, setFilters] = useState({
    searchQuery: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    sortOrder: "popular",
    page: 1,
    limit: 12
  });

  const [uiState, setUiState] = useState({
    searching: false,
    publishing: false,
    hasSearched: false,
    showFilters: true,
    loadingCategories: false
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);

  // ==================== DERIVED STATE ====================
  const products = productsState.dummyJSONProducts || [];
  const totalProducts = productsState.dummyJSONTotal || 0;
  const totalPages = productsState.dummyJSONTotalPages || 0;

  // Process categories safely
  const processedCategories = useMemo(() => {
    if (rawCategories.length === 0) return DEFAULT_CATEGORIES;
    
    return rawCategories
      .map(cat => {
        if (typeof cat === 'string') return cat;
        if (typeof cat === 'object' && cat !== null) {
          return cat.name || cat.slug || cat.slug || JSON.stringify(cat);
        }
        return String(cat);
      })
      .filter(Boolean);
  }, [rawCategories]);

  // ==================== AUTH CHECK ====================
  useEffect(() => {
    const token = localStorage.getItem('seller_token');
    if (!token || !seller || !isSeller) {
      toast.error("Please login as a seller first");
      navigate("/shop-login");
    }
  }, [seller, isSeller, navigate]);

  // ==================== FETCH CATEGORIES ====================
  useEffect(() => {
    const loadCategories = async () => {
      setUiState(prev => ({ ...prev, loadingCategories: true }));
      try {
        await dispatch(fetchDummyJSONCategories());
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setUiState(prev => ({ ...prev, loadingCategories: false }));
      }
    };
    loadCategories();
  }, [dispatch]);

  // Update rawCategories when Redux state changes
  useEffect(() => {
    if (productsState.dummyJSONCategories?.length) {
      setRawCategories(productsState.dummyJSONCategories);
    }
  }, [productsState.dummyJSONCategories]);

  // ==================== ERROR HANDLER ====================
  useEffect(() => {
    if (productsState.error) {
      toast.error(productsState.error);
      dispatch(clearErrors());
      setUiState(prev => ({ 
        ...prev, 
        searching: false, 
        publishing: false 
      }));
    }
  }, [productsState.error, dispatch]);

  // ==================== IMPORT SUCCESS HANDLER ====================
  useEffect(() => {
    if (productsState.success && productsState.importResults) {
      const { importedCount = 0, failedCount = 0 } = productsState.importResults;
      
      toast.success(`✅ Successfully imported ${importedCount} product(s) to your store!`);
      setUiState(prev => ({ ...prev, publishing: false }));
      setSelectedProducts([]);
      
      if (failedCount > 0) {
        toast.warning(`⚠️ ${failedCount} product(s) failed to import`);
      }
      
      setTimeout(() => {
        navigate("/dashboard-products");
      }, 3000);
    }
  }, [productsState.success, productsState.importResults, navigate]);

  // ==================== HANDLERS ====================
  const handleSearch = useCallback(async (page = 1) => {
    const { searchQuery, category } = filters;
    
    if (!searchQuery && !category) {
      toast.error("Please enter a search term or select a category");
      return;
    }

    setUiState(prev => ({ ...prev, searching: true, hasSearched: true }));
    setFilters(prev => ({ ...prev, page }));

    const params = {
      ...filters,
      page,
      query: filters.searchQuery,
      sort: filters.sortOrder
    };

    try {
      await dispatch(fetchDummyJSONProducts(params));
      setSelectedProducts([]);
      if (productsState.dummyJSONTotal > 0) {
        toast.success(`Found ${productsState.dummyJSONTotal} products!`);
      }
    } catch (error) {
      console.error('❌ Search failed:', error);
      toast.error("Failed to search products. Please try again.");
    } finally {
      setUiState(prev => ({ ...prev, searching: false }));
    }
  }, [dispatch, filters, productsState.dummyJSONTotal]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleProductSelection = useCallback((productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const selectAllProducts = useCallback(() => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  }, [products, selectedProducts.length]);

  const selectRandomProducts = useCallback((count = 5) => {
    if (products.length === 0) return;
    
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selected = shuffled
      .slice(0, Math.min(count, products.length))
      .map(p => p.id);
    
    setSelectedProducts(selected);
    toast.info(`Selected ${selected.length} random products`);
  }, [products]);

  const publishSelectedProducts = useCallback(async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product to publish");
      return;
    }

    if (!seller?._id) {
      toast.error("Seller information not found. Please login again.");
      navigate("/shop-login");
      return;
    }

    setUiState(prev => ({ ...prev, publishing: true }));

    const productsToImport = products
      .filter(product => selectedProducts.includes(product.id))
      .map(product => ({
        id: product.id,
        title: product.title,
        name: product.title,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPrice: product.price,
        images: product.images || [product.thumbnail],
        thumbnail: product.thumbnail,
        category: product.category,
        brand: product.brand,
        tags: ['dummyjson', 'imported', product.category, product.brand].filter(Boolean),
        stock: product.stock,
        rating: product.rating,
        shopId: seller._id
      }));

    try {
      await dispatch(importDummyJSONProducts({
        products: productsToImport,
        shopId: seller._id
      }));
    } catch (error) {
      console.error('❌ Publish failed:', error);
      toast.error("Failed to import products. Please try again.");
      setUiState(prev => ({ ...prev, publishing: false }));
    }
  }, [dispatch, navigate, products, selectedProducts, seller?._id]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [handleSearch, totalPages]);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sortOrder: "popular",
      page: 1,
      limit: 12
    });
    setUiState(prev => ({ ...prev, hasSearched: false }));
    setSelectedProducts([]);
    toast.info("Filters cleared");
  }, []);

  const toggleFilters = useCallback(() => {
    setUiState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  // ==================== PAGINATION ====================
  const paginationRange = useMemo(() => {
    const total = totalPages || 1;
    const current = filters.page;
    const delta = 2;
    
    const range = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    const rangeWithDots = [];
    range.forEach((i, index) => {
      if (index > 0) {
        if (i - range[index - 1] === 2) {
          rangeWithDots.push(range[index - 1] + 1);
        } else if (i - range[index - 1] !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
    });

    return rangeWithDots;
  }, [totalPages, filters.page]);

  // ==================== LOADING STATE ====================
  if (!seller) {
    return (
      <div className="w-full p-6">
        <div className="bg-white shadow-lg rounded-lg p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-700">Loading seller information...</h3>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="w-full p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <Header 
          sellerName={seller.name}
          totalProducts={totalProducts}
          onNavigate={navigate}
        />

        {/* Search Filters */}
        <SearchFilters
          filters={filters}
          uiState={uiState}
          categories={processedCategories}
          sortOptions={SORT_OPTIONS}
          productsPerPage={PRODUCTS_PER_PAGE}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClearFilters={clearFilters}
          onToggleFilters={toggleFilters}
          formatCategoryName={formatCategoryName}
        />

        {/* Results Section */}
        {products.length > 0 ? (
          <ResultsSection
            products={products}
            selectedProducts={selectedProducts}
            totalProducts={totalProducts}
            currentPage={filters.page}
            totalPages={totalPages}
            productsPerPage={filters.limit}
            uiState={uiState}
            onSelectAll={selectAllProducts}
            onSelectRandom={selectRandomProducts}
            onToggleProduct={toggleProductSelection}
            onPublish={publishSelectedProducts}
            onPageChange={handlePageChange}
            paginationRange={paginationRange}
            formatCategoryName={formatCategoryName}
            formatPrice={formatPrice}
          />
        ) : (
          <EmptyState
            hasSearched={uiState.hasSearched}
            onClearFilters={clearFilters}
            onQuickSearch={(category) => {
              setFilters(prev => ({ ...prev, category }));
              handleSearch(1);
            }}
          />
        )}

        {/* Instructions */}
        <Instructions />
      </div>
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================

const Header = ({ sellerName, totalProducts, onNavigate }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">
        Import Products from DummyJSON API
      </h2>
      <div className="flex items-center mt-2 space-x-2">
        <span className="text-sm text-gray-600 mr-2">
          Shop: <span className="font-semibold">{sellerName}</span>
        </span>
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
          Seller Account
        </span>
        {totalProducts > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {totalProducts.toLocaleString()} Products Available
          </span>
        )}
      </div>
    </div>
    <button
      onClick={() => onNavigate("/dashboard-create-product")}
      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150 flex items-center"
    >
      <AiOutlineArrowRight className="mr-2 rotate-180" />
      Back to Manual Create
    </button>
  </div>
);

const SearchFilters = ({
  filters,
  uiState,
  categories,
  sortOptions,
  productsPerPage,
  onFilterChange,
  onSearch,
  onClearFilters,
  onToggleFilters,
  formatCategoryName
}) => (
  <div className="bg-gray-50 p-6 rounded-lg mb-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-700 flex items-center">
        <AiOutlineFilter className="mr-2" />
        Search 1000+ Products
      </h3>
      <button
        onClick={onToggleFilters}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        {uiState.showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>
    </div>

    {uiState.showFilters && (
      <>
        {/* Search Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Products
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Search for any product (iPhone, laptop, shoes, etc.)"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <AiOutlineSearch className="absolute left-3 top-3.5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Search across 1000+ products from 20+ categories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={uiState.loadingCategories}
            >
              <option value="">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {formatCategoryName(cat)}
                </option>
              ))}
            </select>
            {uiState.loadingCategories && (
              <p className="text-xs text-gray-500 mt-1">Loading categories...</p>
            )}
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => onFilterChange('sortOrder', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Products Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {productsPerPage.map((num) => (
                <option key={num} value={num}>
                  {num} Products
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150 flex items-center justify-center"
            >
              <AiOutlineReload className="mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price ($)
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price ($)
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              placeholder="1000"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-end">
          <button
            onClick={() => onSearch(1)}
            disabled={uiState.searching || (!filters.searchQuery && !filters.category)}
            className={`px-6 py-3 rounded-lg font-medium transition duration-150 flex items-center ${
              uiState.searching || (!filters.searchQuery && !filters.category)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uiState.searching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Searching 1000+ products...
              </>
            ) : (
              <>
                <AiOutlineSearch className="mr-2" />
                Search Products
              </>
            )}
          </button>
        </div>
      </>
    )}
  </div>
);

const ResultsSection = ({
  products,
  selectedProducts,
  totalProducts,
  currentPage,
  totalPages,
  productsPerPage,
  uiState,
  onSelectAll,
  onSelectRandom,
  onToggleProduct,
  onPublish,
  onPageChange,
  paginationRange,
  formatCategoryName,
  formatPrice
}) => (
  <div className="mb-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-800">Search Results</h3>
        <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
          {totalProducts.toLocaleString()} products found
        </span>
        <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
          Page {currentPage} of {totalPages || 1}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onSelectAll}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
        </button>
        <button
          onClick={() => onSelectRandom(5)}
          className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          Random 5
        </button>
        <button
          onClick={() => onSelectRandom(10)}
          className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
        >
          Random 10
        </button>
        <span className="text-sm font-medium text-gray-600 ml-2">
          {selectedProducts.length} selected
        </span>
        <button
          onClick={onPublish}
          disabled={uiState.publishing || selectedProducts.length === 0}
          className={`px-4 py-2 rounded-lg font-medium flex items-center ${
            uiState.publishing || selectedProducts.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {uiState.publishing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Importing {selectedProducts.length}...
            </>
          ) : (
            <>
              <AiOutlineDownload className="mr-2" />
              Import ({selectedProducts.length})
            </>
          )}
        </button>
      </div>
    </div>

    {/* Products Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={selectedProducts.includes(product.id)}
          onToggleSelect={onToggleProduct}
          formatCategoryName={formatCategoryName}
          formatPrice={formatPrice}
        />
      ))}
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalProducts={totalProducts}
        productsPerPage={productsPerPage}
        paginationRange={paginationRange}
        onPageChange={onPageChange}
      />
    )}
  </div>
);

const ProductCard = ({
  product,
  isSelected,
  onToggleSelect,
  formatCategoryName,
  formatPrice
}) => (
  <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 relative">
    {/* Selection Checkbox */}
    <div className="absolute top-2 left-2 z-10">
      <button
        onClick={() => onToggleSelect(product.id)}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-white border-2 border-gray-300 hover:border-blue-500'
        }`}
      >
        {isSelected && <AiOutlineCheck size={16} />}
      </button>
    </div>

    {/* Badges */}
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
      {product.rating >= 4.5 && (
        <span className="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full">
          ⭐ Top Rated
        </span>
      )}
      {product.stock > 100 && (
        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          In Stock
        </span>
      )}
    </div>

    {/* Product Image */}
    <div className="h-48 overflow-hidden bg-gray-100 p-4">
      <img
        src={product.images?.[0] || product.thumbnail || 'https://cdn.dummyjson.com/product-images/1/1.jpg'}
        alt={product.title}
        className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://cdn.dummyjson.com/product-images/1/1.jpg';
        }}
      />
    </div>

    {/* Product Info */}
    <div className="p-4">
      <div className="flex items-center mb-1">
        <AiOutlineShop className="text-gray-400 mr-1" />
        <span className="text-xs text-gray-600">{product.brand || 'Generic'}</span>
      </div>
      
      <h4 className="font-medium text-gray-800 mb-2 line-clamp-2 h-12 hover:text-blue-600 transition-colors">
        {product.title}
      </h4>
      
      <div className="flex items-baseline mb-2">
        <span className="text-xl font-bold text-blue-600">
          ${formatPrice(product.price)}
        </span>
        {product.originalPrice > product.price && (
          <>
            <span className="ml-2 text-sm text-gray-500 line-through">
              ${formatPrice(product.originalPrice)}
            </span>
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span className="flex items-center">
          <AiOutlineStar className="text-yellow-400 mr-1" />
          {product.rating || 4.5}
        </span>
        <span className="flex items-center">
          <AiOutlineShoppingCart className="mr-1" />
          {product.orders?.toLocaleString() || Math.floor(Math.random() * 5000 + 1000)} sold
        </span>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        {product.shipping || 'Free Shipping • 7-15 days'}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {formatCategoryName(product.category)}
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          Stock: {product.stock}
        </span>
      </div>
    </div>
  </div>
);

const Pagination = ({
  currentPage,
  totalPages,
  totalProducts,
  productsPerPage,
  paginationRange,
  onPageChange
}) => (
  <div className="flex flex-col items-center mt-8 space-y-4">
    <div className="flex justify-center items-center space-x-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        ⟪
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Previous
      </button>
      
      {paginationRange.map((pageNum, index) => (
        pageNum === '...' ? (
          <span key={`dots-${index}`} className="px-4 py-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-4 py-2 rounded ${
              currentPage === pageNum
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {pageNum}
          </button>
        )
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Next
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        ⟫
      </button>
    </div>
    <div className="text-sm text-gray-600">
      Showing {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts.toLocaleString()} products
    </div>
  </div>
);

const EmptyState = ({ hasSearched, onClearFilters, onQuickSearch }) => (
  <div className="text-center py-16">
    {hasSearched ? (
      <>
        <AiOutlineShoppingCart className="mx-auto text-gray-400 text-6xl mb-4" />
        <h3 className="text-xl font-medium text-gray-700 mb-2">No Products Found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          No products match your search criteria. Try different keywords or browse our categories.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear All Filters
          </button>
          <button
            onClick={() => onQuickSearch("smartphones")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Browse Smartphones
          </button>
        </div>
      </>
    ) : (
      <>
        <AiOutlineAppstore className="mx-auto text-gray-400 text-6xl mb-4" />
        <h3 className="text-xl font-medium text-gray-700 mb-2">Search 1000+ Products to Import</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Enter a search term or select a category to find products from our extensive database
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onQuickSearch("iPhone")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔍 Try "iPhone"
          </button>
          <button
            onClick={() => onQuickSearch("laptops")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            💻 Browse Laptops
          </button>
          <button
            onClick={() => onQuickSearch("womens-dresses")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            👗 Browse Dresses
          </button>
          <button
            onClick={() => onQuickSearch("mens-shoes")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            👟 Browse Men's Shoes
          </button>
        </div>
      </>
    )}
  </div>
);

const Instructions = () => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6">
    <h4 className="font-semibold text-blue-800 mb-3 flex items-center text-lg">
      <AiOutlineCheckCircle className="mr-2" />
      How to import 1000+ products from DummyJSON API:
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
      <div>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>🔍 <strong>Search:</strong> Enter keywords or select a category</li>
          <li>💰 <strong>Filter:</strong> Use price range to narrow results</li>
          <li>📊 <strong>Sort:</strong> Order by price, rating, or popularity</li>
          <li>✅ <strong>Select:</strong> Choose products individually or use "Select All"</li>
        </ol>
      </div>
      <div>
        <ol className="list-decimal pl-5 space-y-2 text-sm" start={5}>
          <li>🎲 <strong>Random:</strong> Use "Random 5/10" for quick selection</li>
          <li>📦 <strong>Import:</strong> Click "Import" to add to your store</li>
          <li>💰 <strong>Profit:</strong> 35% markup automatically applied</li>
          <li>📊 <strong>Stock:</strong> 50-250 units added automatically</li>
        </ol>
      </div>
    </div>
  </div>
);

export default AutoFetchProducts;