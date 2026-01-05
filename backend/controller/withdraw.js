const express = require("express");
const router = express.Router();

const Shop = require("../model/shop");
const Withdraw = require("../model/withdraw");

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendMail = require("../utils/sendMail");

const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");

/* =========================================================
   CREATE BANK WITHDRAW REQUEST (SELLER) - FIXED
========================================================= */
router.post(
  "/create-withdraw-request",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount } = req.body;

      console.log("💰 Creating bank withdrawal request...");
      console.log("Seller ID:", req.seller._id);
      console.log("Amount:", amount);

      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        console.error("❌ Seller not found:", req.seller._id);
        return next(new ErrorHandler("Seller not found", 404));
      }

      console.log("✅ Seller found:", seller.name, "Balance:", seller.availableBalance);

      // Check if seller has withdrawal method set
      if (!seller.withdrawMethod) {
        console.error("❌ No withdrawal method set for seller:", seller.name);
        return next(new ErrorHandler("Please set up your withdrawal method first", 400));
      }

      console.log("📝 Withdraw method:", seller.withdrawMethod.type);

      if (seller.withdrawMethod.type !== "bank") {
        return next(new ErrorHandler("Invalid withdrawal method. Please use bank transfer", 400));
      }

      if (!amount || amount <= 0) {
        return next(new ErrorHandler("Please enter a valid amount", 400));
      }

      if (amount < 50) {
        return next(new ErrorHandler("Minimum withdrawal amount is $50", 400));
      }

      if (amount > seller.availableBalance) {
        console.error(`❌ Insufficient balance: ${amount} > ${seller.availableBalance}`);
        return next(new ErrorHandler("Insufficient balance", 400));
      }

      // Create withdraw request
      console.log("🔄 Creating withdrawal document...");
      
      const withdraw = new Withdraw({
        seller: seller._id,
        amount,
        withdrawMethod: seller.withdrawMethod,
        status: "pending",
        adminNote: "",
        processedAt: null
      });

      await withdraw.save();
      console.log("✅ Withdrawal request CREATED AND SAVED:", withdraw._id);

      // Lock balance (move from available to locked)
      seller.availableBalance -= amount;
      
      // 🔥 FIX: Handle missing lockedBalance field
      if (seller.lockedBalance === undefined) {
        seller.lockedBalance = amount;
        console.log("⚠️ Created missing lockedBalance field for seller");
      } else {
        seller.lockedBalance = (seller.lockedBalance || 0) + amount;
      }
      
      // Add to transactions
      seller.transections.push({
        amount: -amount,
        status: "Withdraw Requested (Pending)",
        createdAt: new Date(),
      });

      await seller.save();
      console.log("✅ Seller balance updated.");
      console.log("📊 New balances - Available:", seller.availableBalance, "Locked:", seller.lockedBalance);

      // Notify seller
      await sendMail({
        email: seller.email,
        subject: "Withdraw Request Submitted",
        message: `Hello ${seller.name},\n\nYour withdrawal request of $${amount} has been submitted successfully and is pending admin approval.\n\nWithdrawal Method: Bank Transfer\nAccount: ${seller.withdrawMethod.bankAccountNumber}\n\nWe'll notify you once your request is processed.\n\nBest regards,\nThe Admin Team`,
      });

      // Notify admin if admin email is configured
      if (process.env.ADMIN_EMAIL) {
        await sendMail({
          email: process.env.ADMIN_EMAIL,
          subject: "New Withdrawal Request - Bank Transfer",
          message: `New withdrawal request received:\n\nSeller: ${seller.name} (${seller.email})\nAmount: $${amount}\nMethod: Bank Transfer\nAccount: ${seller.withdrawMethod.bankAccountNumber}\nRequest ID: ${withdraw._id}\n\nPlease review in the admin panel.`,
        });
      }

      console.log("✅ Emails sent successfully");

      res.status(201).json({
        success: true,
        message: "Withdrawal request submitted successfully",
        withdraw,
      });
    } catch (error) {
      console.error("❌ Create withdrawal error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   CREATE BINANCE WITHDRAW REQUEST (SELLER) - FIXED
========================================================= */
router.post(
  "/create-withdraw-request-binance",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount } = req.body;

      console.log("💰 Creating Binance withdrawal request...");
      console.log("Seller ID:", req.seller._id);
      console.log("Amount:", amount);

      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        console.error("❌ Seller not found:", req.seller._id);
        return next(new ErrorHandler("Seller not found", 404));
      }

      console.log("✅ Seller found:", seller.name, "Balance:", seller.availableBalance);

      // Check if seller has binance method set
      if (!seller.withdrawMethod) {
        console.error("❌ No withdrawal method set for seller:", seller.name);
        return next(new ErrorHandler("Please set up your withdrawal method first", 400));
      }

      console.log("📝 Withdraw method:", seller.withdrawMethod.type);

      if (seller.withdrawMethod.type !== "binance") {
        return next(new ErrorHandler("Invalid withdrawal method. Please use Binance", 400));
      }

      if (!amount || amount <= 0) {
        return next(new ErrorHandler("Please enter a valid amount", 400));
      }

      if (amount < 50) {
        return next(new ErrorHandler("Minimum withdrawal amount is $50", 400));
      }

      if (amount > seller.availableBalance) {
        console.error(`❌ Insufficient balance: ${amount} > ${seller.availableBalance}`);
        return next(new ErrorHandler("Insufficient balance", 400));
      }

      // Create withdraw request
      console.log("🔄 Creating Binance withdrawal document...");
      
      const withdraw = new Withdraw({
        seller: seller._id,
        amount,
        withdrawMethod: seller.withdrawMethod,
        status: "pending",
        adminNote: "",
        processedAt: null
      });

      await withdraw.save();
      console.log("✅ Binance withdrawal request CREATED AND SAVED:", withdraw._id);

      // Lock balance (move from available to locked)
      seller.availableBalance -= amount;
      
      // 🔥 FIX: Handle missing lockedBalance field
      if (seller.lockedBalance === undefined) {
        seller.lockedBalance = amount;
        console.log("⚠️ Created missing lockedBalance field for seller");
      } else {
        seller.lockedBalance = (seller.lockedBalance || 0) + amount;
      }
      
      // Add to transactions
      seller.transections.push({
        amount: -amount,
        status: "Withdraw Requested (Pending)",
        createdAt: new Date(),
      });

      await seller.save();
      console.log("✅ Seller balance updated.");
      console.log("📊 New balances - Available:", seller.availableBalance, "Locked:", seller.lockedBalance);

      // Notify seller
      await sendMail({
        email: seller.email,
        subject: "Binance Withdraw Request Submitted",
        message: `Hello ${seller.name},\n\nYour Binance withdrawal request of $${amount} has been submitted successfully and is pending admin approval.\n\nWallet Address: ${seller.withdrawMethod.binanceWalletAddress}\n\nWe'll notify you once your request is processed.\n\nBest regards,\nThe Admin Team`,
      });

      // Notify admin if admin email is configured
      if (process.env.ADMIN_EMAIL) {
        await sendMail({
          email: process.env.ADMIN_EMAIL,
          subject: "New Withdrawal Request - Binance",
          message: `New Binance withdrawal request received:\n\nSeller: ${seller.name} (${seller.email})\nAmount: $${amount}\nMethod: Binance\nWallet: ${seller.withdrawMethod.binanceWalletAddress}\nRequest ID: ${withdraw._id}\n\nPlease review in the admin panel.`,
        });
      }

      console.log("✅ Emails sent successfully");

      res.status(201).json({
        success: true,
        message: "Binance withdrawal request submitted successfully",
        withdraw,
      });
    } catch (error) {
      console.error("❌ Create Binance withdrawal error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   GET ALL WITHDRAW REQUESTS (ADMIN)
========================================================= */
router.get(
  "/get-all-withdraw-request",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("📋 ADMIN: Fetching all withdrawal requests...");
      
      const withdraws = await Withdraw.find()
        .populate("seller", "name email avatar availableBalance withdrawMethod")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${withdraws.length} withdrawal requests`);
      
      if (withdraws.length === 0) {
        console.log("ℹ️ No withdrawal requests found in database");
      } else {
        console.log("📝 Sample withdrawal:", {
          id: withdraws[0]._id,
          amount: withdraws[0].amount,
          status: withdraws[0].status,
          seller: withdraws[0].seller?.name
        });
      }

      res.status(200).json({
        success: true,
        withdraws,
      });
    } catch (error) {
      console.error("❌ Error fetching withdrawals:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   GET SELLER'S WITHDRAW HISTORY
========================================================= */
router.get(
  "/get-seller-withdraws",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("👤 Seller fetching withdrawal history...");

      const withdraws = await Withdraw.find({ seller: req.seller._id })
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${withdraws.length} withdrawals for seller`);

      res.status(200).json({
        success: true,
        withdraws,
      });
    } catch (error) {
      console.error("❌ Get seller withdraws error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   UPDATE WITHDRAW REQUEST (ADMIN) - FIXED
========================================================= */
router.put(
  "/update-withdraw-request/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { status, adminNote } = req.body;

      console.log("🔄 Updating withdrawal request:", req.params.id);
      console.log("New status:", status);

      if (!["completed", "rejected"].includes(status)) {
        return next(new ErrorHandler("Invalid status. Use 'completed' or 'rejected'", 400));
      }

      const withdraw = await Withdraw.findById(req.params.id).populate("seller");

      if (!withdraw) {
        console.error("❌ Withdraw request not found:", req.params.id);
        return next(new ErrorHandler("Withdraw request not found", 404));
      }

      if (withdraw.status !== "pending") {
        return next(new ErrorHandler(`Withdraw already ${withdraw.status}`, 400));
      }

      const seller = withdraw.seller;
      
      console.log("📊 Seller before update:", {
        name: seller.name,
        availableBalance: seller.availableBalance,
        lockedBalance: seller.lockedBalance || 0
      });

      // Process based on status
      if (status === "rejected") {
        // Refund: move from locked back to available
        seller.availableBalance += withdraw.amount;
        
        // 🔥 FIX: Handle missing lockedBalance
        if (seller.lockedBalance === undefined) {
          seller.lockedBalance = 0;
        } else {
          seller.lockedBalance = Math.max(0, (seller.lockedBalance || 0) - withdraw.amount);
        }
        
        // Add transaction record
        seller.transections.push({
          amount: withdraw.amount,
          status: "Withdraw Rejected",
          createdAt: new Date(),
        });
        
        withdraw.status = "rejected";
        withdraw.adminNote = adminNote || "Request rejected";
        withdraw.processedAt = new Date();
        
        console.log("✅ Status set to REJECTED - amount refunded");
        
      } else if (status === "completed") {
        // Complete: remove from locked balance
        // 🔥 FIX: Handle missing lockedBalance
        if (seller.lockedBalance === undefined) {
          seller.lockedBalance = 0;
        } else {
          seller.lockedBalance = Math.max(0, (seller.lockedBalance || 0) - withdraw.amount);
        }
        
        // Add transaction record
        seller.transections.push({
          amount: -withdraw.amount,
          status: "Withdraw Completed",
          createdAt: new Date(),
        });
        
        withdraw.status = "completed";
        withdraw.adminNote = adminNote || "Payment processed successfully";
        withdraw.processedAt = new Date();
        
        console.log("✅ Status set to COMPLETED - payment processed");
      }

      // Save both documents
      await Promise.all([withdraw.save(), seller.save()]);

      console.log("📊 Seller after update:", {
        name: seller.name,
        availableBalance: seller.availableBalance,
        lockedBalance: seller.lockedBalance || 0
      });

      // Send notification email to seller
      const statusMessage = status === "completed" 
        ? `Your withdrawal of $${withdraw.amount} has been processed successfully.` 
        : `Your withdrawal request of $${withdraw.amount} has been rejected.`;
      
      const noteMessage = adminNote ? `\n\nAdmin Note: ${adminNote}` : '';
      
      await sendMail({
        email: seller.email,
        subject: `Withdrawal Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Hello ${seller.name},\n\n${statusMessage}${noteMessage}\n\nRequest ID: ${withdraw._id}\nAmount: $${withdraw.amount}\n\nIf you have any questions, please contact support.\n\nBest regards,\nThe Admin Team`,
      });

      console.log("✅ Email sent to seller");

      res.status(200).json({
        success: true,
        message: `Withdrawal request ${status} successfully`,
        withdraw,
      });
    } catch (error) {
      console.error("❌ Update withdraw error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   DELETE WITHDRAW REQUEST (ADMIN) - FIXED
========================================================= */
router.delete(
  "/delete-withdraw-request/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("🗑️ Deleting withdrawal request:", req.params.id);

      const withdraw = await Withdraw.findById(req.params.id).populate("seller");

      if (!withdraw) {
        console.error("❌ Withdraw request not found:", req.params.id);
        return next(new ErrorHandler("Withdraw request not found", 404));
      }

      // Only allow deletion of pending requests
      if (withdraw.status !== "pending") {
        console.error(`❌ Cannot delete ${withdraw.status} withdrawal`);
        return next(new ErrorHandler(`Cannot delete ${withdraw.status} withdrawal requests`, 400));
      }

      const seller = withdraw.seller;
      
      console.log("📊 Seller before deletion:", {
        availableBalance: seller.availableBalance,
        lockedBalance: seller.lockedBalance || 0
      });
      
      // Refund the locked amount
      seller.availableBalance += withdraw.amount;
      
      // 🔥 FIX: Handle missing lockedBalance
      if (seller.lockedBalance === undefined) {
        seller.lockedBalance = 0;
      } else {
        seller.lockedBalance = Math.max(0, (seller.lockedBalance || 0) - withdraw.amount);
      }

      await seller.save();
      await withdraw.deleteOne();

      console.log("✅ Withdrawal deleted successfully");
      console.log("📊 Seller after deletion:", {
        availableBalance: seller.availableBalance,
        lockedBalance: seller.lockedBalance || 0
      });

      // Notify seller
      await sendMail({
        email: seller.email,
        subject: "Withdrawal Request Deleted",
        message: `Hello ${seller.name},\n\nYour withdrawal request of $${withdraw.amount} has been deleted by admin.\n\nThe amount has been returned to your available balance.\n\nRequest ID: ${withdraw._id}\n\nIf you have any questions, please contact support.\n\nBest regards,\nThe Admin Team`,
      });

      console.log("✅ Email sent to seller");

      res.status(200).json({
        success: true,
        message: "Withdrawal request deleted successfully",
      });
    } catch (error) {
      console.error("❌ Delete withdraw error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Other routes (get-pending-count, get-withdraw-stats, test-endpoint) remain the same...

module.exports = router;