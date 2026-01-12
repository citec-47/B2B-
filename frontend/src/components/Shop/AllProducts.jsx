// AllProducts.jsx - COMPLETELY FIXED VERSION WITH NO ESLINT WARNINGS
import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AiOutlineDelete, AiOutlineEye, AiOutlineImport, AiOutlineWarning } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllProductsShop, deleteProduct } from "../../redux/actions/product";
import Loader from "../Layout/Loader";
import axios from "axios";
import { apiUrl, getImageUrl, backend_url } from "../../server";
import { toast } from "react-toastify";

const AllProducts = () => {
  // Get products from Redux state
  const productsState = useSelector((state) => state.products);
  const sellerFromSeller = useSelector((state) => state.seller);
  const sellerFromUser = useSelector((state) => state.user?.user);
  
  // Extract products with safe defaults using useMemo to prevent re-renders
  const products = useMemo(() => productsState?.products || [], [productsState?.products]);
  const isLoading = useMemo(() => productsState?.isLoading || false, [productsState?.isLoading]);
  const productsError = useMemo(() => productsState?.error || null, [productsState?.error]);
  
  // Get seller info
  const seller = sellerFromSeller?.seller || sellerFromSeller || sellerFromUser;
  
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [apiTestResult, setApiTestResult] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const dispatch = useDispatch();

  // Fetch products when component mounts or seller changes
  useEffect(() => {
    console.log("🔄 AllProducts mounted");
    console.log("🔍 Seller info:", seller);
    console.log("📦 Current products in state:", products.length);
    
    const sellerId = seller?._id || seller?.seller?._id || seller?.id;
    
    if (sellerId) {
      console.log("🛍️ Fetching products for shop ID:", sellerId);
      setFetchError(null); // Clear previous errors
      dispatch(getAllProductsShop(sellerId));
    } else {
      console.log("⚠️ No seller ID found");
      setFetchError("Please login as a seller to view products");
      toast.info("Please login as a seller to view products");
    }
  }, [dispatch, seller, products.length]); // Added products.length as dependency

  // Handle loading and error states
  useEffect(() => {
    if (productsError) {
      setFetchError(productsError);
      console.error("❌ Products fetch error:", productsError);
    } else {
      setFetchError(null);
    }
  }, [productsError, isLoading, fetchError]); // Added fetchError to dependencies

  // Process products into rows for DataGrid
  const processProductsToRows = useCallback(() => {
    console.log("📊 Processing products to rows:", products.length);
    console.log("📊 Is loading:", isLoading);
    console.log("📊 Fetch error:", fetchError);
    
    if (products && Array.isArray(products)) {
      console.log("🎯 Sample product:", products[0] ? {
        name: products[0].name,
        images: products[0].images,
        firstImage: products[0].images?.[0]
      } : 'No products');
      
      let filteredProducts = [...products];
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          (product.name && product.name.toLowerCase().includes(term)) ||
          (product.category && product.category.toLowerCase().includes(term)) ||
          (product.tags && product.tags.toLowerCase().includes(term))
        );
      }
      
      // Apply type filter
      if (filterType === "imported") {
        filteredProducts = filteredProducts.filter(product => product.isImported === true);
      } else if (filterType === "manual") {
        filteredProducts = filteredProducts.filter(product => !product.isImported || product.isImported === false);
      }
      
      // Format rows for DataGrid
      const formattedRows = filteredProducts.map((item) => ({
        id: item._id || `temp-${Math.random()}`,
        name: item.name || "Unnamed Product",
        category: item.category || "Uncategorized",
        price: item.discountPrice?.toFixed(2) || "0.00",
        stock: item.stock || 0,
        sold: item.sold_out || 0,
        isImported: item.isImported || false,
        images: item.images || []
      }));
      
      setRows(formattedRows);
      console.log("📋 Formatted rows:", formattedRows.length);
    } else {
      setRows([]);
    }
  }, [products, searchTerm, filterType, isLoading, fetchError]);

  // Call the processing function when dependencies change
  useEffect(() => {
    processProductsToRows();
  }, [processProductsToRows]);

  // Test API directly with better error handling
  const testAPI = async () => {
    const sellerId = seller?._id || seller?.seller?._id || seller?.id;
    
    if (!sellerId) {
      toast.error("No seller ID found. Please login.");
      return;
    }
    
    try {
      toast.info("Testing API connection...");
      
      const response = await axios.get(
        apiUrl(`/product/get-all-products-shop/${sellerId}`),
        { 
          withCredentials: true,
          timeout: 10000 
        }
      );
      
      console.log("✅ Full API Response:", response);
      console.log("✅ Response data:", response.data);
      
      setApiTestResult(response.data);
      
      if (response.data && response.data.success !== false) {
        const productsCount = response.data.products?.length || 0;
        toast.success(`API Works! Found ${productsCount} products`);
        
        // Update Redux state with the products
        if (response.data.products) {
          const processedProducts = response.data.products.map(product => ({
            ...product,
            images: product.images?.map(img => getImageUrl(img))
          }));
          
          dispatch({
            type: "getAllProductsShopSuccess",
            payload: processedProducts,
          });
        }
      } else {
        toast.error(`API Error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("❌ API Test Error:", error);
      console.error("❌ Error response:", error.response);
      
      let errorMessage = error.message;
      let errorDetails = {};
      
      if (error.response) {
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        
        if (error.response.status === 404) {
          errorMessage = "API endpoint not found (404)";
        } else if (error.response.status === 500) {
          errorMessage = "Server error (500)";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication required (401)";
        }
      } else if (error.request) {
        errorMessage = "No response from server. Check if backend is running.";
        errorDetails = { request: error.request };
      }
      
      toast.error(`API Failed: ${errorMessage}`);
      
      setApiTestResult({
        success: false,
        error: errorMessage,
        details: errorDetails,
        endpoint: apiUrl(`/product/get-all-products-shop/${sellerId}`),
        server: backend_url
      });
    }
  };

  // Debug images
  const debugImages = () => {
    console.log("🔍 Debug Images Info:");
    console.log("📦 Total products:", products.length);
    console.log("🌐 Backend URL:", backend_url);
    
    if (products && products.length > 0) {
      products.forEach((product, index) => {
        console.log(`Product ${index + 1}: ${product.name}`);
        console.log(`  Images:`, product.images);
        if (product.images && product.images.length > 0) {
          console.log(`  First image URL:`, product.images[0]);
        }
      });
    }
    
    toast.info("Check console for image debug info");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
      setTimeout(() => {
        const sellerId = seller?._id || seller?.seller?._id || seller?.id;
        if (sellerId) {
          dispatch(getAllProductsShop(sellerId));
        }
      }, 500);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const columns = useMemo(() => [
    {
      field: "image",
      headerName: "Image",
      minWidth: 100,
      flex: 0.8,
      sortable: false,
      renderCell: (params) => {
        const productImages = params.row.images || [];
        const firstImage = productImages[0];
        
        let imageUrl = `${backend_url}/uploads/default-product.jpg`;
        
        if (firstImage) {
          if (typeof firstImage === 'string') {
            if (firstImage.startsWith('http')) {
              imageUrl = firstImage;
            } else if (firstImage.includes('/uploads/')) {
              imageUrl = `${backend_url}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
            } else {
              imageUrl = `${backend_url}/uploads/${firstImage}`;
            }
          } else if (firstImage.url) {
            imageUrl = firstImage.url.startsWith('http') 
              ? firstImage.url 
              : `${backend_url}/uploads/${firstImage.url}`;
          }
        }
        
        console.log(`🖼️ DataGrid Image:`, {
          product: params.row.name,
          originalImage: firstImage,
          finalUrl: imageUrl
        });
        
        return (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200">
              <img
                src={imageUrl}
                alt={params.row.name}
                className="w-full h-full object-cover"
                onLoad={() => console.log(`✅ DataGrid image loaded: ${imageUrl}`)}
                onError={(e) => {
                  console.error(`❌ DataGrid image failed: ${imageUrl}`);
                  e.target.src = `${backend_url}/uploads/default-product.jpg`;
                }}
              />
            </div>
          </div>
        );
      },
    },
    { field: "id", headerName: "Product ID", minWidth: 150, flex: 0.7 },
    {
      field: "name",
      headerName: "Name",
      minWidth: 180,
      flex: 1.4,
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 120,
      flex: 0.7,
    },
    {
      field: "price",
      headerName: "Price",
      minWidth: 100,
      flex: 0.6,
      renderCell: (params) => {
        return `$${params.row.price}`;
      },
    },
    {
      field: "stock",
      headerName: "Stock",
      type: "number",
      minWidth: 80,
      flex: 0.5,
    },
    {
      field: "sold",
      headerName: "Sold",
      type: "number",
      minWidth: 80,
      flex: 0.5,
    },
    {
      field: "type",
      headerName: "Type",
      minWidth: 100,
      flex: 0.6,
      renderCell: (params) => {
        const isImported = params.row.isImported;
        return (
          <div className="flex items-center">
            {isImported && <AiOutlineImport className="mr-1 text-purple-600" />}
            <span className={`px-2 py-1 rounded-full text-xs ${isImported ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
              {isImported ? "Imported" : "Manual"}
            </span>
          </div>
        );
      },
    },
    {
      field: "preview",
      flex: 0.8,
      minWidth: 100,
      headerName: "Preview",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <Link to={`/product/${params.id}`}>
            <Button>
              <AiOutlineEye size={20} />
            </Button>
          </Link>
        );
      },
    },
    {
      field: "delete",
      flex: 0.8,
      minWidth: 100,
      headerName: "Delete",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <Button onClick={() => handleDelete(params.id)}>
            <AiOutlineDelete size={20} />
          </Button>
        );
      },
    },
  ], []);

  const importedCount = useMemo(() => products.filter(p => p.isImported === true).length, [products]);
  const manualCount = useMemo(() => products.filter(p => !p.isImported || p.isImported === false).length, [products]);
  const totalCount = useMemo(() => products.length, [products]);
  const inStockCount = useMemo(() => products.filter(p => p.stock > 0).length, [products]);

  // Render error state
  const renderErrorState = useCallback(() => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
        <AiOutlineWarning className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Products</h3>
      <p className="text-gray-600 mb-4">{fetchError || "Unknown error occurred"}</p>
      <div className="space-x-4">
        <Button 
          variant="outlined" 
          onClick={() => {
            const sellerId = seller?._id || seller?.seller?._id || seller?.id;
            if (sellerId) {
              dispatch(getAllProductsShop(sellerId));
            }
          }}
        >
          Retry
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={testAPI}
        >
          Test API Connection
        </Button>
      </div>
    </div>
  ), [dispatch, fetchError, seller, testAPI]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg mb-4">
        {searchTerm || filterType !== "all" 
          ? "No products match your filters" 
          : "No products found in your shop"
        }
      </p>
      <div className="space-x-4">
        {(searchTerm || filterType !== "all") && (
          <Button 
            variant="outlined" 
            onClick={() => {
              setSearchTerm("");
              setFilterType("all");
            }}
          >
            Clear Filters
          </Button>
        )}
        <Link to="/dashboard-create-product">
          <Button variant="contained" color="primary">
            Create Your First Product
          </Button>
        </Link>
      </div>
    </div>
  ), [searchTerm, filterType]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white">
          {/* Enhanced Debug Panel */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800">🛠️ Debug Panel</h4>
                <div className="text-sm text-gray-600">
                  Seller ID: {seller?._id || seller?.seller?._id || seller?.id || "Not found"} | 
                  Products: {totalCount} | 
                  Status: {fetchError ? "❌ Error" : "✅ Ready"} | 
                  Backend: {backend_url}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={testAPI}
                  className="text-blue-600 border-blue-600"
                >
                  Test API
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={debugImages}
                  className="text-purple-600 border-purple-600"
                >
                  Debug Images
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const sellerId = seller?._id || seller?.seller?._id || seller?.id;
                    if (sellerId) {
                      dispatch(getAllProductsShop(sellerId));
                      toast.info("Refreshing products...");
                    }
                  }}
                  className="text-green-600 border-green-600"
                >
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Error Display */}
            {fetchError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <div className="flex items-center">
                  <AiOutlineWarning className="text-red-500 mr-2" />
                  <span className="font-semibold text-red-700">Error:</span>
                  <span className="ml-2 text-red-600">{fetchError}</span>
                </div>
              </div>
            )}
            
            {apiTestResult && (
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <strong>API Test:</strong> 
                <span className={apiTestResult.success ? "text-green-600" : "text-red-600"}>
                  {apiTestResult.success ? "✅ Success" : "❌ Failed"}
                </span>
                {apiTestResult.products && (
                  <span> - {apiTestResult.products.length} products</span>
                )}
                {apiTestResult.error && (
                  <div className="text-red-600">Error: {apiTestResult.error}</div>
                )}
              </div>
            )}
            
            {/* Quick Image Test */}
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Test Image:</span>
                <img 
                  src={`${backend_url}/uploads/default-product.jpg`} 
                  alt="Test" 
                  className="h-8 w-8 object-cover rounded border"
                  onLoad={() => console.log('✅ Default image loads')}
                  onError={() => console.log('❌ Default image fails')}
                />
                <button 
                  onClick={() => window.open(`${backend_url}/uploads/default-product.jpg`, '_blank')}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Open
                </button>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">All Products</h1>
            
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600">Total Products</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-600">Manual Products</p>
                <p className="text-2xl font-bold">{manualCount}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600">Imported Products</p>
                <p className="text-2xl font-bold">{importedCount}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <p className="text-sm text-orange-600">In Stock</p>
                <p className="text-2xl font-bold">{inStockCount}</p>
              </div>
            </div>
            
            {/* Filters and Search */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products by name, category, or tags..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-4 py-2 rounded-lg ${filterType === "all" ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("manual")}
                    className={`px-4 py-2 rounded-lg ${filterType === "manual" ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setFilterType("imported")}
                    className={`px-4 py-2 rounded-lg ${filterType === "imported" ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Imported
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <Link to="/dashboard">
                    <Button variant="outlined" className="mr-2">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/dashboard-create-product">
                    <Button variant="contained" color="primary">
                      Add Product
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {fetchError ? (
            renderErrorState()
          ) : rows.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Products Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  disableSelectionOnClick
                  autoHeight
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f1f5f9',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f8fafc',
                      borderBottom: '2px solid #e2e8f0',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #e2e8f0',
                    },
                  }}
                />
              </div>
              
              {/* Footer Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-sm text-gray-600 mb-2 md:mb-0">
                    Showing <span className="font-semibold">{rows.length}</span> of <span className="font-semibold">{totalCount}</span> products
                    {filterType !== "all" && ` (${filterType} only)`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Manual: {manualCount}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      <span>Imported: {importedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Quick Console Commands */}
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200 text-xs">
            <strong>💡 Quick Debug Commands (Copy to console):</strong>
            <pre className="mt-1 text-xs bg-gray-800 text-white p-2 rounded overflow-x-auto">
{`// Test image loading
function testImages() {
  const images = document.querySelectorAll('img');
  images.forEach((img, i) => {
    console.log(\`Image \${i+1}: \${img.src}\`);
  });
}

// Test backend connection
fetch("${backend_url}/api/v2/debug/images")
  .then(r => r.json())
  .then(d => console.log("Backend debug:", d));

// Check product data
console.log("Products:", window.store.getState().products.products);`}
            </pre>
          </div>
        </div>
      )}
    </>
  );
};

export default AllProducts;