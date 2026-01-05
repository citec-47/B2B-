const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "rejected"],
    default: "pending",
  },
  withdrawMethod: {
    type: {
      type: String,
      enum: ["bank", "binance"],
      required: true,
    },
    // Bank transfer details
    bankName: String,
    bankCountry: String,
    bankSwiftCode: String,
    bankAccountNumber: String,
    bankHolderName: String,
    bankAddress: String,
    // Binance details
    binanceWalletAddress: String,
  },
  adminNote: {
    type: String,
    default: "",
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
withdrawSchema.index({ seller: 1, createdAt: -1 });
withdrawSchema.index({ status: 1 });
withdrawSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Withdraw", withdrawSchema);