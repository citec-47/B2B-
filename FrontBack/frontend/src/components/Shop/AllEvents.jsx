import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect } from "react";
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteEvent, getAllEventsShop } from "../../redux/actions/event";
import Loader from "../Layout/Loader";

const AllEvents = () => {
  const { events, isLoading } = useSelector((state) => state.events);
  const { seller } = useSelector((state) => state.seller);

  const dispatch = useDispatch();

  useEffect(() => {
    // Make sure we have a seller ID before fetching
    if (seller && seller._id) {
      console.log("Fetching events for seller ID:", seller._id);
      dispatch(getAllEventsShop(seller._id));
    }
  }, [dispatch, seller, seller?._id]); // Added seller._id to dependencies

  const handleDelete = (id) => {
    dispatch(deleteEvent(id));
    window.location.reload();
  };

  // Utility function to format image URL
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/40x40?text=No+Image";
    }
    
    // If it's already a full URL, return it
    if (image.startsWith("http")) {
      return image;
    }
    
    // If it's just a filename, construct the full URL
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    return `${backendUrl}/uploads/${image}`;
  };

  const columns = [
    { field: "id", headerName: "Event Id", minWidth: 150, flex: 0.7 },
    {
      field: "image",
      headerName: "Image",
      minWidth: 80,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => {
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={params.row.image || "https://via.placeholder.com/40x40?text=No+Image"} 
              alt="Event" 
              className="w-10 h-10 object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/40x40?text=Image+Error";
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
      field: "Stock",
      headerName: "Stock",
      type: "number",
      minWidth: 80,
      flex: 0.5,
    },
    {
      field: "sold",
      headerName: "Sold out",
      type: "number",
      minWidth: 130,
      flex: 0.6,
    },
    {
      field: "Preview",
      flex: 0.8,
      minWidth: 100,
      headerName: "Preview",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <Link to="/events">
            <Button>
              <AiOutlineEye size={20} />
            </Button>
          </Link>
        );
      },
    },
    {
      field: "Delete",
      flex: 0.8,
      minWidth: 120,
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

  const row = [];

  events &&
    events.forEach((item) => {
      // Get the first image for display
      const firstImage = item.images && item.images.length > 0 
        ? getImageUrl(item.images[0]) 
        : "https://via.placeholder.com/40x40?text=No+Image";
      
      row.push({
        id: item._id,
        name: item.name,
        price: "US$ " + (item.discountPrice || 0),
        Stock: item.stock || 0,
        sold: item.sold_out || 0,
        image: firstImage, // Add the image URL for the image column
      });
    });

  // Debug logging to check data
  useEffect(() => {
    console.log("📊 Events from Redux:", events);
    console.log("📊 Rows for DataGrid:", row);
    console.log("👤 Seller ID:", seller?._id);
  }, [events, row]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white">
          <DataGrid
            rows={row}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}  // Fixed Material-UI warning
            disableSelectionOnClick
            autoHeight
          />
        </div>
      )}
    </>
  );
};

export default AllEvents;