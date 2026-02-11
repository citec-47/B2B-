import React, { useEffect, useState } from "react";

const CountDown = ({ data }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  function calculateTimeLeft() {
    // Use event's endDate or startDate + 3 days as fallback
    let eventEndDate;
    
    if (data.endDate) {
      eventEndDate = new Date(data.endDate);
    } else if (data.startDate) {
      eventEndDate = new Date(new Date(data.startDate).getTime() + 3 * 24 * 60 * 60 * 1000);
    } else {
      // Fallback: current time + 3 days
      eventEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    const difference = eventEndDate - Date.now();
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
  }

  const timerComponents = [];

  if (timeLeft.days > 0) {
    timerComponents.push(
      <span key="days" className="text-[20px] text-[#475ad2] font-bold">
        {timeLeft.days}d{" "}
      </span>
    );
  }

  if (timeLeft.hours > 0) {
    timerComponents.push(
      <span key="hours" className="text-[20px] text-[#475ad2] font-bold">
        {timeLeft.hours}h{" "}
      </span>
    );
  }

  if (timeLeft.minutes > 0) {
    timerComponents.push(
      <span key="minutes" className="text-[20px] text-[#475ad2] font-bold">
        {timeLeft.minutes}m{" "}
      </span>
    );
  }

  if (timeLeft.seconds >= 0) {
    timerComponents.push(
      <span key="seconds" className="text-[20px] text-[#475ad2] font-bold">
        {timeLeft.seconds}s
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-600 mr-2">Ends in:</span>
      {timerComponents.length > 0 ? (
        <div className="flex space-x-1">
          {timerComponents}
        </div>
      ) : (
        <span className="text-red-600 font-bold">Time's Up!</span>
      )}
    </div>
  );
};

export default CountDown;