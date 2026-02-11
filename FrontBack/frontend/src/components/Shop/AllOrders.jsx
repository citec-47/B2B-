import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Loader from "../Layout/Loader";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { AiOutlineArrowRight } from "react-icons/ai";

const AllOrders = () => {
    const { orders, isLoading, error } = useSelector((state) => state.order);
    const { seller } = useSelector((state) => state.seller);
    const [tableData, setTableData] = useState([]);

    const dispatch = useDispatch();

    useEffect(() => {
        if (seller && seller._id) {
            console.log("🛍️ Fetching orders for seller:", seller.name);
            console.log("📋 Seller ID:", seller._id);
            dispatch(getAllOrdersOfShop(seller._id));
        } else {
            console.error("❌ No seller found. Please login as seller.");
        }
    }, [dispatch, seller]);

    // Process the orders for the table
    useEffect(() => {
        console.log("🔄 Processing orders for table...");
        console.log("Orders from Redux:", orders);
        
        if (orders && Array.isArray(orders)) {
            const processedRows = orders.map((order, index) => {
                // Extract data from your database structure
                const orderId = order._id || order.id || `order-${index}`;
                const orderStatus = order.orderStatus || order.status || "Pending";
                const totalPrice = order.totalPrice || 0;
                const itemsCount = order.cart?.length || 0;
                const customerName = order.user?.name || "Unknown Customer";
                const customerEmail = order.user?.email || "";
                const createdAt = order.createdAt;
                
                console.log(`   Order ${index + 1}:`, {
                    id: orderId,
                    status: orderStatus,
                    total: totalPrice,
                    items: itemsCount,
                    customer: customerName,
                    shopId: order.shopId
                });

                return {
                    id: orderId,
                    itemsQty: itemsCount,
                    total: totalPrice,
                    status: orderStatus,
                    customer: customerName,
                    customerEmail: customerEmail,
                    createdAt: createdAt,
                    orderDate: createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"
                };
            });
            
            console.log("✅ Processed rows for table:", processedRows);
            setTableData(processedRows);
        } else {
            console.log("📭 No orders array found");
            setTableData([]);
        }
    }, [orders]);

    const columns = [
        { 
            field: "id", 
            headerName: "Order ID", 
            minWidth: 180, 
            flex: 0.8,
            valueGetter: (params) => params.row.id.length > 15 
                ? params.row.id.substring(0, 15) + "..." 
                : params.row.id
        },
        {
            field: "customer",
            headerName: "Customer",
            minWidth: 150,
            flex: 0.7,
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 130,
            flex: 0.6,
            cellClassName: (params) => {
                const status = params.row.status;
                if (status === "Delivered") return "greenColor";
                if (status === "Processing") return "blueColor";
                if (status === "Shipped") return "orangeColor";
                return "redColor";
            },
        },
        {
            field: "itemsQty",
            headerName: "Items",
            type: "number",
            minWidth: 80,
            flex: 0.4,
        },
        {
            field: "total",
            headerName: "Total",
            type: "number",
            minWidth: 120,
            flex: 0.6,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: "orderDate",
            headerName: "Order Date",
            minWidth: 120,
            flex: 0.6,
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 120,
            flex: 0.6,
            sortable: false,
            renderCell: (params) => {
                // FIX: Use the correct route that matches your OrderDetails component
                return (
                    <Link to={`/order/${params.row.id}`}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            style={{ 
                                textTransform: 'none',
                                backgroundColor: '#1976d2',
                                padding: '6px 12px'
                            }}
                        >
                            <AiOutlineArrowRight size={16} style={{ marginRight: 6 }} />
                            View Details
                        </Button>
                    </Link>
                );
            },
        },
    ];

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full mx-8 pt-1 mt-10 bg-white p-8 rounded-lg shadow">
                <Loader />
                <div className="mt-4 text-center">
                    <p className="text-gray-600">Loading orders for {seller?.name}...</p>
                    <p className="text-sm text-gray-500 mt-1">Seller ID: {seller?._id}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="w-full mx-8 pt-1 mt-10 bg-white p-8 rounded-lg shadow">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <span className="text-2xl text-red-600">!</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Orders</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                        <h4 className="font-medium text-gray-700 mb-2">Debug Information:</h4>
                        <p className="text-sm">Seller: {seller?.name || "Not logged in"}</p>
                        <p className="text-sm">Seller ID: {seller?._id || "No ID"}</p>
                        <p className="text-sm">Orders in state: {orders?.length || 0}</p>
                    </div>
                    
                    <button 
                        onClick={() => seller && seller._id && dispatch(getAllOrdersOfShop(seller._id))}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="w-full mx-8 pt-1 mt-10 bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">All Orders</h2>
                        <p className="text-gray-600 mt-1">
                            {seller?.name} • {tableData.length} order(s)
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                            Seller ID: {seller?._id?.substring(0, 12)}...
                        </div>
                        {tableData.length > 0 && (
                            <div className="mt-2 text-sm text-green-600">
                                Total Sales: ${tableData.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table or Empty State */}
            <div className="p-4">
                {tableData.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                            <span className="text-3xl text-gray-400">📦</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Your shop "{seller?.name}" doesn't have any orders yet.
                        </p>
                        
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md mx-auto mb-6">
                            <h4 className="font-medium text-blue-800 mb-2">Order Information from Database:</h4>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p>• Shop ID: <code className="bg-blue-100 px-1 rounded">n3I9vH4SVA4ZJcvuE8le</code></p>
                                <p>• Order Status: <span className="font-medium">Processing</span></p>
                                <p>• Total: <span className="font-medium">$200.00</span></p>
                                <p>• Customer: <span className="font-medium">Demo User</span></p>
                            </div>
                        </div>
                        
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => {
                                    console.log("=== DEBUG INFORMATION ===");
                                    console.log("Seller:", seller);
                                    console.log("Orders from Redux:", orders);
                                    console.log("Table Data:", tableData);
                                    console.log("Expected Shop ID: n3I9vH4SVA4ZJcvuE8le");
                                    console.log("API Endpoint should be: /order/get-seller-all-orders/n3I9vH4SVA4ZJcvuE8le");
                                    
                                    // Test the API endpoint
                                    if (seller?._id) {
                                        const testUrl = `http://localhost:5000/api/v2/order/test-seller-orders/${seller._id}`;
                                        console.log("Test URL:", testUrl);
                                        alert("Check console for debug info. Test URL: " + testUrl);
                                    }
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg"
                            >
                                Debug Info
                            </button>
                            
                            <button 
                                onClick={() => seller && seller._id && dispatch(getAllOrdersOfShop(seller._id))}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
                            >
                                Refresh Orders
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {tableData.length} order(s)
                            </div>
                            <div className="text-sm text-gray-600">
                                Total: ${tableData.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                            </div>
                        </div>
                        
                        <DataGrid
                            rows={tableData}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[5, 10, 20]}
                            disableSelectionOnClick
                            autoHeight
                            sx={{
                                border: 0,
                                '& .MuiDataGrid-cell': {
                                    borderBottom: '1px solid #f0f0f0',
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '2px solid #e9ecef',
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: '#f8f9fa',
                                },
                                '& .greenColor': {
                                    color: '#10B981',
                                    fontWeight: 600,
                                },
                                '& .blueColor': {
                                    color: '#3B82F6',
                                    fontWeight: 600,
                                },
                                '& .orangeColor': {
                                    color: '#F59E0B',
                                    fontWeight: 600,
                                },
                                '& .redColor': {
                                    color: '#EF4444',
                                    fontWeight: 600,
                                },
                            }}
                        />
                    </>
                )}
            </div>

            {/* Footer with debug info */}
            <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>
                        <span className="font-medium">Shop:</span> {seller?.name} 
                        <span className="mx-2">•</span>
                        <span className="font-medium">ID:</span> {seller?._id?.substring(0, 10)}...
                    </div>
                    <div>
                        <span className="font-medium">Orders:</span> {tableData.length}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Status:</span> {isLoading ? "Loading..." : "Ready"}
                    </div>
                </div>
                
                {/* Quick debug button */}
                <div className="mt-2">
                    <button 
                        onClick={() => {
                            console.log("=== CURRENT STATE ===");
                            console.log("Seller:", seller);
                            console.log("Seller ID:", seller?._id);
                            console.log("Expected Shop ID for orders:", "n3I9vH4SVA4ZJcvuE8le");
                            console.log("Orders from Redux:", orders);
                            console.log("Table Data:", tableData);
                        }}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
                    >
                        Log State to Console
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AllOrders;