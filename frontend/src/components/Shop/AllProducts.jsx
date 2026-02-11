// Components/Shop/AllProducts.jsx
import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllProductsShop } from "../../redux/actions/product";
import { deleteProduct } from "../../redux/actions/product";
import Loader from "../Layout/Loader";

const AllProducts = () => {
  const { products, isLoading } = useSelector((state) => state.products);
  const { seller } = useSelector((state) => state.seller);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllProductsShop(seller._id));
  }, [dispatch, seller._id]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
      setTimeout(() => {
        dispatch(getAllProductsShop(seller._id));
      }, 1000);
    }
  };

  // Utility function to ensure image URLs are properly formatted
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/120x120?text=No+Image";
    }
    
    // If it's already a full URL, return it
    if (image.startsWith("http")) {
      return image;
    }
    
    // If it's just a filename, construct the full URL
    // Use environment variable or default to localhost for development
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    return `${backendUrl}/uploads/${image}`;
  };

  const columns = [
    { field: "id", headerName: "Product Id", minWidth: 150, flex: 0.7 },
    {
      field: "image",
      headerName: "Image",
      minWidth: 100,
      flex: 0.5,
      renderCell: (params) => {
        const imageUrl = params.row.images && params.row.images.length > 0 
          ? getImageUrl(params.row.images[0])
          : "https://via.placeholder.com/120x120?text=No+Image";
        
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={imageUrl} 
              alt="Product" 
              className="w-12 h-12 object-cover rounded-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/120x120?text=Image+Error";
              }}
            />
          </div>
        );
      },
    },
    {
      field: "name",
      headerName: "Name",
      minWidth: 180,
      flex: 1.4,
    },
    {
      field: "price",
      headerName: "Price",
      minWidth: 100,
      flex: 0.6,
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
      headerName: "Sold Out",
      type: "number",
      minWidth: 130,
      flex: 0.6,
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 120,
      flex: 0.6,
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
            <Button className="text-blue-600 hover:text-blue-800">
              <AiOutlineEye size={20} />
            </Button>
          </Link>
        );
      },
    },
    {
      field: "delete",
      flex: 0.8,
      minWidth: 120,
      headerName: "Delete",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <Button 
            onClick={() => handleDelete(params.id)}
            className="text-red-600 hover:text-red-800"
          >
            <AiOutlineDelete size={20} />
          </Button>
        );
      },
    },
  ];

  const rows = [];

  products &&
    products.forEach((item) => {
      // Ensure images array exists
      const images = item.images || [];
      
      rows.push({
        id: item._id,
        name: item.name,
        price: item.discountPrice ? `US$ ${item.discountPrice}` : "US$ 0",
        stock: item.stock || 0,
        sold: item.sold_out || 0,
        category: item.category || "Uncategorized",
        images: images, // Store images for the image column renderer
      });
    });

  // Debug: Log product data to see what's being received
  useEffect(() => {
    if (products && products.length > 0) {
      console.log("Products received in AllProducts:", products);
      console.log("First product data:", products[0]);
      console.log("First product images:", products[0].images);
    }
  }, [products]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-semibold text-gray-800">
              All Products ({rows.length})
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your products, update stock, and track sales
            </p>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <Link to="/dashboard-create-product">
                <Button 
                  variant="contained" 
                  color="primary"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  + Add New Product
                </Button>
              </Link>
            </div>
            
            {rows.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 mt-2">
                  Start by creating your first product
                </p>
                <Link to="/dashboard-create-product">
                  <Button 
                    variant="outlined" 
                    color="primary"
                    className="mt-4"
                  >
                    Create Product
                  </Button>
                </Link>
              </div>
            ) : (
              <div style={{ height: 500, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  autoHeight={false}
                  checkboxSelection={false}
                  className="border-0"
                  components={{
                    NoRowsOverlay: () => (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-gray-500">No products available</p>
                        </div>
                      </div>
                    ),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AllProducts;