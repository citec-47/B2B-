import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  AiOutlineArrowRight, 
  AiOutlineSend, 
  AiOutlineMessage, 
  AiOutlineShopping,
  AiOutlineShop,
  AiOutlineClose,
  AiOutlineExpand,
  AiOutlineDownload,
  AiOutlineArrowLeft
} from "react-icons/ai";
import { TfiGallery } from "react-icons/tfi";
import { IoMdClose } from "react-icons/io";
import { FaUser, FaImages } from "react-icons/fa";
import { format } from "timeago.js";
import { toast } from "react-toastify";
import axios from "axios";
import { useSelector } from "react-redux";
import { server } from "../../server";

const DashboardMessages = () => {
  const { seller } = useSelector((state) => state.seller);
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [images, setImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const scrollRef = useRef(null);
  
  // ==================== HELPER FUNCTIONS ====================
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
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
              unreadCount: senderId !== seller._id 
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
  
  const calculateTotalUnread = () => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    setTotalUnread(total);
    return total;
  };
  
  const handleImageClick = (imageUrl, messageIndex, imageIndex) => {
    setSelectedImage({
      url: imageUrl,
      messageIndex,
      imageIndex,
      allImages: getAllImagesFromMessages()
    });
    setShowImageModal(true);
  };
  
  const getAllImagesFromMessages = () => {
    const allImages = [];
    messages.forEach((message, msgIndex) => {
      if (message.images && message.images.length > 0) {
        message.images.forEach((img, imgIndex) => {
          allImages.push({
            url: img,
            messageIndex: msgIndex,
            imageIndex: imgIndex,
            sender: message.sender,
            timestamp: message.createdAt
          });
        });
      }
    });
    return allImages;
  };
  
  const downloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `message-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };
  
  // ==================== API FUNCTIONS ====================
  const fetchConversations = async () => {
    if (!seller?._id) return;
    
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${server}/conversation/get-all-conversation-seller/${seller._id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const convs = response.data.conversations || [];
        setConversations(convs);
        calculateTotalUnread();
        
        if (convs.length > 0 && !currentChat) {
          const unreadConv = convs.find(conv => conv.unreadCount > 0);
          if (unreadConv) {
            setCurrentChat(unreadConv);
            fetchMessages(unreadConv._id, true);
          } else {
            setCurrentChat(convs[0]);
            fetchMessages(convs[0]._id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error.message);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        `${server}/message/get-unread-count/${seller._id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setTotalUnread(response.data.totalUnread || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
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
        
        const conversation = conversations.find(c => c._id === conversationId);
        if (conversation && conversation.userId) {
          await fetchUserData(conversation.userId);
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
        { userId: seller._id },
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
  
  const fetchUserData = async (userId) => {
    try {
      const response = await axios.get(
        `${server}/user/user-info/${userId}`,
        { withCredentials: true }
      );
      
      if (response.data.user) {
        setUserData(response.data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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
    
    try {
      let formData = new FormData();
      formData.append("conversationId", currentChat._id);
      formData.append("sender", seller._id);
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
            lastMessageId: seller._id,
            senderId: seller._id
          },
          { withCredentials: true }
        );
        
        const newMsg = messageResponse.data.message;
        setMessages(prev => [...prev, newMsg]);
        updateConversationLastMessage(currentChat._id, newMessage, seller._id);
        
        setNewMessage("");
        setImages([]);
        scrollToBottom();
        toast.success("Message sent successfully!");
      }
      
    } catch (error) {
      console.error("Send message error:", error.response?.data || error.message);
      toast.error("Failed to send message");
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check file sizes (max 5MB per image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Limit to 10 images
    const filesToAdd = validFiles.slice(0, 10);
    if (filesToAdd.length < validFiles.length) {
      toast.warning("Maximum 10 images allowed. Only the first 10 have been added.");
    }
    
    setImages(prev => [...prev, ...filesToAdd]);
    
    if (filesToAdd.length > 0) {
      toast.success(`${filesToAdd.length} image${filesToAdd.length > 1 ? 's' : ''} attached successfully!`);
    }
  };
  
  const selectConversation = async (conversation) => {
    setCurrentChat(conversation);
    setOpen(true);
    
    await fetchMessages(conversation._id, true);
    
    if (conversation.userId) {
      await fetchUserData(conversation.userId);
    }
    
    if (conversation.unreadCount > 0) {
      await markConversationAsRead(conversation._id);
    }
  };
  
  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    if (seller?._id) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [seller]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (seller?._id) {
        fetchConversations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [seller]);
  
  // Close image modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
        setSelectedImage(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageModal]);
  
  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      {/* Enhanced Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all transform hover:rotate-90 duration-300"
              title="Close (ESC)"
            >
              <AiOutlineClose size={24} />
            </button>
            
            {/* Download Button */}
            <button
              onClick={() => downloadImage(selectedImage.url)}
              className="absolute top-4 right-20 z-10 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all"
              title="Download image"
            >
              <AiOutlineDownload size={24} />
            </button>
            
            {/* Main Image Container */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <div className="relative w-full h-[70vh] flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt="Full size"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl bg-gray-900"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Image+Not+Found';
                  }}
                />
                
                {/* Loading Indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              </div>
            </div>
            
            {/* Navigation Controls */}
            {selectedImage.allImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={() => {
                    const currentIndex = selectedImage.allImages.findIndex(
                      img => img.messageIndex === selectedImage.messageIndex && 
                            img.imageIndex === selectedImage.imageIndex
                    );
                    if (currentIndex > 0) {
                      const prevImg = selectedImage.allImages[currentIndex - 1];
                      setSelectedImage({
                        url: prevImg.url,
                        messageIndex: prevImg.messageIndex,
                        imageIndex: prevImg.imageIndex,
                        allImages: selectedImage.allImages
                      });
                    }
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 px-6 py-3 rounded-full font-medium shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedImage.allImages.findIndex(
                    img => img.messageIndex === selectedImage.messageIndex && 
                          img.imageIndex === selectedImage.imageIndex
                  ) === 0}
                >
                  <AiOutlineArrowLeft className="inline mr-2" size={20} />
                  Previous
                </button>
                
                {/* Next Button */}
                <button
                  onClick={() => {
                    const currentIndex = selectedImage.allImages.findIndex(
                      img => img.messageIndex === selectedImage.messageIndex && 
                            img.imageIndex === selectedImage.imageIndex
                    );
                    if (currentIndex < selectedImage.allImages.length - 1) {
                      const nextImg = selectedImage.allImages[currentIndex + 1];
                      setSelectedImage({
                        url: nextImg.url,
                        messageIndex: nextImg.messageIndex,
                        imageIndex: nextImg.imageIndex,
                        allImages: selectedImage.allImages
                      });
                    }
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 px-6 py-3 rounded-full font-medium shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedImage.allImages.findIndex(
                    img => img.messageIndex === selectedImage.messageIndex && 
                          img.imageIndex === selectedImage.imageIndex
                  ) === selectedImage.allImages.length - 1}
                >
                  Next
                  <AiOutlineArrowRight className="inline ml-2" size={20} />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full backdrop-blur-sm">
                  <span className="font-medium">
                    {selectedImage.allImages.findIndex(
                      img => img.messageIndex === selectedImage.messageIndex && 
                            img.imageIndex === selectedImage.imageIndex
                    ) + 1} / {selectedImage.allImages.length}
                  </span>
                </div>
              </>
            )}
            
            {/* Thumbnail Strip (for multiple images) */}
            {selectedImage.allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
                <div className="flex space-x-2 overflow-x-auto justify-center py-2 px-4">
                  {selectedImage.allImages.map((img, index) => {
                    const isActive = img.messageIndex === selectedImage.messageIndex && 
                                     img.imageIndex === selectedImage.imageIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImage({
                          url: img.url,
                          messageIndex: img.messageIndex,
                          imageIndex: img.imageIndex,
                          allImages: selectedImage.allImages
                        })}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${isActive ? 'border-blue-500 scale-110' : 'border-gray-600 hover:border-blue-400'}`}
                      >
                        <img
                          src={img.url}
                          alt={`thumb-${index}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!open ? (
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header with Unread Count */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AiOutlineMessage className="text-white mr-3" size={30} />
                  <h1 className="text-2xl font-bold text-white">Seller Messages</h1>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 px-4 py-2 rounded-full">
                    <span className="text-white font-medium">
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {totalUnread > 0 && (
                    <div className="bg-red-500 px-4 py-2 rounded-full animate-pulse">
                      <span className="text-white font-bold">
                        {totalUnread} unread
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
                    <AiOutlineMessage className="text-purple-400" size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No Conversations Yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    When customers message you, conversations will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => selectConversation(conversation)}
                      className={`w-full text-left p-4 bg-white border rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer ${
                        conversation.unreadCount > 0
                          ? 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {/* User Avatar with Unread Badge */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center shadow">
                            {conversation.userInfo?.avatar ? (
                              <img
                                src={conversation.userInfo.avatar}
                                alt={conversation.userInfo?.name || "User"}
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <FaUser className="text-blue-600 text-lg" />
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        {/* Conversation Info */}
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-800 truncate">
                              {conversation.userInfo?.name || "Customer"}
                              {conversation.unreadCount > 0 && (
                                <span className="ml-2 text-sm text-red-600 font-medium">
                                  ({conversation.unreadCount} new)
                                </span>
                              )}
                            </h3>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {conversation.lastMessageTime || conversation.updatedAt 
                                ? format(new Date(conversation.lastMessageTime || conversation.updatedAt))
                                : ""
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center mt-1">
                            {conversation.lastMessageId === seller._id ? (
                              <span className="text-sm font-medium text-blue-600">You: </span>
                            ) : (
                              <span className="text-sm text-gray-600 truncate">
                                {conversation.userInfo?.name?.split(" ")[0] || "Customer"}: 
                              </span>
                            )}
                            <span className="text-sm text-gray-500 ml-1 truncate">
                              {conversation.lastMessage || "Start conversation"}
                            </span>
                          </div>
                          
                          {/* Product info if available */}
                          {conversation.productName && (
                            <div className="flex items-center mt-2">
                              <AiOutlineShopping className="text-gray-400 mr-1" size={14} />
                              <span className="text-xs text-gray-500 truncate">
                                Regarding: {conversation.productName}
                              </span>
                            </div>
                          )}
                          
                          {/* Image preview if last message had images */}
                          {conversation.lastMessage?.includes('📷') && (
                            <div className="flex items-center mt-2">
                              <FaImages className="text-green-500 mr-2" size={12} />
                              <span className="text-xs text-green-600 font-medium">
                                Contains images
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto h-[80vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center">
              <button
                onClick={() => setOpen(false)}
                className="mr-4 p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110"
                title="Back to conversations"
              >
                <AiOutlineArrowLeft size={20} />
              </button>
              
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {userData?.avatar ? (
                    <img
                      src={userData.avatar}
                      alt={userData?.name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-white text-lg" />
                  )}
                </div>
                {currentChat?.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {currentChat.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="ml-4">
                <h2 className="font-bold text-lg">{userData?.name || "Customer"}</h2>
                <p className="text-sm text-white/80">
                  Customer
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentChat?.productName && (
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">
                    {currentChat.productName}
                  </span>
                </div>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110"
                title="Close chat"
              >
                <IoMdClose size={24} />
              </button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
            {messagesLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 mt-4">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center mb-6">
                  <AiOutlineMessage className="text-purple-400" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Messages Yet</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Start the conversation with your customer. Send your first message!
                </p>
                {currentChat?.productName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 font-medium">
                      Regarding: {currentChat.productName}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, messageIndex) => {
                  const isSellerMessage = message.sender === seller._id;
                  const hasImages = message.images && message.images.length > 0;
                  
                  return (
                    <div
                      key={message._id || `msg-${messageIndex}`}
                      className={`flex ${isSellerMessage ? "justify-end" : "justify-start"}`}
                    >
                      {/* User Avatar - Only show for user messages on left */}
                      {!isSellerMessage && (
                        <div className="flex items-end order-1 mr-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow">
                            <FaUser className="text-white text-xs" />
                          </div>
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        isSellerMessage
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-br-none shadow-lg order-1"
                          : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 rounded-bl-none shadow order-2"
                      }`}>
                        {/* Enhanced Message Images Display */}
                        {hasImages && (
                          <div className={`mb-3 ${message.images.length === 1 ? 'single-image' : 'multi-image-grid'}`}>
                            <div className={`grid gap-2 ${
                              message.images.length === 1 ? 'grid-cols-1' : 
                              message.images.length === 2 ? 'grid-cols-2' : 
                              'grid-cols-3'
                            }`}>
                              {message.images.map((image, imageIndex) => (
                                <div 
                                  key={imageIndex} 
                                  className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
                                  onClick={() => handleImageClick(image, messageIndex, imageIndex)}
                                >
                                  {/* Image with loading state */}
                                  <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
                                    <img
                                      src={image}
                                      alt={`attachment-${imageIndex}`}
                                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                      onLoad={(e) => e.target.parentElement.classList.remove('animate-pulse')}
                                      onError={(e) => {
                                        e.target.parentElement.classList.remove('animate-pulse');
                                        e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Failed to load</div>';
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Hover Overlay with Expand Icon */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 scale-95">
                                      <AiOutlineExpand className="text-white" size={28} />
                                    </div>
                                  </div>
                                  
                                  {/* Image Count Badge */}
                                  {message.images.length > 1 && (
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                      {imageIndex + 1}/{message.images.length}
                                    </div>
                                  )}
                                  
                                  {/* View Fullscreen Hint */}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white text-xs text-center font-medium">
                                      Click to view full size
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Images Summary */}
                            <div className="flex items-center justify-between mt-2 px-1">
                              <div className="flex items-center text-sm">
                                <FaImages className={`mr-2 ${isSellerMessage ? 'text-amber-500' : 'text-gray-500'}`} />
                                <span className={isSellerMessage ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                                  {message.images.length} photo{message.images.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(message.images[0], messageIndex, 0);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center"
                              >
                                View all
                                <AiOutlineArrowRight className="ml-1" size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Message Text */}
                        {message.text && (
                          <div className="mb-2">
                            <p className="text-base whitespace-pre-wrap">{message.text}</p>
                          </div>
                        )}
                        
                        {/* Message Time & Sender */}
                        <div className={`flex items-center justify-between mt-2 ${
                          isSellerMessage ? 'text-amber-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {isSellerMessage ? 'You (Seller)' : userData?.name || 'Customer'}
                          </span>
                          <span className="text-xs ml-2">
                            {message.createdAt ? format(new Date(message.createdAt)) : "Just now"}
                          </span>
                        </div>
                      </div>

                      {/* Seller Avatar - Only show for seller messages on right */}
                      {isSellerMessage && (
                        <div className="flex items-end order-2 ml-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center shadow">
                            <AiOutlineShop className="text-white text-xs" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </div>
          
          {/* Enhanced Image Previews */}
          {images.length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FaImages className="text-blue-600 mr-2" />
                  <span className="text-sm font-semibold text-gray-800">
                    {images.length} image{images.length > 1 ? 's' : ''} attached
                  </span>
                  <span className="ml-3 text-xs text-gray-500">
                    Click on image to remove
                  </span>
                </div>
                <button
                  onClick={() => setImages([])}
                  className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-full font-medium transition-all hover:scale-105"
                >
                  Clear all
                </button>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-3 px-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-blue-300 shadow-md group-hover:shadow-lg transition-all duration-300">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`preview-${index}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                      />
                      
                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newImages = [...images];
                          newImages.splice(index, 1);
                          setImages(newImages);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-all hover:scale-110 border-2 border-white"
                      >
                        ×
                      </button>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                          Click to remove
                        </span>
                      </div>
                    </div>
                    
                    {/* Image Size Info */}
                    <div className="text-xs text-gray-500 text-center mt-1 truncate">
                      {Math.round(image.size / 1024)} KB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t bg-white shadow-inner">
            <div className="flex items-center">
              {/* Image Upload */}
              <div className="relative">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-all mr-2 shadow hover:shadow-md hover:bg-blue-50 hover:border-blue-300 border border-gray-300"
                  title="Attach images (max 5MB each)"
                >
                  <TfiGallery size={20} className="text-gray-600" />
                </label>
                {images.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {images.length}
                  </span>
                )}
              </div>
              
              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  className="w-full p-4 border-2 border-gray-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base pr-20 transition-all"
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newMessage.trim() && images.length === 0}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  <AiOutlineSend size={20} />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Press <span className="font-bold">Enter</span> to send • <span className="font-bold">Shift+Enter</span> for new line
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardMessages;