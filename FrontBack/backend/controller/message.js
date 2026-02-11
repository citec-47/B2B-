const Messages = require("../model/messages");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { upload } = require("../multer");
const router = express.Router();
const path = require("path");

// create new message - NO AUTHENTICATION REQUIRED
router.post(
  "/create-new-message",
  upload.single("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messageData = req.body;
      console.log("Creating new message:", messageData);

      if (req.file) {
        const filename = req.file.filename;
        const fileUrl = path.join(filename);
        messageData.images = fileUrl;
      }

      messageData.conversationId = req.body.conversationId;
      messageData.sender = req.body.sender;
      messageData.text = req.body.text;

      const message = new Messages({
        conversationId: messageData.conversationId,
        text: messageData.text,
        sender: messageData.sender,
        images: messageData.images ? messageData.images : undefined,
      });

      await message.save();

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all messages with conversation id - NO AUTHENTICATION REQUIRED
router.get(
  "/get-all-messages/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messages = await Messages.find({
        conversationId: req.params.id,
      }).sort({ createdAt: 1 });

      res.status(201).json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// mark messages as read
router.put(
  "/mark-as-read/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversationId = req.params.id;
      
      await Messages.updateMany(
        { conversationId: conversationId },
        { $set: { isRead: true } }
      );

      res.status(200).json({
        success: true,
        message: "Messages marked as read"
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router; 