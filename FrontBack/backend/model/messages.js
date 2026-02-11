const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: ""
    },
    sender: {
      type: String,
      required: true
    },
    images: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Messages", messagesSchema);