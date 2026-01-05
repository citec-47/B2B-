import React from "react";
import { useSelector } from "react-redux";
import EventCard from "../components/Events/EventCard";
import Header from "../components/Layout/Header";
import Loader from "../components/Layout/Loader";

const EventsPage = () => {
  const { allEvents, isLoading } = useSelector((state) => state.events);
  
  // Add a default value for allEvents to ensure it's always an array
  const safeAllEvents = Array.isArray(allEvents) ? allEvents : [];
  
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div>
          <Header activeHeading={4} />
          {safeAllEvents.length > 0 ? (
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-center mb-8">All Events</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {safeAllEvents.map((event) => (
                  <EventCard 
                    key={event._id || event.id || `event-${Date.now()}`} 
                    active={true} 
                    data={event} 
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
              <div className="text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-24 w-24 mx-auto text-gray-400 mb-4"
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
                <p className="text-xl text-gray-600">No events available.</p>
                <p className="text-gray-500 mt-2">Check back later for upcoming events.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default EventsPage;