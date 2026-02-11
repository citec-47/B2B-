import { createReducer } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  isCreating: false,
  isDeleting: false,
  isUpdating: false,
  events: [], // Shop events - for seller dashboard
  allEvents: [], // All events - for public viewing
  event: null, // Single event
  success: false,
  error: null,
  message: null,
  lastUpdated: null,
};

export const eventReducer = createReducer(initialState, {
  // CREATE EVENT
  eventCreateRequest: (state) => {
    console.log("🔄 REDUCER: eventCreateRequest");
    state.isLoading = true;
    state.isCreating = true;
    state.success = false;
    state.error = null;
    state.message = null;
  },
  eventCreateSuccess: (state, action) => {
    console.log("✅ REDUCER: eventCreateSuccess", action.payload);
    state.isLoading = false;
    state.isCreating = false;
    state.event = action.payload;
    state.success = true;
    state.error = null;
    state.message = "Event created successfully!";
    state.lastUpdated = new Date().toISOString();
    
    // Add the new event to the events array
    if (action.payload && (action.payload._id || action.payload.id)) {
      const newEvent = {
        ...action.payload,
        _id: action.payload._id || action.payload.id,
        id: action.payload._id || action.payload.id
      };
      state.events = [newEvent, ...state.events];
      console.log(`📈 Added new event. Total events: ${state.events.length}`);
    }
  },
  eventCreateFail: (state, action) => {
    console.log("❌ REDUCER: eventCreateFail", action.payload);
    state.isLoading = false;
    state.isCreating = false;
    state.error = action.payload;
    state.success = false;
    state.message = null;
  },

  // GET ALL SHOP EVENTS (Seller's own events)
  getAlleventsShopRequest: (state) => {
    console.log("🔄 REDUCER: getAlleventsShopRequest");
    state.isLoading = true;
    state.error = null;
    state.message = null;
  },
  getAlleventsShopSuccess: (state, action) => {
    console.log(`✅ REDUCER: getAlleventsShopSuccess - ${action.payload?.length || 0} events`);
    
    // Ensure payload is an array
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    
    // Normalize event objects to have both _id and id
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id,
      sold_out: event.sold_out || event.sold_out || 0,
      stock: event.stock || 0,
      discountPrice: event.discountPrice || 0,
      originalPrice: event.originalPrice || event.discountPrice || 0
    }));
    
    state.events = normalizedEvents; // Store in events (seller's events)
    state.isLoading = false;
    state.error = null;
    state.message = null;
    state.lastUpdated = new Date().toISOString();
    
    console.log(`📊 Events array updated with ${normalizedEvents.length} shop events`);
    if (normalizedEvents.length > 0) {
      console.log("📝 Sample normalized event:", normalizedEvents[0]);
    }
  },
  getAlleventsShopFailed: (state, action) => {
    console.log("❌ REDUCER: getAlleventsShopFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
    state.events = [];
    state.message = null;
  },

  // GET ALL PUBLIC EVENTS (For everyone)
  getAllEventsRequest: (state) => {
    console.log("🔄 REDUCER: getAllEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  getAllEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: getAllEventsSuccess - ${action.payload?.length || 0} public events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id,
      sold_out: event.sold_out || event.sold_out || 0,
      stock: event.stock || 0,
      discountPrice: event.discountPrice || 0,
      originalPrice: event.originalPrice || event.discountPrice || 0
    }));
    
    state.allEvents = normalizedEvents; // Store in allEvents (public events)
    state.isLoading = false;
    state.error = null;
    state.lastUpdated = new Date().toISOString();
    
    console.log(`🌐 All events array updated with ${normalizedEvents.length} public events`);
  },
  getAllEventsFailed: (state, action) => {
    console.log("❌ REDUCER: getAllEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
    state.allEvents = [];
  },

  // DELETE EVENT
  deleteeventRequest: (state) => {
    console.log("🔄 REDUCER: deleteeventRequest");
    state.isLoading = true;
    state.isDeleting = true;
    state.error = null;
    state.message = null;
  },
  deleteeventSuccess: (state, action) => {
    console.log("✅ REDUCER: deleteeventSuccess", action.payload);
    state.isLoading = false;
    state.isDeleting = false;
    state.message = action.payload;
    state.error = null;
    state.success = true;
    state.lastUpdated = new Date().toISOString();
  },
  deleteeventFailed: (state, action) => {
    console.log("❌ REDUCER: deleteeventFailed", action.payload);
    state.isLoading = false;
    state.isDeleting = false;
    state.error = action.payload;
    state.success = false;
  },

  // UPDATE EVENT
  updateEventRequest: (state) => {
    console.log("🔄 REDUCER: updateEventRequest");
    state.isLoading = true;
    state.isUpdating = true;
    state.error = null;
  },
  updateEventSuccess: (state, action) => {
    console.log("✅ REDUCER: updateEventSuccess", action.payload);
    state.isLoading = false;
    state.isUpdating = false;
    state.event = action.payload;
    state.error = null;
    state.success = true;
    state.message = "Event updated successfully!";
    state.lastUpdated = new Date().toISOString();
    
    // Update the event in the events array
    if (action.payload && (action.payload._id || action.payload.id)) {
      const eventId = action.payload._id || action.payload.id;
      const index = state.events.findIndex(event => 
        event._id === eventId || event.id === eventId
      );
      if (index !== -1) {
        state.events[index] = {
          ...state.events[index],
          ...action.payload,
          _id: eventId,
          id: eventId
        };
      }
    }
  },
  updateEventFailed: (state, action) => {
    console.log("❌ REDUCER: updateEventFailed", action.payload);
    state.isLoading = false;
    state.isUpdating = false;
    state.error = action.payload;
    state.success = false;
  },

  // GET EVENT BY ID
  getEventByIdRequest: (state) => {
    console.log("🔄 REDUCER: getEventByIdRequest");
    state.isLoading = true;
    state.error = null;
  },
  getEventByIdSuccess: (state, action) => {
    console.log("✅ REDUCER: getEventByIdSuccess", action.payload);
    state.isLoading = false;
    state.event = action.payload;
    state.error = null;
  },
  getEventByIdFailed: (state, action) => {
    console.log("❌ REDUCER: getEventByIdFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
    state.event = null;
  },

  // CLEAR ERRORS
  clearErrors: (state) => {
    console.log("🧹 REDUCER: clearErrors");
    state.error = null;
    state.message = null;
    state.success = false;
  },

  // RESET EVENT STATE
  resetEventState: (state) => {
    console.log("🔄 REDUCER: resetEventState");
    return {
      ...initialState,
    };
  },

  // ----- ADDITIONAL ACTIONS FOR COMPATIBILITY -----
  
  // For backward compatibility - maps to getAllEventsRequest
  getAlleventsRequest: (state) => {
    console.log("🔄 REDUCER: getAlleventsRequest (legacy)");
    state.isLoading = true;
    state.error = null;
  },
  
  // For backward compatibility - maps to getAllEventsSuccess
  getAlleventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: getAlleventsSuccess (legacy) - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.allEvents = normalizedEvents;
    state.isLoading = false;
    state.error = null;
    state.lastUpdated = new Date().toISOString();
  },
  
  // For backward compatibility - maps to getAllEventsFailed
  getAlleventsFailed: (state, action) => {
    console.log("❌ REDUCER: getAlleventsFailed (legacy)", action.payload);
    state.isLoading = false;
    state.error = action.payload;
    state.allEvents = [];
  },

  // GET ADMIN ALL EVENTS - Uses same as getAllEvents
  getAdminAllEventsRequest: (state) => {
    console.log("🔄 REDUCER: getAdminAllEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  getAdminAllEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: getAdminAllEventsSuccess - ${action.payload?.length || 0} admin events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.allEvents = normalizedEvents;
    state.isLoading = false;
    state.error = null;
    state.lastUpdated = new Date().toISOString();
  },
  getAdminAllEventsFailed: (state, action) => {
    console.log("❌ REDUCER: getAdminAllEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
    state.allEvents = [];
  },

  // GET EVENT STATISTICS
  getEventStatisticsRequest: (state) => {
    console.log("🔄 REDUCER: getEventStatisticsRequest");
    state.isLoading = true;
    state.error = null;
  },
  getEventStatisticsSuccess: (state, action) => {
    console.log("✅ REDUCER: getEventStatisticsSuccess", action.payload);
    state.isLoading = false;
    state.error = null;
  },
  getEventStatisticsFailed: (state, action) => {
    console.log("❌ REDUCER: getEventStatisticsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },

  // BULK DELETE EVENTS
  bulkDeleteEventsRequest: (state) => {
    console.log("🔄 REDUCER: bulkDeleteEventsRequest");
    state.isLoading = true;
    state.isDeleting = true;
    state.error = null;
  },
  bulkDeleteEventsSuccess: (state, action) => {
    console.log("✅ REDUCER: bulkDeleteEventsSuccess", action.payload);
    state.isLoading = false;
    state.isDeleting = false;
    state.message = action.payload;
    state.error = null;
    state.success = true;
  },
  bulkDeleteEventsFailed: (state, action) => {
    console.log("❌ REDUCER: bulkDeleteEventsFailed", action.payload);
    state.isLoading = false;
    state.isDeleting = false;
    state.error = action.payload;
    state.success = false;
  },

  // DUPLICATE EVENT
  duplicateEventRequest: (state) => {
    console.log("🔄 REDUCER: duplicateEventRequest");
    state.isLoading = true;
    state.isCreating = true;
    state.error = null;
  },
  duplicateEventSuccess: (state, action) => {
    console.log("✅ REDUCER: duplicateEventSuccess", action.payload);
    state.isLoading = false;
    state.isCreating = false;
    state.event = action.payload;
    state.error = null;
    state.success = true;
  },
  duplicateEventFailed: (state, action) => {
    console.log("❌ REDUCER: duplicateEventFailed", action.payload);
    state.isLoading = false;
    state.isCreating = false;
    state.error = action.payload;
    state.success = false;
  },

  // TOGGLE EVENT STATUS
  toggleEventStatusRequest: (state) => {
    console.log("🔄 REDUCER: toggleEventStatusRequest");
    state.isLoading = true;
    state.isUpdating = true;
    state.error = null;
  },
  toggleEventStatusSuccess: (state, action) => {
    console.log("✅ REDUCER: toggleEventStatusSuccess", action.payload);
    state.isLoading = false;
    state.isUpdating = false;
    state.event = action.payload;
    state.error = null;
    state.success = true;
  },
  toggleEventStatusFailed: (state, action) => {
    console.log("❌ REDUCER: toggleEventStatusFailed", action.payload);
    state.isLoading = false;
    state.isUpdating = false;
    state.error = action.payload;
    state.success = false;
  },

  // SEARCH EVENTS
  searchEventsRequest: (state) => {
    console.log("🔄 REDUCER: searchEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  searchEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: searchEventsSuccess - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.events = normalizedEvents;
    state.isLoading = false;
    state.error = null;
  },
  searchEventsFailed: (state, action) => {
    console.log("❌ REDUCER: searchEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },

  // GET EVENTS BY DATE RANGE
  getEventsByDateRangeRequest: (state) => {
    console.log("🔄 REDUCER: getEventsByDateRangeRequest");
    state.isLoading = true;
    state.error = null;
  },
  getEventsByDateRangeSuccess: (state, action) => {
    console.log(`✅ REDUCER: getEventsByDateRangeSuccess - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.events = normalizedEvents;
    state.isLoading = false;
    state.error = null;
  },
  getEventsByDateRangeFailed: (state, action) => {
    console.log("❌ REDUCER: getEventsByDateRangeFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },

  // GET UPCOMING EVENTS
  getUpcomingEventsRequest: (state) => {
    console.log("🔄 REDUCER: getUpcomingEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  getUpcomingEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: getUpcomingEventsSuccess - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.events = normalizedEvents;
    state.isLoading = false;
    state.error = null;
  },
  getUpcomingEventsFailed: (state, action) => {
    console.log("❌ REDUCER: getUpcomingEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },

  // GET FEATURED EVENTS
  getFeaturedEventsRequest: (state) => {
    console.log("🔄 REDUCER: getFeaturedEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  getFeaturedEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: getFeaturedEventsSuccess - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.allEvents = normalizedEvents;
    state.isLoading = false;
    state.error = null;
  },
  getFeaturedEventsFailed: (state, action) => {
    console.log("❌ REDUCER: getFeaturedEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },

  // SEARCH PUBLIC EVENTS
  searchPublicEventsRequest: (state) => {
    console.log("🔄 REDUCER: searchPublicEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  searchPublicEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: searchPublicEventsSuccess - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.allEvents = normalizedEvents;
    state.isLoading = false;
    state.error = null;
  },
  searchPublicEventsFailed: (state, action) => {
    console.log("❌ REDUCER: searchPublicEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },

  // GET UPCOMING PUBLIC EVENTS
  getUpcomingPublicEventsRequest: (state) => {
    console.log("🔄 REDUCER: getUpcomingPublicEventsRequest");
    state.isLoading = true;
    state.error = null;
  },
  getUpcomingPublicEventsSuccess: (state, action) => {
    console.log(`✅ REDUCER: getUpcomingPublicEventsSuccess - ${action.payload?.length || 0} events`);
    
    const eventsArray = Array.isArray(action.payload) ? action.payload : [];
    const normalizedEvents = eventsArray.map(event => ({
      ...event,
      _id: event._id || event.id,
      id: event._id || event.id
    }));
    
    state.allEvents = normalizedEvents;
    state.isLoading = false;
    state.error = null;
  },
  getUpcomingPublicEventsFailed: (state, action) => {
    console.log("❌ REDUCER: getUpcomingPublicEventsFailed", action.payload);
    state.isLoading = false;
    state.error = action.payload;
  },
});