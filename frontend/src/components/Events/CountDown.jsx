import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { server } from "../../server";

// Create axios instance with custom error handling
const eventAxios = axios.create();

// Intercept errors for development mode
eventAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't throw errors for mock events in development
    if (process.env.NODE_ENV === 'development') {
      const isMockEvent = error.config?.url?.includes('mock-event');
      const is404 = error.response?.status === 404;
      
      if (isMockEvent && is404) {
        console.warn('Development: Mock event deletion skipped (expected 404)');
        return Promise.resolve({
          data: {
            success: true,
            message: 'Mock event ignored in development mode'
          }
        });
      }
    }
    return Promise.reject(error);
  }
);

const CountDown = ({ data }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const timerRef = useRef(null);
  const hasAttemptedDelete = useRef(false);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Check if timer has expired
    const isExpired = 
      typeof timeLeft.days === "undefined" &&
      typeof timeLeft.hours === "undefined" &&
      typeof timeLeft.minutes === "undefined" &&
      typeof timeLeft.seconds === "undefined";

    // Only delete once and if we have a valid event
    if (isExpired && data?._id && !hasAttemptedDelete.current) {
      hasAttemptedDelete.current = true;
      
      // Check if it's a mock event
      const isMockEvent = data._id.includes('mock-');
      
      if (isMockEvent) {
        console.log(`Development: Mock event "${data._id}" expired - No deletion needed`);
      } else {
        // Only delete real events
        console.log(`Event "${data._id}" expired. Attempting to delete...`);
        
        eventAxios.delete(`${server}/event/delete-shop-event/${data._id}`)
          .then(response => {
            console.log(`Event "${data._id}" deleted:`, response.data.message);
          })
          .catch(error => {
            // Handle errors gracefully
            if (error.response?.status === 404) {
              console.warn(`Event "${data._id}" not found on server (may have been deleted already)`);
            } else if (error.response?.status === 500) {
              console.error(`Server error deleting event "${data._id}"`);
            } else if (error.message === 'Network Error') {
              console.warn(`Network error - could not delete event "${data._id}"`);
            } else {
              console.error(`Error deleting event "${data._id}":`, error.message);
            }
          });
      }
    }

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, data]);

  function calculateTimeLeft() {
    // If no Finish_Date or invalid data, return empty object
    if (!data?.Finish_Date) {
      console.warn('CountDown: No Finish_Date provided for event:', data?._id);
      return {};
    }

    try {
      const finishDate = new Date(data.Finish_Date);
      
      // Check if date is valid
      if (isNaN(finishDate.getTime())) {
        console.error('CountDown: Invalid Finish_Date:', data.Finish_Date);
        return {};
      }

      const difference = finishDate - new Date();
      let timeLeft = {};

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      
      return timeLeft;
    } catch (error) {
      console.error('CountDown: Error calculating time:', error);
      return {};
    }
  }

  const timerComponents = Object.keys(timeLeft).map((interval) => {
    if (!timeLeft[interval] && timeLeft[interval] !== 0) {
      return null;
    }

    return (
      <span key={interval} className="text-[25px] text-[#475ad2]">
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  // Filter out null components
  const validTimerComponents = timerComponents.filter(comp => comp !== null);

  return (
    <div className="countdown-timer">
      {validTimerComponents.length > 0 ? (
        validTimerComponents
      ) : (
        <span className="text-[red] text-[25px]">Time's Up</span>
      )}
    </div>
  );
};

export default CountDown;