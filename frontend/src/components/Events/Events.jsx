import React from "react";
import { useSelector } from "react-redux";
import styles from "../../styles/styles";
import EventCard from "./EventCard";

const Events = () => {
  const { allEvents, isLoading } = useSelector((state) => state.events);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h1>Popular Events</h1>
        </div>
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  // Safely get events array (default to empty array)
  const events = Array.isArray(allEvents) ? allEvents : [];

  // Show no events message
  if (events.length === 0) {
    return (
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h1>Popular Events</h1>
        </div>
        <div className="text-center py-10">
          <div className="text-gray-400 mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mx-auto" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h4 className="text-lg text-gray-600">No events available</h4>
          <p className="text-gray-500 mt-2">Check back later for upcoming events.</p>
        </div>
      </div>
    );
  }

  // Show events
  return (
    <div className={`${styles.section}`}>
      <div className={`${styles.heading}`}>
        <h1>Popular Events</h1>
        {events.length > 0 && (
          <p className="text-gray-600 mt-1">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event, index) => (
          <EventCard 
            key={event._id || event.id || `event-${index}`} 
            data={event} 
          />
        ))}
      </div>

      {/* Optional: Show only first event as in original code */}
      {/* 
      <div className="w-full grid">
        <EventCard data={events[0]} />
      </div>
      */}
    </div>
  );
};

export default Events;