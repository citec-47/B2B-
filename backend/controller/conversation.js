const Conversation = require("../model/conversation");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { isSeller, isAuthenticated } = require("../middleware/auth");
const User = require("../model/user");
const Shop = require("../model/shop");
const router = express.Router();

// create a new conversation
router.post(
  "/create-new-conversation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { groupTitle, userId, sellerId } = req.body;

      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        members: { $all: [userId, sellerId] }
      });

      if (existingConversation) {
        return res.status(200).json({
          success: true,
          conversation: existingConversation,
          message: "Conversation already exists"
        });
      }

      // Get user and shop info
      const user = await User.findById(userId);
      const shop = await Shop.findById(sellerId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      // Create new conversation
      const conversation = await Conversation.create({
        members: [userId, sellerId],
        groupTitle: groupTitle || `${shop.name} - Chat`,
        userId: userId,
        sellerId: sellerId,
        userInfo: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        sellerInfo: {
          _id: shop._id,
          name: shop.name,
          email: shop.email,
          avatar: shop.avatar,
          shopId: shop._id
        }
      });

      res.status(201).json({
        success: true,
        conversation,
        message: "Conversation created successfully"
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get seller conversations
router.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: { $in: [req.params.id] }
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get user conversations  
router.get(
  "/get-all-conversation-user/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: { $in: [req.params.id] }
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update the last message
router.put(
  "/update-last-message/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { lastMessage, lastMessageId } = req.body;

      const conversation = await Conversation.findByIdAndUpdate(
        req.params.id,
        { 
          lastMessage,
          lastMessageId,
          lastMessageTime: new Date()
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        conversation,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;