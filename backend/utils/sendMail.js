const express = require("express");
const router = express.Router();

const Shop = require("../model/shop");
const Withdraw = require("../model/withdraw");

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendMail = require("../utils/sendMail");

const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");

/* =========================================================
   CREATE BANK WITHDRAW REQUEST (SELLER)
========================================================= */
router.post(
  "/create-withdraw-request",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount } = req.body;

      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      // Check if seller has withdrawal method set
      if (!seller.withdrawMethod) {
        return next(new ErrorHandler("Please set up your withdrawal method first", 400));
      }

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
        return next(new ErrorHandler("Insufficient balance", 400));
      }

      // Check for pending requests
      const pendingRequest = await Withdraw.findOne({
        seller: seller._id,
        status: "pending"
      });

      if (pendingRequest) {
        return next(new ErrorHandler("You already have a pending withdrawal request. Please wait for it to be processed.", 400));
      }

      // Create withdraw request
      const withdraw = await Withdraw.create({
        seller: seller._id,
        amount,
        withdrawMethod: seller.withdrawMethod,
        status: "pending",
        adminNote: "",
        processedAt: null
      });

      // Lock balance (move from available to locked)
      seller.availableBalance -= amount;
      seller.lockedBalance = (seller.lockedBalance || 0) + amount;
      
      // Add to transactions
      seller.transections.push({
        _id: withdraw._id.toString(),
        amount: -amount,
        status: "Withdrawal Requested (Pending Admin Approval)",
        date: new Date(),
        details: "Funds locked pending admin review"
      });

      await seller.save();

      // Email to seller
      const sellerEmailOptions = {
        email: seller.email,
        subject: "📥 Withdrawal Request Submitted Successfully",
        message: `Dear ${seller.name},

✅ Your withdrawal request has been submitted successfully!

📋 **Request Details:**
- Amount: $${amount}
- Payment Method: Bank Transfer
- Request ID: ${withdraw._id}
- Date Submitted: ${new Date().toLocaleDateString()}
- Account: ****${seller.withdrawMethod.bankAccountNumber?.slice(-4) || '****'}

⏳ **Next Steps:**
Your request is now pending admin approval. Our team will review it within 24-48 hours. You will receive another email once your request is processed.

📊 **Your Updated Balance:**
- Available Balance: $${seller.availableBalance.toFixed(2)}
- Locked Balance: $${seller.lockedBalance.toFixed(2)}

📞 **Need Help?**
If you have any questions, please contact our support team.

Thank you for selling with us!

Best regards,
Admin Team`
      };

      // Email to admin
      const adminEmailOptions = {
        email: process.env.SMTP_MAIL, // Admin email
        subject: "🔄 New Withdrawal Request - Bank Transfer",
        message: `📋 **New Withdrawal Request Received**

🛍️ **Seller Details:**
- Name: ${seller.name}
- Email: ${seller.email}
- Shop: ${seller.name}

💰 **Withdrawal Details:**
- Amount: $${amount}
- Method: Bank Transfer
- Request ID: ${withdraw._id}
- Date: ${new Date().toLocaleDateString()}

🏦 **Bank Details:**
- Bank Name: ${seller.withdrawMethod.bankName || 'Not specified'}
- Account Holder: ${seller.withdrawMethod.bankHolderName}
- Account Number: ${seller.withdrawMethod.bankAccountNumber}
- Bank Country: ${seller.withdrawMethod.bankCountry || 'Not specified'}

⏰ **Action Required:**
Please review this request in the admin panel and approve or reject it within 24-48 hours.

👉 **Admin Panel:** ${process.env.FRONTEND_URL}/admin-withdraws

Thank you!`
      };

      // Send emails
      await sendMail(sellerEmailOptions);
      await sendMail(adminEmailOptions);

      res.status(201).json({
        success: true,
        message: "Withdrawal request submitted successfully! You will receive an email confirmation.",
        withdraw,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   CREATE BINANCE WITHDRAW REQUEST (SELLER)
========================================================= */
router.post(
  "/create-withdraw-request-binance",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { amount } = req.body;

      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      // Check if seller has binance method set
      if (!seller.withdrawMethod) {
        return next(new ErrorHandler("Please set up your withdrawal method first", 400));
      }

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
        return next(new ErrorHandler("Insufficient balance", 400));
      }

      // Check for pending requests
      const pendingRequest = await Withdraw.findOne({
        seller: seller._id,
        status: "pending"
      });

      if (pendingRequest) {
        return next(new ErrorHandler("You already have a pending withdrawal request. Please wait for it to be processed.", 400));
      }

      // Create withdraw request
      const withdraw = await Withdraw.create({
        seller: seller._id,
        amount,
        withdrawMethod: seller.withdrawMethod,
        status: "pending",
        adminNote: "",
        processedAt: null
      });

      // Lock balance (move from available to locked)
      seller.availableBalance -= amount;
      seller.lockedBalance = (seller.lockedBalance || 0) + amount;
      
      // Add to transactions
      seller.transections.push({
        _id: withdraw._id.toString(),
        amount: -amount,
        status: "Withdrawal Requested (Pending Admin Approval)",
        date: new Date(),
        details: "Funds locked pending admin review"
      });

      await seller.save();

      // Email to seller
      const sellerEmailOptions = {
        email: seller.email,
        subject: "📥 Binance Withdrawal Request Submitted Successfully",
        message: `Dear ${seller.name},

✅ Your Binance withdrawal request has been submitted successfully!

📋 **Request Details:**
- Amount: $${amount}
- Payment Method: Binance
- Wallet Address: ${seller.withdrawMethod.binanceWalletAddress}
- Request ID: ${withdraw._id}
- Date Submitted: ${new Date().toLocaleDateString()}

⏳ **Next Steps:**
Your request is now pending admin approval. Our team will review it within 24-48 hours. You will receive another email once your request is processed.

📊 **Your Updated Balance:**
- Available Balance: $${seller.availableBalance.toFixed(2)}
- Locked Balance: $${seller.lockedBalance.toFixed(2)}

⚠️ **Important Note:**
Please ensure your Binance wallet address is correct. Transactions to incorrect addresses cannot be reversed.

📞 **Need Help?**
If you have any questions, please contact our support team.

Thank you for selling with us!

Best regards,
Admin Team`
      };

      // Email to admin
      const adminEmailOptions = {
        email: process.env.SMTP_MAIL, // Admin email
        subject: "🔄 New Withdrawal Request - Binance",
        message: `📋 **New Binance Withdrawal Request Received**

🛍️ **Seller Details:**
- Name: ${seller.name}
- Email: ${seller.email}
- Shop: ${seller.name}

💰 **Withdrawal Details:**
- Amount: $${amount}
- Method: Binance
- Request ID: ${withdraw._id}
- Date: ${new Date().toLocaleDateString()}

🔑 **Binance Details:**
- Wallet Address: ${seller.withdrawMethod.binanceWalletAddress}

⏰ **Action Required:**
Please review this request in the admin panel and approve or reject it within 24-48 hours.

👉 **Admin Panel:** ${process.env.FRONTEND_URL}/admin-withdraws

⚠️ **Note:** Verify the Binance wallet address before approving.

Thank you!`
      };

      // Send emails
      await sendMail(sellerEmailOptions);
      await sendMail(adminEmailOptions);

      res.status(201).json({
        success: true,
        message: "Binance withdrawal request submitted successfully! You will receive an email confirmation.",
        withdraw,
      });
    } catch (error) {
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
      const withdraws = await Withdraw.find()
        .populate("seller", "name email avatar")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        withdraws,
      });
    } catch (error) {
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
      const withdraws = await Withdraw.find({ seller: req.seller._id })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        withdraws,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   GET SINGLE WITHDRAW REQUEST
========================================================= */
router.get(
  "/get-withdraw-request/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const withdraw = await Withdraw.findById(req.params.id)
        .populate("seller", "name email avatar");

      if (!withdraw) {
        return next(new ErrorHandler("Withdraw request not found", 404));
      }

      // Check permissions - seller can only see their own requests
      if (req.user.role === "seller" && withdraw.seller._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to view this request", 403));
      }

      res.status(200).json({
        success: true,
        withdraw,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   UPDATE WITHDRAW REQUEST (ADMIN)
   status: completed | rejected
========================================================= */
router.put(
  "/update-withdraw-request/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { status, adminNote } = req.body;

      if (!["completed", "rejected"].includes(status)) {
        return next(new ErrorHandler("Invalid status. Use 'completed' or 'rejected'", 400));
      }

      const withdraw = await Withdraw.findById(req.params.id).populate("seller");

      if (!withdraw) {
        return next(new ErrorHandler("Withdraw request not found", 404));
      }

      if (withdraw.status !== "pending") {
        return next(new ErrorHandler(`Withdraw already ${withdraw.status}`, 400));
      }

      const seller = withdraw.seller;
      let emailSubject = "";
      let emailMessage = "";
      
      // Process based on status
      if (status === "rejected") {
        // Refund: move from locked back to available
        seller.availableBalance += withdraw.amount;
        seller.lockedBalance = Math.max(0, (seller.lockedBalance || 0) - withdraw.amount);
        
        // Add transaction record
        seller.transections.push({
          _id: withdraw._id.toString(),
          amount: withdraw.amount,
          status: "Withdrawal Rejected",
          date: new Date(),
          details: adminNote || "Request rejected by admin"
        });
        
        withdraw.status = "rejected";
        withdraw.adminNote = adminNote || "Request rejected. Please check your withdrawal method details and try again.";
        withdraw.processedAt = new Date();
        
        // Email content for rejection
        emailSubject = "⚠️ Withdrawal Request Rejected";
        emailMessage = `Dear ${seller.name},

❌ We regret to inform you that your withdrawal request has been rejected.

📋 **Request Details:**
- Amount: $${withdraw.amount}
- Request ID: ${withdraw._id}
- Date Submitted: ${new Date(withdraw.createdAt).toLocaleDateString()}
- Status: REJECTED

📝 **Reason for Rejection:**
${withdraw.adminNote}

💰 **Refund Information:**
The amount of $${withdraw.amount} has been returned to your available balance.

📊 **Your Updated Balance:**
- Available Balance: $${seller.availableBalance.toFixed(2)}
- Locked Balance: $${seller.lockedBalance.toFixed(2)}

🔄 **What to Do Next:**
1. Check your withdrawal method details are correct
2. Ensure you meet all withdrawal requirements
3. Contact customer support if you need clarification

📞 **Contact Support:**
If you believe this was an error or need further assistance, please contact our support team immediately.

We appreciate your understanding.

Best regards,
Admin Team`;
        
      } else if (status === "completed") {
        // Complete: remove from locked balance (already deducted from available)
        seller.lockedBalance = Math.max(0, (seller.lockedBalance || 0) - withdraw.amount);
        
        // Add transaction record
        seller.transections.push({
          _id: withdraw._id.toString(),
          amount: -withdraw.amount,
          status: "Withdrawal Completed",
          date: new Date(),
          details: adminNote || "Payment processed successfully"
        });
        
        withdraw.status = "completed";
        withdraw.adminNote = adminNote || "✅ Congratulations! Your withdrawal has been processed successfully. Funds should arrive in your account within 1-3 business days.";
        withdraw.processedAt = new Date();
        
        // Email content for completion
        emailSubject = "🎉 Withdrawal Request Approved!";
        
        // Method-specific details
        let methodDetails = "";
        if (withdraw.withdrawMethod.type === "bank") {
          methodDetails = `🏦 **Bank Details:**
- Bank: ${withdraw.withdrawMethod.bankName || 'N/A'}
- Account: ****${withdraw.withdrawMethod.bankAccountNumber?.slice(-4) || '****'}
- Holder: ${withdraw.withdrawMethod.bankHolderName}`;
        } else {
          methodDetails = `🔑 **Binance Details:**
- Wallet Address: ${withdraw.withdrawMethod.binanceWalletAddress}`;
        }
        
        emailMessage = `Dear ${seller.name},

✅ Great news! Your withdrawal request has been approved and processed successfully!

📋 **Request Details:**
- Amount: $${withdraw.amount}
- Payment Method: ${withdraw.withdrawMethod.type === "bank" ? "Bank Transfer" : "Binance"}
- Request ID: ${withdraw._id}
- Date Processed: ${new Date().toLocaleDateString()}
- Transaction Status: COMPLETED

${methodDetails}

💳 **Payment Information:**
Your funds have been sent to the specified account. The transfer typically takes:
- Bank Transfer: 1-3 business days
- Binance: Usually within 24 hours

📊 **Your Updated Balance:**
- Available Balance: $${seller.availableBalance.toFixed(2)}
- Locked Balance: $${seller.lockedBalance.toFixed(2)}

📝 **Admin Note:**
${withdraw.adminNote}

🎯 **What to Expect:**
1. Monitor your bank/Binance account for the incoming transfer
2. Contact your bank if you don't see funds after 3 business days
3. Keep this email for your records

📞 **Need Help?**
If you have any questions or don't see the funds within the expected timeframe, please contact our support team.

Thank you for selling with us!

Best regards,
Admin Team`;
      }

      // Save both documents
      await Promise.all([withdraw.save(), seller.save()]);

      // Send notification email to seller
      const sellerEmailOptions = {
        email: seller.email,
        subject: emailSubject,
        message: emailMessage
      };

      await sendMail(sellerEmailOptions);

      // Also notify admin that action was taken
      const adminEmailOptions = {
        email: process.env.SMTP_MAIL,
        subject: `✅ Withdrawal Request ${status === "completed" ? "Approved" : "Rejected"}`,
        message: `📋 **Withdrawal Request Processed**

🛍️ **Seller:** ${seller.name} (${seller.email})
💰 **Amount:** $${withdraw.amount}
📅 **Date:** ${new Date().toLocaleDateString()}
✅ **Status:** ${status.toUpperCase()}
📝 **Admin Note:** ${adminNote || "No note provided"}

${status === "rejected" ? "❌ Request rejected and funds refunded to seller." : "✅ Payment processed and sent to seller."}

Thank you for your action!`
      };

      await sendMail(adminEmailOptions);

      res.status(200).json({
        success: true,
        message: `Withdrawal request ${status} successfully! Seller has been notified via email.`,
        withdraw,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   DELETE WITHDRAW REQUEST (ADMIN - Only for pending requests)
========================================================= */
router.delete(
  "/delete-withdraw-request/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const withdraw = await Withdraw.findById(req.params.id).populate("seller");

      if (!withdraw) {
        return next(new ErrorHandler("Withdraw request not found", 404));
      }

      // Only allow deletion of pending requests
      if (withdraw.status !== "pending") {
        return next(new ErrorHandler(`Cannot delete ${withdraw.status} withdrawal requests`, 400));
      }

      const seller = withdraw.seller;
      
      // Refund the locked amount
      seller.availableBalance += withdraw.amount;
      seller.lockedBalance = Math.max(0, (seller.lockedBalance || 0) - withdraw.amount);
      
      // Update transactions
      seller.transections.push({
        _id: withdraw._id.toString(),
        amount: withdraw.amount,
        status: "Withdrawal Request Cancelled",
        date: new Date(),
        details: "Request deleted by admin, funds refunded"
      });

      await seller.save();
      await withdraw.deleteOne();

      // Notify seller
      const sellerEmailOptions = {
        email: seller.email,
        subject: "🗑️ Withdrawal Request Cancelled",
        message: `Dear ${seller.name},

⚠️ Your withdrawal request has been cancelled by the admin.

📋 **Request Details:**
- Amount: $${withdraw.amount}
- Request ID: ${withdraw._id}
- Original Request Date: ${new Date(withdraw.createdAt).toLocaleDateString()}
- Status: CANCELLED

💰 **Refund Information:**
The amount of $${withdraw.amount} has been returned to your available balance.

📊 **Your Updated Balance:**
- Available Balance: $${seller.availableBalance.toFixed(2)}
- Locked Balance: $${seller.lockedBalance.toFixed(2)}

🔄 **What to Do Next:**
If you still wish to withdraw funds, please submit a new withdrawal request with correct information.

📞 **Contact Support:**
If you have questions about why your request was cancelled, please contact our support team.

Thank you for your understanding.

Best regards,
Admin Team`
      };

      await sendMail(sellerEmailOptions);

      res.status(200).json({
        success: true,
        message: "Withdrawal request deleted successfully and seller notified.",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   GET PENDING WITHDRAW COUNT (ADMIN DASHBOARD)
========================================================= */
router.get(
  "/get-pending-count",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const count = await Withdraw.countDocuments({ status: "pending" });

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* =========================================================
   GET WITHDRAW STATS (ADMIN DASHBOARD)
========================================================= */
router.get(
  "/get-withdraw-stats",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // Today's completed withdrawals
      const todayWithdraws = await Withdraw.aggregate([
        {
          $match: {
            status: "completed",
            processedAt: { $gte: startOfDay }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]);

      // This month's completed withdrawals
      const monthWithdraws = await Withdraw.aggregate([
        {
          $match: {
            status: "completed",
            processedAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]);

      // This year's completed withdrawals
      const yearWithdraws = await Withdraw.aggregate([
        {
          $match: {
            status: "completed",
            processedAt: { $gte: startOfYear }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]);

      // All pending withdrawals total
      const pendingWithdraws = await Withdraw.aggregate([
        {
          $match: {
            status: "pending"
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        stats: {
          today: {
            totalAmount: todayWithdraws[0]?.totalAmount || 0,
            count: todayWithdraws[0]?.count || 0
          },
          month: {
            totalAmount: monthWithdraws[0]?.totalAmount || 0,
            count: monthWithdraws[0]?.count || 0
          },
          year: {
            totalAmount: yearWithdraws[0]?.totalAmount || 0,
            count: yearWithdraws[0]?.count || 0
          },
          pending: {
            totalAmount: pendingWithdraws[0]?.totalAmount || 0,
            count: pendingWithdraws[0]?.count || 0
          }
        }
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;