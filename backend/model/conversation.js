const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    groupTitle: {
      type: String,
    },
    members: {
      type: Array,
      required: true
    },
    lastMessage: {
      type: String,
      default: ""
    },
    lastMessageId: {
      type: String,
      default: ""
    },
    lastMessageTime: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);