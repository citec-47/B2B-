import axios from "axios";
import { server } from "../../server";

// CREATE EVENT
export const createevent = (newForm) => async (dispatch) => {
  try {
    console.log("🎉 EVENT CREATE ACTION STARTED");
    
    dispatch({
      type: "eventCreateRequest",
    });

    const token = localStorage.getItem("seller_token") || localStorage.getItem("token");
    const config = { 
      headers: { 
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 Sending request to:", `${server}/event/create-event`);
    
    const response = await axios.post(
      `${server}/event/create-event`,
      newForm,
      config
    );
    
    console.log("✅ Event creation response:", response.data);
    
    if (response.data.success) {
      dispatch({
        type: "eventCreateSuccess",
        payload: response.data.event,
      });
    } else {
      throw new Error(response.data.message || "Event creation failed");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Event creation error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to create event. Please try again.";
    
    dispatch({
      type: "eventCreateFail",
      payload: errorMessage,
    });
    
    throw error;
  }
};

// GET ALL EVENTS OF A SHOP
export const getAllEventsShop = (id) => async (dispatch) => {
  try {
    console.log(`🛍️ FETCHING EVENTS FOR SHOP: ${id}`);
    
    if (!id) {
      console.error("❌ No shop ID provided");
      dispatch({
        type: "getAlleventsShopFailed",
        payload: "No shop ID provided",
      });
      return;
    }
    
    dispatch({
      type: "getAlleventsShopRequest",
    });

    const response = await axios.get(`${server}/event/get-shop-events/${id}`);
    
    console.log("📊 Events API Response:", response.data);
    
    if (response.data.success) {
      let eventsArray = [];
      
      if (Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data.event && Array.isArray(response.data.event)) {
        eventsArray = response.data.event;
      } else if (response.data.events && !Array.isArray(response.data.events)) {
        eventsArray = Object.values(response.data.events);
      }
      
      console.log(`✅ Found ${eventsArray.length} events`);
      
      dispatch({
        type: "getAlleventsShopSuccess",
        payload: eventsArray,
      });
      
      return eventsArray;
    } else {
      throw new Error(response.data.message || "Failed to fetch events");
    }
  } catch (error) {
    console.error("❌ Error fetching events:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to fetch events. Please try again.";
    
    dispatch({
      type: "getAlleventsShopFailed",
      payload: errorMessage,
    });
    
    return [];
  }
};

// DELETE EVENT OF A SHOP
export const deleteEvent = (id) => async (dispatch) => {
  try {
    console.log(`🗑️ DELETE EVENT ACTION: ${id}`);
    
    if (!id) {
      throw new Error("Event ID is required");
    }
    
    dispatch({
      type: "deleteeventRequest",
    });

    const token = localStorage.getItem("seller_token") || localStorage.getItem("token");
    const config = {
      withCredentials: true,
    };

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await axios.delete(
      `${server}/event/delete-shop-event/${id}`,
      config
    );

    console.log("✅ Delete event response:", response.data);

    if (response.data.success) {
      dispatch({
        type: "deleteeventSuccess",
        payload: response.data.message || "Event deleted successfully",
      });
    } else {
      throw new Error(response.data.message || "Failed to delete event");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Delete event error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to delete event. Please try again.";
    
    dispatch({
      type: "deleteeventFailed",
      payload: errorMessage,
    });
    
    throw error;
  }
};

// GET ALL EVENTS (for admin/public)
export const getAllEvents = () => async (dispatch) => {
  try {
    console.log("🌐 FETCHING ALL EVENTS");
    
    dispatch({
      type: "getAlleventsRequest",
    });

    const response = await axios.get(`${server}/event/get-all-events`);
    
    console.log("📊 All events response:", response.data);
    
    if (response.data.success) {
      let eventsArray = [];
      
      if (Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data.events && !Array.isArray(response.data.events)) {
        eventsArray = Object.values(response.data.events);
      }
      
      console.log(`✅ Loaded ${eventsArray.length} events total`);
      
      dispatch({
        type: "getAlleventsSuccess",
        payload: eventsArray,
      });
      
      return eventsArray;
    } else {
      throw new Error(response.data.message || "Failed to fetch all events");
    }
  } catch (error) {
    console.error("❌ Get all events error:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to fetch events. Please try again.";
    
    dispatch({
      type: "getAlleventsFailed",
      payload: errorMessage,
    });
    
    return [];
  }
};

// GET SINGLE EVENT BY ID
export const getEventById = (id) => async (dispatch) => {
  try {
    console.log(`🔍 FETCHING EVENT BY ID: ${id}`);
    
    dispatch({
      type: "getEventByIdRequest",
    });

    const response = await axios.get(`${server}/event/get-event/${id}`);
    
    console.log("📊 Event by ID response:", response.data);
    
    if (response.data.success) {
      dispatch({
        type: "getEventByIdSuccess",
        payload: response.data.event,
      });
      
      return response.data.event;
    } else {
      throw new Error(response.data.message || "Event not found");
    }
  } catch (error) {
    console.error("❌ Get event by ID error:", error.message);
    
    dispatch({
      type: "getEventByIdFailed",
      payload: error.response?.data?.message || error.message,
    });
    
    throw error;
  }
};

// UPDATE EVENT
export const updateEvent = (id, eventData) => async (dispatch) => {
  try {
    console.log(`✏️ UPDATE EVENT ACTION: ${id}`);
    
    dispatch({
      type: "updateEventRequest",
    });

    const token = localStorage.getItem("seller_token") || localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.put(
      `${server}/event/update-event/${id}`,
      eventData,
      config
    );

    console.log("✅ Update event response:", response.data);

    if (response.data.success) {
      dispatch({
        type: "updateEventSuccess",
        payload: response.data.event,
      });
    } else {
      throw new Error(response.data.message || "Failed to update event");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Update event error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to update event. Please try again.";
    
    dispatch({
      type: "updateEventFailed",
      payload: errorMessage,
    });
    
    throw error;
  }
};

// GET ADMIN ALL EVENTS
export const getAdminAllEvents = () => async (dispatch) => {
  try {
    console.log("👑 FETCHING ALL EVENTS FOR ADMIN");
    
    dispatch({
      type: "getAlleventsRequest",
    });

    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    const config = {
      headers: {},
      withCredentials: true,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(
      `${server}/event/admin-all-events`,
      config
    );
    
    console.log("📊 Admin events response:", response.data);
    
    if (response.data.success) {
      let eventsArray = [];
      
      if (Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data.events && !Array.isArray(response.data.events)) {
        eventsArray = Object.values(response.data.events);
      }
      
      console.log(`✅ Loaded ${eventsArray.length} events for admin`);
      
      dispatch({
        type: "getAlleventsSuccess",
        payload: eventsArray,
      });
      
      return eventsArray;
    } else {
      throw new Error(response.data.message || "Failed to fetch admin events");
    }
  } catch (error) {
    console.error("❌ Get admin events error:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to fetch admin events. Please try again.";
    
    dispatch({
      type: "getAlleventsFailed",
      payload: errorMessage,
    });
    
    return [];
  }
};

// CLEAR ERRORS
export const clearEventErrors = () => (dispatch) => {
  dispatch({
    type: "clearErrors",
  });
};

// RESET EVENT STATE
export const resetEventState = () => (dispatch) => {
  dispatch({
    type: "resetEventState",
  });
};

// BULK DELETE EVENTS
export const bulkDeleteEvents = (eventIds) => async (dispatch) => {
  try {
    console.log(`🗑️ BULK DELETE EVENTS: ${eventIds.length} events`);
    
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      throw new Error("No events selected for deletion");
    }
    
    dispatch({
      type: "deleteeventRequest",
    });

    const token = localStorage.getItem("seller_token") || localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${server}/event/bulk-delete-events`,
      { eventIds },
      config
    );

    console.log("✅ Bulk delete events response:", response.data);

    if (response.data.success) {
      dispatch({
        type: "deleteeventSuccess",
        payload: response.data.message || "Events deleted successfully",
      });
    } else {
      throw new Error(response.data.message || "Failed to delete events");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Bulk delete events error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to delete events. Please try again.";
    
    dispatch({
      type: "deleteeventFailed",
      payload: errorMessage,
    });
    
    throw error;
  }
};

// GET EVENT STATISTICS
export const getEventStatistics = (shopId) => async (dispatch) => {
  try {
    console.log(`📈 GETTING EVENT STATISTICS FOR SHOP: ${shopId}`);
    
    dispatch({
      type: "getAlleventsShopRequest",
    });

    const response = await axios.get(`${server}/event/get-event-stats/${shopId}`);
    
    console.log("📊 Event statistics response:", response.data);
    
    if (response.data.success) {
      dispatch({
        type: "getAlleventsShopSuccess",
        payload: response.data.events || [],
      });
      
      return response.data.statistics || {};
    } else {
      throw new Error(response.data.message || "Failed to load statistics");
    }
  } catch (error) {
    console.error("❌ Get event statistics error:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to load statistics";
    
    dispatch({
      type: "getAlleventsShopFailed",
      payload: errorMessage,
    });
    
    return {};
  }
};

// DUPLICATE EVENT
export const duplicateEvent = (eventId) => async (dispatch) => {
  try {
    console.log(`🔄 DUPLICATING EVENT: ${eventId}`);
    
    dispatch({
      type: "eventCreateRequest",
    });

    const token = localStorage.getItem("seller_token") || localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${server}/event/duplicate-event/${eventId}`,
      {},
      config
    );

    console.log("✅ Duplicate event response:", response.data);

    if (response.data.success) {
      dispatch({
        type: "eventCreateSuccess",
        payload: response.data.event,
      });
    } else {
      throw new Error(response.data.message || "Failed to duplicate event");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Duplicate event error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to duplicate event. Please try again.";
    
    dispatch({
      type: "eventCreateFail",
      payload: errorMessage,
    });
    
    throw error;
  }
};

// EXPORT EVENTS TO CSV
export const exportEventsToCSV = (shopId) => async () => {
  try {
    console.log(`📊 EXPORTING EVENTS TO CSV FOR SHOP: ${shopId}`);
    
    const response = await axios.get(`${server}/event/export-events/${shopId}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `events_${shopId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    console.log("✅ Events exported successfully");
    return { success: true, message: "Events exported successfully" };
  } catch (error) {
    console.error("❌ Export events error:", error.message);
    throw new Error("Failed to export events");
  }
};

// TOGGLE EVENT STATUS
export const toggleEventStatus = (eventId, status) => async (dispatch) => {
  try {
    console.log(`🔄 TOGGLE EVENT STATUS: ${eventId} to ${status}`);
    
    dispatch({
      type: "updateEventRequest",
    });

    const token = localStorage.getItem("seller_token") || localStorage.getItem("token");
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.patch(
      `${server}/event/toggle-status/${eventId}`,
      { status },
      config
    );

    console.log("✅ Toggle status response:", response.data);

    if (response.data.success) {
      dispatch({
        type: "updateEventSuccess",
        payload: response.data.event,
      });
    } else {
      throw new Error(response.data.message || "Failed to update event status");
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Toggle event status error:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to update event status. Please try again.";
    
    dispatch({
      type: "updateEventFailed",
      payload: errorMessage,
    });
    
    throw error;
  }
};

// GET EVENT ANALYTICS
export const getEventAnalytics = (eventId) => async (dispatch) => {
  try {
    console.log(`📊 GETTING EVENT ANALYTICS: ${eventId}`);
    
    const response = await axios.get(`${server}/event/get-analytics/${eventId}`);
    
    console.log("📈 Event analytics response:", response.data);
    
    if (response.data.success) {
      return response.data.analytics || {};
    } else {
      throw new Error(response.data.message || "Failed to load analytics");
    }
  } catch (error) {
    console.error("❌ Get event analytics error:", error.message);
    throw new Error(error.response?.data?.message || "Failed to load analytics");
  }
};

// SEARCH EVENTS
export const searchEvents = (searchQuery, shopId) => async (dispatch) => {
  try {
    console.log(`🔍 SEARCHING EVENTS: "${searchQuery}" for shop: ${shopId}`);
    
    dispatch({
      type: "getAlleventsShopRequest",
    });

    const response = await axios.get(
      `${server}/event/search-events/${shopId}?query=${encodeURIComponent(searchQuery)}`
    );
    
    console.log("🔍 Search events response:", response.data);
    
    if (response.data.success) {
      let eventsArray = [];
      
      if (Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data.events && !Array.isArray(response.data.events)) {
        eventsArray = Object.values(response.data.events);
      }
      
      console.log(`✅ Found ${eventsArray.length} matching events`);
      
      dispatch({
        type: "getAlleventsShopSuccess",
        payload: eventsArray,
      });
      
      return eventsArray;
    } else {
      throw new Error(response.data.message || "Failed to search events");
    }
  } catch (error) {
    console.error("❌ Search events error:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to search events. Please try again.";
    
    dispatch({
      type: "getAlleventsShopFailed",
      payload: errorMessage,
    });
    
    return [];
  }
};

// GET EVENTS BY DATE RANGE
export const getEventsByDateRange = (shopId, startDate, endDate) => async (dispatch) => {
  try {
    console.log(`📅 GETTING EVENTS BY DATE RANGE: ${startDate} to ${endDate} for shop: ${shopId}`);
    
    dispatch({
      type: "getAlleventsShopRequest",
    });

    const response = await axios.get(
      `${server}/event/get-events-by-date/${shopId}`,
      {
        params: {
          startDate,
          endDate
        }
      }
    );
    
    console.log("📅 Date range events response:", response.data);
    
    if (response.data.success) {
      let eventsArray = [];
      
      if (Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data.events && !Array.isArray(response.data.events)) {
        eventsArray = Object.values(response.data.events);
      }
      
      console.log(`✅ Found ${eventsArray.length} events in date range`);
      
      dispatch({
        type: "getAlleventsShopSuccess",
        payload: eventsArray,
      });
      
      return eventsArray;
    } else {
      throw new Error(response.data.message || "Failed to fetch events by date range");
    }
  } catch (error) {
    console.error("❌ Get events by date range error:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to fetch events by date range. Please try again.";
    
    dispatch({
      type: "getAlleventsShopFailed",
      payload: errorMessage,
    });
    
    return [];
  }
};

// GET UPCOMING EVENTS
export const getUpcomingEvents = (shopId, limit = 5) => async (dispatch) => {
  try {
    console.log(`🚀 GETTING UPCOMING EVENTS FOR SHOP: ${shopId}`);
    
    dispatch({
      type: "getAlleventsShopRequest",
    });

    const response = await axios.get(
      `${server}/event/get-upcoming-events/${shopId}`,
      {
        params: { limit }
      }
    );
    
    console.log("🚀 Upcoming events response:", response.data);
    
    if (response.data.success) {
      let eventsArray = [];
      
      if (Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data.events && !Array.isArray(response.data.events)) {
        eventsArray = Object.values(response.data.events);
      }
      
      console.log(`✅ Found ${eventsArray.length} upcoming events`);
      
      dispatch({
        type: "getAlleventsShopSuccess",
        payload: eventsArray,
      });
      
      return eventsArray;
    } else {
      throw new Error(response.data.message || "Failed to fetch upcoming events");
    }
  } catch (error) {
    console.error("❌ Get upcoming events error:", error.message);
    
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Failed to fetch upcoming events. Please try again.";
    
    dispatch({
      type: "getAlleventsShopFailed",
      payload: errorMessage,
    });
    
    return [];
  }
};