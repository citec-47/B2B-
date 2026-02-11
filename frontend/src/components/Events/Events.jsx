// Events.jsx - HomePage component showing ALL events
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "../../styles/styles";
import EventCard from "./EventCard";
import { getAllEvents } from "../../redux/actions/event"; // Use getAllEvents
import Loader from "../Layout/Loader";

const Events = () => {
  const { allEvents, isLoading } = useSelector((state) => state.events); // Use allEvents
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("🚀 Events.jsx: Dispatching getAllEvents");
    dispatch(getAllEvents()); // This gets ALL events
  }, [dispatch]);

  // Debug log
  useEffect(() => {
    console.log("📊 Events.jsx: Redux state - isLoading:", isLoading);
    console.log("📊 Events.jsx: allEvents data:", allEvents);
    console.log("📊 Events.jsx: Number of events:", allEvents?.length);
    
    if (allEvents && allEvents.length > 0) {
      console.log("✅ Events.jsx: First event:", allEvents[0]);
      console.log("✅ Events.jsx: First event name:", allEvents[0]?.name);
      console.log("✅ Events.jsx: First event images:", allEvents[0]?.images);
    } else {
      console.log("❌ Events.jsx: No events found or empty array");
    }
  }, [allEvents, isLoading]);

  // Image function - SAME AS AllEvents.jsx
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

  return (
    <div>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Popular Events {allEvents?.length > 0 ? `(${allEvents.length})` : ''}
            </h1>
            <p className="text-gray-600 mt-2">
              Browse and shop from our exciting events
            </p>
          </div>

          {allEvents && allEvents.length > 0 ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allEvents.slice(0, 8).map((event, index) => { // Show only first 8 events on homepage
                console.log(`🎯 Rendering event ${index}:`, event.name);
                
                // Get the first image
                const firstImage = event.images && event.images.length > 0 
                  ? getImageUrl(event.images[0])
                  : "https://via.placeholder.com/400x300?text=No+Image";
                
                // Prepare event data
                const eventData = {
                  ...event,
                  images: [firstImage], // Pass array with first image
                  startDate: event.startDate || new Date().toISOString(),
                  endDate: event.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                };
                
                return (
                  <EventCard 
                    key={event._id || `event-${index}`} 
                    active={index === 0} 
                    data={eventData} 
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Events Available
              </h3>
              <p className="text-gray-500">
                Check back later for upcoming events
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Events;