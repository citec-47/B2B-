// EventsPage.jsx - SHOWS ALL EVENTS FROM ALL SELLERS
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import EventCard from "../components/Events/EventCard";
import Header from "../components/Layout/Header";
import Loader from "../components/Layout/Loader";
import { getAllEvents } from "../redux/actions/event"; // Use getAllEvents NOT getAllEventsShop

const EventsPage = () => {
  const { allEvents, isLoading } = useSelector((state) => state.events); // Use allEvents
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("🚀 EventsPage: Fetching ALL events for public viewing");
    dispatch(getAllEvents()); // This gets ALL events from ALL sellers
  }, [dispatch]);

  // Debug log
  useEffect(() => {
    console.log("📊 EventsPage: Redux state - isLoading:", isLoading);
    console.log("📊 EventsPage: All events data:", allEvents);
    console.log("📊 EventsPage: Number of events:", allEvents?.length);
    
    if (allEvents && allEvents.length > 0) {
      console.log("✅ EventsPage: First event:", allEvents[0]);
      console.log("✅ EventsPage: First event images:", allEvents[0]?.images);
    }
  }, [allEvents, isLoading]);

  // SAME EXACT METHOD AS AllEvents.jsx
  const getImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/400x300?text=No+Image";
    }
    
    if (image.startsWith("http")) {
      return image;
    }
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    return `${backendUrl}/uploads/${image}`;
  };

  // Process events EXACTLY LIKE AllEvents.jsx does
  const processedEvents = [];
  
  allEvents && // Use allEvents instead of events
    allEvents.forEach((item) => {
      // Get the first image for display - SAME LOGIC AS AllEvents.jsx
      const firstImage = item.images && item.images.length > 0 
        ? getImageUrl(item.images[0]) 
        : "https://via.placeholder.com/400x300?text=No+Image";
      
      // Create event object - SAME STRUCTURE AS AllEvents.jsx
      const eventData = {
        _id: item._id,
        id: item._id,
        name: item.name || "Unnamed Event",
        discountPrice: item.discountPrice || item.originalPrice || 0,
        originalPrice: item.originalPrice || item.discountPrice || 0,
        stock: item.stock || 0,
        sold_out: item.sold_out || 0,
        images: [firstImage], // Single image array like in AllEvents.jsx
        startDate: item.startDate || new Date().toISOString(),
        endDate: item.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: item.description || "No description available",
        shop: item.shop || {} // Include shop info if available
      };
      
      processedEvents.push(eventData);
    });

  return (
    <div>
      <Header activeHeading={4} />
      
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                All Events ({processedEvents.length})
              </h1>
              <p className="text-gray-600 text-lg">
                Browse and shop from events created by all sellers
              </p>
            </div>
            
            {/* Events Grid */}
            {processedEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {processedEvents.map((event, index) => {
                  console.log(`🎯 EventsPage: Displaying event ${index}:`, event.name);
                  
                  return (
                    <EventCard 
                      key={event._id || `event-${index}`} 
                      active={true} 
                      data={event} 
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                  No Events Found
                </h3>
                <p className="text-gray-500 mb-6">
                  There are no events available at the moment. Check back later!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;