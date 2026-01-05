import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineEye, AiOutlineImport } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllProductsShop, deleteProduct } from "../../redux/actions/product";
import Loader from "../Layout/Loader";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const AllProducts = () => {
  const { products, isLoading, error } = useSelector((state) => state.products);
  // FIX: Try different ways to get seller
  const sellerFromSeller = useSelector((state) => state.seller);
  const sellerFromUser = useSelector((state) => state.user?.user);
  
  // Use whichever has data
  const seller = sellerFromSeller?.seller || sellerFromSeller || sellerFromUser;
  
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [apiTestResult, setApiTestResult] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    console.log("DEBUG: Seller info:", seller);
    console.log("DEBUG: Seller ID:", seller?._id);
    
    // Try to get seller ID from multiple places
    const sellerId = seller?._id || seller?.seller?._id || seller?.id;
    
    if (sellerId) {
      console.log("DEBUG: Fetching products for shop ID:", sellerId);
      dispatch(getAllProductsShop(sellerId));
    } else {
      console.log("DEBUG: No seller ID found. Seller data:", seller);
      toast.info("Please login as a seller to view products");
    }
  }, [dispatch, seller]);

  useEffect(() => {
    console.log("DEBUG: Products received:", products?.length);
    
    if (products && Array.isArray(products)) {
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
        id: item._id,
        name: item.name,
        category: item.category || "Uncategorized",
        price: item.discountPrice?.toFixed(2) || "0.00",
        stock: item.stock || 0,
        sold: item.sold_out || 0,
        isImported: item.isImported || false,
      }));
      
      setRows(formattedRows);
      console.log("DEBUG: Formatted rows:", formattedRows.length);
    } else {
      setRows([]);
    }
  }, [products, searchTerm, filterType]);

  // Test API directly
  const testAPI = async () => {
    // Get seller ID
    const sellerId = seller?._id || seller?.seller?._id || seller?.id;
    
    if (!sellerId) {
      toast.error("No seller ID found. Please login.");
      return;
    }
    
    try {
      toast.info("Testing API connection...");
      
      // Test the API endpoint
      const response = await axios.get(
        `${server}/product/get-all-products-shop/${sellerId}`,
        { 
          withCredentials: true,
          timeout: 10000 
        }
      );
      
      setApiTestResult(response.data);
      console.log("API Response:", response.data);
      
      if (response.data.success) {
        toast.success(`API Works! Found ${response.data.products?.length || 0} products`);
        
        // Update Redux state with the products
        if (response.data.products) {
          dispatch({
            type: "getAllProductsShopSuccess",
            payload: response.data.products,
          });
        }
      } else {
        toast.error(`API Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("API Test Error:", error);
      let errorMessage = error.message;
      if (error.response?.status === 404) {
        errorMessage = "API endpoint not found (404)";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error (500)";
      }
      toast.error(`API Failed: ${errorMessage}`);
      
      setApiTestResult({
        success: false,
        error: errorMessage,
        endpoint: `${server}/product/get-all-products-shop/${sellerId}`
      });
    }
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

  const columns = [
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
  ];

  // Statistics
  const importedCount = products ? products.filter(p => p.isImported === true).length : 0;
  const manualCount = products ? products.filter(p => !p.isImported || p.isImported === false).length : 0;
  const totalCount = products ? products.length : 0;
  const inStockCount = products ? products.filter(p => p.stock > 0).length : 0;

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white">
          {/* Debug Panel */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800">Debug Info</h4>
                <div className="text-sm text-gray-600">
                  Seller ID: {seller?._id || seller?.seller?._id || seller?.id || "Not found"} | 
                  Products: {totalCount} | 
                  Error: {error || "None"}
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
            
            {apiTestResult && (
              <div className="mt-2 p-2 bg-white rounded border text-xs">
                <strong>API Test:</strong> {apiTestResult.success ? "✅ Success" : "❌ Failed"}
                {apiTestResult.products && (
                  <span> - {apiTestResult.products.length} products</span>
                )}
                {apiTestResult.error && (
                  <div className="text-red-600">Error: {apiTestResult.error}</div>
                )}
              </div>
            )}
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
                {/* Search Bar */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products by name, category, or tags..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Type Filter */}
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
                
                {/* Action Buttons */}
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

          {/* Products Table */}
          {rows.length === 0 ? (
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
          ) : (
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
          )}
          
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
        </div>
      )}
    </>
  );
};

export default AllProducts;