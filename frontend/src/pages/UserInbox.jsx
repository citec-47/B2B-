import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AiOutlineMessage, 
  AiOutlineSend, 
  AiOutlinePicture,
  AiOutlineShop
} from "react-icons/ai";
import { BiMessageAlt } from "react-icons/bi";
import { RxCross1 } from "react-icons/rx";
import { FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { format } from "timeago.js";
import axios from "axios";
import { server } from "../server";

const UserInbox = () => {
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [images, setImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // ==================== HELPER FUNCTIONS ====================
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  
  const updateConversationLastMessage = (conversationId, text, senderId) => {
    setConversations(prev => 
      prev.map(conv => 
        conv._id === conversationId 
          ? { 
              ...conv, 
              lastMessage: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
              lastMessageTime: new Date().toISOString(),
              lastMessageId: senderId,
              unreadCount: senderId !== user._id 
                ? (conv.unreadCount || 0) + 1 
                : 0
            }
          : conv
      ).sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageTime || b.createdAt).getTime();
        return timeB - timeA;
      })
    );
    
    calculateTotalUnread();
  };
  
  const formatDate = (dateInput) => {
    if (!dateInput) return "Just now";
    try {
      return format(new Date(dateInput));
    } catch (error) {
      return "Just now";
    }
  };
  
  const calculateTotalUnread = () => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    setTotalUnread(total);
    return total;
  };
  
  // ==================== API FUNCTIONS ====================
  const fetchConversations = async () => {
    if (!user?._id) return [];
    
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${server}/conversation/get-all-conversations/${user._id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const convs = response.data.conversations || [];
        setConversations(convs);
        calculateTotalUnread();
        return convs;
      }
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error.message);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
    return [];
  };
  
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        `${server}/message/get-unread-count/${user._id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setTotalUnread(response.data.totalUnread || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };
  
  const createConversation = async (shopId, shopName, productId, productName) => {
    try {
      const response = await axios.post(
        `${server}/conversation/create-new-conversation`,
        {
          userId: user._id,
          sellerId: shopId,
          shopId: shopId,
          groupTitle: `${shopName} - Chat`,
          productId: productId,
          productName: productName
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success("Chat started!");
        
        const newConv = response.data.conversation;
        setConversations(prev => [newConv, ...prev]);
        setCurrentChat(newConv);
        fetchMessages(newConv._id, true);
        
        return newConv;
      } else {
        toast.error(response.data.message || "Failed to start chat");
      }
    } catch (error) {
      console.error("Create conversation error:", error.response?.data || error.message);
      toast.error("Failed to start chat. Please try again.");
    }
    return null;
  };
  
  const fetchMessages = async (conversationId, markAsRead = true) => {
    if (!conversationId) return;
    
    try {
      setMessagesLoading(true);
      
      const response = await axios.get(
        `${server}/message/get-all-messages/${conversationId}?markAsRead=${markAsRead}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const messagesData = response.data.messages || [];
        setMessages(messagesData);
        
        if (markAsRead && response.data.conversation) {
          setConversations(prev => 
            prev.map(conv => 
              conv._id === conversationId 
                ? { ...conv, unreadCount: response.data.conversation.unreadCount || 0 }
                : conv
            )
          );
          calculateTotalUnread();
        }
        
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };
  
  const markConversationAsRead = async (conversationId) => {
    try {
      await axios.put(
        `${server}/conversation/mark-as-read/${conversationId}`,
        { userId: user._id },
        { withCredentials: true }
      );
      
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      calculateTotalUnread();
      
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && images.length === 0) {
      toast.error("Please type a message or attach an image!");
      return;
    }
    
    if (!currentChat) {
      toast.error("No conversation selected!");
      return;
    }
    
    setSending(true);
    
    try {
      const formData = new FormData();
      formData.append("conversationId", currentChat._id);
      formData.append("sender", user._id);
      formData.append("text", newMessage.trim());
      
      if (images.length > 0) {
        images.forEach((image) => {
          formData.append("images", image);
        });
      }
      
      const messageResponse = await axios.post(
        `${server}/message/create-new-message`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      if (messageResponse.data.success) {
        await axios.put(
          `${server}/conversation/update-last-message/${currentChat._id}`,
          {
            lastMessage: newMessage.trim() || '📷 Image',
            lastMessageId: user._id,
            senderId: user._id
          },
          { withCredentials: true }
        );
        
        const newMsg = messageResponse.data.message;
        setMessages(prev => [...prev, newMsg]);
        updateConversationLastMessage(currentChat._id, newMessage, user._id);
        
        setNewMessage("");
        setImages([]);
        scrollToBottom();
        toast.success("Message sent!");
      }
    } catch (error) {
      console.error("Send message error:", error.response?.data || error.message);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    if (files.length > 0) {
      toast.info(`${files.length} image${files.length > 1 ? 's' : ''} attached`);
    }
  };
  
  const selectConversation = async (conversation) => {
    setCurrentChat(conversation);
    await fetchMessages(conversation._id, true);
    
    if (conversation.unreadCount > 0) {
      await markConversationAsRead(conversation._id);
    }
  };
  
  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      navigate("/login");
      return;
    }
    
    const loadData = async () => {
      await fetchConversations();
      await fetchUnreadCount();
      
      const shouldCreateNew = localStorage.getItem('CREATE_NEW_CONVERSATION');
      const conversationData = localStorage.getItem('NEW_CONVERSATION_DATA');
      
      if (shouldCreateNew === 'true' && conversationData) {
        try {
          const data = JSON.parse(conversationData);
          
          const conversations = await fetchConversations();
          const existingConv = conversations.find(conv => 
            conv.shopId === data.shopId || conv.sellerId === data.shopId
          );
          
          if (existingConv) {
            setCurrentChat(existingConv);
            await fetchMessages(existingConv._id, true);
          } else {
            await createConversation(
              data.shopId, 
              data.shopName,
              data.productId,
              data.productName
            );
          }
          
          localStorage.removeItem('CREATE_NEW_CONVERSATION');
          localStorage.removeItem('NEW_CONVERSATION_DATA');
        } catch (error) {
          console.error("Error creating conversation:", error);
        }
      }
    };
    
    loadData();
    
    if (window.location.pathname === '/inbox') {
      setOpen(true);
    }
    
    const interval = setInterval(() => {
      if (open && user?._id) {
        fetchConversations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user, navigate, open]);
  
  // ==================== HANDLERS ====================
  const handleCloseInbox = () => {
    setOpen(false);
    setCurrentChat(null);
    setMessages([]);
    
    if (window.location.pathname.includes('/inbox')) {
      navigate(-1);
    }
  };
  
  const handleOpenInbox = () => {
    setOpen(true);
    fetchConversations();
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="w-full">
      {/* Floating Message Button with Unread Badge */}
      {!open && (
        <button
          className="fixed w-[50px] h-[50px] bottom-6 right-6 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-full cursor-pointer z-50 shadow-xl hover:shadow-2xl transition-all hover:scale-110"
          onClick={handleOpenInbox}
        >
          <BiMessageAlt className="text-white" size={24} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Inbox Modal */}
      {open && (
        <div className="fixed w-full h-screen top-0 left-0 bg-black/50 z-[9999] flex items-center justify-center p-2">
          <div className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            {/* Header with Unread Count */}
            <div className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center">
                <AiOutlineMessage size={28} className="mr-3 text-white" />
                <h2 className="text-white text-2xl font-bold">
                  Messages
                </h2>
                <span className="ml-4 px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                  {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
                </span>
                {totalUnread > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
                    {totalUnread} unread
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseInbox}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <RxCross1 size={24} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Conversations List */}
              <div className="w-80 border-r overflow-y-auto bg-gray-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Your Chats</h3>
                    <button
                      onClick={fetchConversations}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-3">Loading chats...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                        <AiOutlineMessage className="text-blue-400" size={28} />
                      </div>
                      <p className="text-gray-600 font-medium">No chats yet</p>
                      <p className="text-sm text-gray-400 mt-1">Message a seller to start</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation._id}
                          onClick={() => selectConversation(conversation)}
                          className={`w-full text-left p-3 rounded-xl transition-all relative ${
                            currentChat?._id === conversation._id
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-sm"
                              : "hover:bg-gray-100 border border-transparent hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center shadow">
                                {conversation.sellerInfo?.avatar ? (
                                  <img
                                    src={conversation.sellerInfo.avatar}
                                    alt={conversation.sellerInfo.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <AiOutlineShop className="text-blue-600" size={20} />
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-800 truncate">
                                  {conversation.sellerInfo?.name || "Seller"}
                                </h4>
                                {conversation.productName && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Product
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage || "New chat"}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {formatDate(conversation.lastMessageTime || conversation.updatedAt)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {currentChat ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center shadow mr-3">
                              {currentChat.sellerInfo?.avatar ? (
                                <img
                                  src={currentChat.sellerInfo.avatar}
                                  alt={currentChat.sellerInfo.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <AiOutlineShop className="text-blue-600" size={24} />
                              )}
                            </div>
                            {currentChat.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {currentChat.unreadCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-800">
                              {currentChat.sellerInfo?.name || "Seller"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {currentChat.groupTitle || "Shop Chat"}
                            </p>
                          </div>
                        </div>
                        {currentChat.sellerId && (
                          <button
                            onClick={() => navigate(`/shop/preview/${currentChat.sellerId}`)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-all border border-blue-200"
                          >
                            Visit Shop
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                      {messagesLoading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-500 mt-4">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-6 shadow-lg">
                            <AiOutlineMessage className="text-blue-400" size={48} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            Start a Conversation
                          </h3>
                          <p className="text-gray-500 text-center max-w-md mb-6">
                            Send your first message to {currentChat.sellerInfo?.name || "the seller"}!
                          </p>
                          {currentChat.productName && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <p className="text-blue-800 font-medium">
                                Regarding: {currentChat.productName}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message, index) => {
                            const isUserMessage = message.sender === user._id;
                            
                            return (
                              <div
                                key={message._id || `msg-${index}`}
                                className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                              >
                                {/* Seller Avatar - Only show for seller messages on left */}
                                {!isUserMessage && (
                                  <div className="flex items-end order-1 mr-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center shadow">
                                      <AiOutlineShop className="text-white text-xs" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Message Bubble */}
                                <div className={`max-w-[70%] rounded-2xl p-4 ${
                                  isUserMessage
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg order-1"
                                    : "bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-bl-none shadow-lg order-2"
                                }`}>
                                  {/* Message Images */}
                                  {message.images && message.images.length > 0 && (
                                    <div className="mb-2 space-y-2">
                                      {message.images.map((image, imgIndex) => (
                                        <img
                                          key={imgIndex}
                                          src={image}
                                          alt={`attachment-${imgIndex}`}
                                          className="max-w-full max-h-64 object-cover rounded-lg"
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  {message.text && (
                                    <p className="text-base">{message.text}</p>
                                  )}
                                  
                                  {/* Message Time */}
                                  <div className={`flex items-center justify-between mt-2 ${
                                    isUserMessage ? 'text-blue-200' : 'text-amber-100'
                                  }`}>
                                    <span className="text-xs">
                                      {isUserMessage ? 'You' : currentChat.sellerInfo?.name || 'Seller'}
                                    </span>
                                    <span className="text-xs ml-2">
                                      {formatDate(message.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                {/* User Avatar - Only show for user messages on right */}
                                {isUserMessage && (
                                  <div className="flex items-end order-2 ml-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow">
                                      <FaUser className="text-white text-xs" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Image Previews */}
                    {images.length > 0 && (
                      <div className="px-4 py-2 bg-gray-100 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {images.length} image{images.length > 1 ? 's' : ''} ready
                          </span>
                          <button
                            onClick={() => setImages([])}
                            className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`preview-${index}`}
                                className="w-20 h-20 object-cover rounded-lg border shadow"
                              />
                              <button
                                onClick={() => {
                                  const newImages = [...images];
                                  newImages.splice(index, 1);
                                  setImages(newImages);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white shadow-inner">
                      <form onSubmit={sendMessage} className="flex items-center">
                        <input
                          ref={messageInputRef}
                          type="text"
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 p-4 border-2 border-gray-300 rounded-l-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-base transition-all"
                          disabled={sending || messagesLoading}
                          autoFocus
                        />
                        <input
                          type="file"
                          id="image-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={sending || messagesLoading}
                          multiple
                        />
                        <label
                          htmlFor="image-upload"
                          className="p-4 border-y border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-blue-50 hover:border-blue-300"
                          title="Attach image"
                        >
                          <AiOutlinePicture size={22} className="text-gray-600" />
                        </label>
                        <button
                          type="submit"
                          disabled={sending || (!newMessage.trim() && images.length === 0) || messagesLoading}
                          className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-r-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base transition-all shadow-lg flex items-center justify-center min-w-[80px] hover:shadow-xl"
                        >
                          {sending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <AiOutlineSend size={22} />
                          )}
                        </button>
                      </form>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Press <span className="font-bold">Enter</span> to send • <span className="font-bold">Shift+Enter</span> for new line
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mb-8 shadow-xl">
                      <AiOutlineMessage className="text-blue-400" size={64} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">Your Messages</h3>
                    <p className="text-gray-500 text-center max-w-md mb-8 text-lg">
                      Select a conversation from the list to start chatting
                    </p>
                    <p className="text-gray-400 text-sm">
                      {totalUnread > 0 ? `You have ${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInbox;