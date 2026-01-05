const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const Product = require("../model/product");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/sendMail");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const sendShopToken = require("../utils/shopToken");

const router = express.Router();

// ==================== CREATE SHOP ====================
router.post(
  "/create-shop",
  upload.single("file"),
  catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, address, phoneNumber, zipCode } = req.body;

    // Check if shop exists
    const existingShop = await Shop.findOne({ email });
    if (existingShop) {
      if (req.file) fs.unlinkSync(`uploads/${req.file.filename}`);
      return next(new ErrorHandler("Shop already exists", 400));
    }

    const avatar = req.file ? req.file.filename : null;

    const shop = await Shop.create({
      name,
      email,
      password,
      address,
      phoneNumber,
      zipCode,
      avatar,
      role: "Seller",
    });

    // Activation token
    const activationToken = jwt.sign(
      { id: shop._id },
      process.env.ACTIVATION_SECRET,
      { expiresIn: "10m" }
    );

    const activationUrl = `http://localhost:3000/seller/activation/${activationToken}`;

    try {
      await sendMail({
        email,
        subject: "Activate your Shop",
        message: `Hello ${name}, please click on the link to activate your shop: ${activationUrl}`,
      });

      res.status(201).json({
        success: true,
        message: `Shop created! Check your email (${email}) to activate your account.`,
      });
    } catch (err) {
      await Shop.findByIdAndDelete(shop._id);
      if (req.file) fs.unlinkSync(`uploads/${req.file.filename}`);
      return next(new ErrorHandler("Failed to send activation email", 500));
    }
  })
);

// ==================== ACTIVATE SHOP ====================
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    const { activation_token } = req.body;
    if (!activation_token) return next(new ErrorHandler("Token is required", 400));

    try {
      const decoded = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
      const shop = await Shop.findById(decoded.id);
      if (!shop) return next(new ErrorHandler("Shop not found", 404));

      sendShopToken(shop, 201, res);
    } catch (err) {
      return next(new ErrorHandler("Invalid or expired token", 400));
    }
  })
);

// ==================== LOGIN SHOP ====================
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new ErrorHandler("Please provide all fields!", 400));

    const shop = await Shop.findOne({ email }).select("+password");
    if (!shop) return next(new ErrorHandler("Shop doesn't exist!", 400));

    const isPasswordValid = await shop.comparePassword(password);
    if (!isPasswordValid) return next(new ErrorHandler("Incorrect credentials", 400));

    sendShopToken(shop, 201, res);
  })
);

// ==================== GET SELLER INFO ====================
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const seller = await Shop.findById(req.seller._id);
    if (!seller) return next(new ErrorHandler("Seller doesn't exist", 404));
    res.status(200).json({ success: true, seller });
  })
);

// ==================== LOGOUT SHOP ====================
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    res.cookie("seller_token", null, { expires: new Date(Date.now()), httpOnly: true });
    res.status(200).json({ success: true, message: "Logout successful!" });
  })
);

// ==================== UPDATE SHOP AVATAR ====================
router.put(
  "/update-shop-avatar",
  isSeller,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    const shop = await Shop.findById(req.seller._id);
    if (!shop) return next(new ErrorHandler("Shop not found", 404));

    if (shop.avatar && req.file) fs.unlinkSync(`uploads/${shop.avatar}`);
    if (req.file) shop.avatar = req.file.filename;

    await shop.save();
    res.status(200).json({ success: true, seller: shop });
  })
);

// ==================== UPDATE SELLER INFO ====================
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    const { name, description, address, phoneNumber, zipCode } = req.body;
    const shop = await Shop.findById(req.seller._id);
    if (!shop) return next(new ErrorHandler("Shop not found", 404));

    shop.name = name || shop.name;
    shop.description = description || shop.description;
    shop.address = address || shop.address;
    shop.phoneNumber = phoneNumber || shop.phoneNumber;
    shop.zipCode = zipCode || shop.zipCode;

    await shop.save();
    res.status(200).json({ success: true, seller: shop });
  })
);

// ==================== UPDATE PAYMENT/WITHDRAW METHOD ====================
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { withdrawMethod } = req.body;

      if (!withdrawMethod || !withdrawMethod.type) {
        return next(new ErrorHandler("Withdraw method is required", 400));
      }

      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      // Validate based on type
      if (withdrawMethod.type === "bank") {
        if (!withdrawMethod.bankAccountNumber || !withdrawMethod.bankHolderName) {
          return next(new ErrorHandler("Bank account number and holder name are required", 400));
        }
      } else if (withdrawMethod.type === "binance") {
        if (!withdrawMethod.binanceWalletAddress) {
          return next(new ErrorHandler("Binance wallet address is required", 400));
        }
      } else {
        return next(new ErrorHandler("Invalid withdrawal method type", 400));
      }

      seller.withdrawMethod = withdrawMethod;
      await seller.save();

      res.status(200).json({
        success: true,
        message: "Withdrawal method updated successfully",
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ==================== DELETE WITHDRAW METHOD ====================
router.delete(
  "/delete-withdraw-method",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      seller.withdrawMethod = null;
      await seller.save();

      res.status(200).json({
        success: true,
        message: "Withdrawal method deleted successfully",
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ==================== GET ALL SHOPS (PUBLIC) ====================
router.get(
  "/get-all-shops",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        category = "",
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const skip = (page - 1) * limit;

      // Build query - only show active shops
      const query = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } }
        ];
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      // Get shops with pagination
      const shops = await Shop.find(query)
        .select("_id name email avatar phoneNumber address description category ratings totalProducts createdAt")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const totalShops = await Shop.countDocuments(query);

      // Calculate total products across all shops
      const totalProductsAggregate = await Shop.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$totalProducts" } } }
      ]);

      const totalProductsCount = totalProductsAggregate[0]?.total || 0;

      res.status(200).json({
        success: true,
        shops,
        pagination: {
          total: totalShops,
          page: parseInt(page),
          pages: Math.ceil(totalShops / limit),
          limit: parseInt(limit)
        },
        statistics: {
          totalShops,
          totalProducts: totalProductsCount,
          averageProductsPerShop: totalShops > 0 ? (totalProductsCount / totalShops).toFixed(1) : 0
        },
        filters: {
          search,
          category,
          sortBy,
          sortOrder
        }
      });
    } catch (error) {
      console.error("Get all shops error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== GET SHOP BY ID (PUBLIC) ====================
router.get(
  "/get-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;

      const shop = await Shop.findById(shopId)
        .select("-password")
        .lean();

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      // Get shop's products count
      const productsCount = shop.totalProducts || 0;

      // Get shop's recent products
      const recentProducts = await Product.find({ shopId: shopId })
        .select("name images discountPrice category")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      res.status(200).json({
        success: true,
        shop: {
          ...shop,
          productsCount,
          recentProducts
        }
      });
    } catch (error) {
      console.error("Get shop by ID error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== GET FEATURED SHOPS (TOP RATED) ====================
router.get(
  "/featured-shops",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;

      const featuredShops = await Shop.find({ 
        totalProducts: { $gt: 0 }
      })
        .select("_id name avatar description category ratings totalProducts")
        .sort({ ratings: -1, totalProducts: -1 })
        .limit(parseInt(limit))
        .lean();

      res.status(200).json({
        success: true,
        shops: featuredShops,
        count: featuredShops.length
      });
    } catch (error) {
      console.error("Get featured shops error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== SEARCH SHOPS ====================
router.get(
  "/search-shops",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { query = "", limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(200).json({
          success: true,
          shops: [],
          count: 0,
          message: "Please enter at least 2 characters to search"
        });
      }

      const searchRegex = new RegExp(query, "i");

      const shops = await Shop.find({
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
          { address: { $regex: searchRegex } }
        ]
      })
        .select("_id name avatar category description totalProducts ratings")
        .limit(parseInt(limit))
        .lean();

      res.status(200).json({
        success: true,
        shops,
        count: shops.length,
        searchQuery: query
      });
    } catch (error) {
      console.error("Search shops error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== GET SHOP CATEGORIES ====================
router.get(
  "/shop-categories",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Get unique categories from shops that have categories
      const categories = await Shop.distinct("category", { 
        category: { $exists: true, $ne: null, $ne: "" }
      });

      // Sort alphabetically
      const sortedCategories = categories.sort();

      res.status(200).json({
        success: true,
        categories: sortedCategories,
        count: sortedCategories.length
      });
    } catch (error) {
      console.error("Get shop categories error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== ADMIN: GET ALL SHOPS WITH DETAILS ====================
router.get(
  "/admin-get-all-shops",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 50,
        status = "",
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const skip = (page - 1) * limit;

      // Build query
      const query = {};

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } }
        ];
      }

      // Get shops with all details
      const shops = await Shop.find(query)
        .select("-password")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const totalShops = await Shop.countDocuments(query);

      // Get shop statistics
      const statusStats = await Shop.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const categoryStats = await Shop.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]);

      res.status(200).json({
        success: true,
        shops,
        pagination: {
          total: totalShops,
          page: parseInt(page),
          pages: Math.ceil(totalShops / limit),
          limit: parseInt(limit)
        },
        statistics: {
          totalShops,
          statusStats,
          categoryStats,
          totalProducts: await Shop.aggregate([
            { $group: { _id: null, total: { $sum: "$totalProducts" } } }
          ]).then(result => result[0]?.total || 0)
        }
      });
    } catch (error) {
      console.error("Admin get all shops error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== ADMIN: GET ALL SELLERS ====================
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const sellers = await Shop.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, sellers });
  })
);

// ==================== ADMIN: DELETE SELLER ====================
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    const seller = await Shop.findById(req.params.id);
    if (!seller) return next(new ErrorHandler("Seller not found", 404));

    await Shop.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Seller deleted successfully!" });
  })
);

// ==================== GET SHOP INFO FOR PREVIEW (PUBLIC) ====================
router.get(
  "/preview/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;

      const shop = await Shop.findById(shopId)
        .select("_id name avatar description address phoneNumber email category ratings totalProducts createdAt")
        .lean();

      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      // Get shop's products
      const products = await Product.find({ shopId: shopId })
        .select("name images discountPrice originalPrice category stock sold_out")
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();

      res.status(200).json({
        success: true,
        shop: {
          ...shop,
          products,
          productsCount: products.length
        }
      });
    } catch (error) {
      console.error("Get shop preview error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== GET SHOP STATISTICS ====================
router.get(
  "/stats/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;

      // Verify shop exists and belongs to seller
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      // Get product statistics
      const productStats = await Product.aggregate([
        { $match: { shopId: shopId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            totalValue: { $sum: { $multiply: ["$discountPrice", "$stock"] } },
            averagePrice: { $avg: "$discountPrice" },
            outOfStock: {
              $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] }
            }
          }
        }
      ]);

      // Get category distribution
      const categoryStats = await Product.aggregate([
        { $match: { shopId: shopId } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$discountPrice", "$stock"] } }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const stats = productStats[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        averagePrice: 0,
        outOfStock: 0
      };

      res.status(200).json({
        success: true,
        statistics: {
          shop: {
            name: shop.name,
            totalProducts: shop.totalProducts || 0,
            ratings: shop.ratings || 0
          },
          products: {
            total: stats.totalProducts,
            inStock: stats.totalProducts - stats.outOfStock,
            outOfStock: stats.outOfStock,
            totalStock: stats.totalStock,
            totalValue: parseFloat(stats.totalValue.toFixed(2)),
            averagePrice: parseFloat((stats.averagePrice || 0).toFixed(2))
          },
          categories: categoryStats
        }
      });
    } catch (error) {
      console.error("Get shop statistics error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ==================== UPDATE SHOP SETTINGS ====================
router.put(
  "/update-shop-settings",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        name,
        description,
        address,
        phoneNumber,
        zipCode,
        category,
        website,
        socialMedia
      } = req.body;

      const seller = await Shop.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      // Update fields
      if (name) seller.name = name;
      if (description) seller.description = description;
      if (address) seller.address = address;
      if (phoneNumber) seller.phoneNumber = phoneNumber;
      if (zipCode) seller.zipCode = zipCode;
      if (category) seller.category = category;
      if (website) seller.website = website;
      if (socialMedia) seller.socialMedia = socialMedia;

      await seller.save();

      res.status(200).json({
        success: true,
        message: "Shop settings updated successfully",
        shop: seller
      });
    } catch (error) {
      console.error("Update shop settings error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ==================== VERIFY SHOP EMAIL ====================
router.post(
  "/verify-email",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { id: seller._id, email: seller.email },
        process.env.ACTIVATION_SECRET,
        { expiresIn: "1h" }
      );

      const verificationUrl = `http://localhost:3000/shop/verify-email/${verificationToken}`;

      try {
        await sendMail({
          email: seller.email,
          subject: "Verify Your Shop Email",
          message: `Hello ${seller.name}, please click on the link to verify your email: ${verificationUrl}`
        });

        res.status(200).json({
          success: true,
          message: "Verification email sent. Please check your inbox."
        });
      } catch (error) {
        return next(new ErrorHandler("Failed to send verification email", 500));
      }
    } catch (error) {
      console.error("Verify email error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ==================== DEACTIVATE SHOP ====================
router.put(
  "/deactivate-shop",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      seller.status = "inactive";
      await seller.save();

      // Clear seller token
      res.cookie("seller_token", null, { expires: new Date(Date.now()), httpOnly: true });

      res.status(200).json({
        success: true,
        message: "Shop deactivated successfully"
      });
    } catch (error) {
      console.error("Deactivate shop error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ==================== REACTIVATE SHOP ====================
router.put(
  "/reactivate-shop/:id",
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;
      const shop = await Shop.findById(shopId);
      
      if (!shop) {
        return next(new ErrorHandler("Shop not found", 404));
      }

      shop.status = "active";
      await shop.save();

      res.status(200).json({
        success: true,
        message: "Shop reactivated successfully",
        shop
      });
    } catch (error) {
      console.error("Reactivate shop error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;