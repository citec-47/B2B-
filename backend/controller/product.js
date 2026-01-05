const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");

// ========== EXISTING PRODUCT ROUTES ==========

// Create product (Manual)
router.post(
  "/create-product",
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      }

      const files = req.files;
      if (!files || files.length === 0) {
        return next(new ErrorHandler("Please upload product images!", 400));
      }

      const imageUrls = files.map((file) => `${file.filename}`);

      const productData = {
        ...req.body,
        images: imageUrls,
        shop: {
          _id: shop._id,
          name: shop.name,
          email: shop.email,
          avatar: shop.avatar || ""
        },
        isImported: false,
        externalSource: 'MANUAL'
      };

      // Validate required fields
      const requiredFields = ['name', 'description', 'category', 'discountPrice', 'stock'];
      for (const field of requiredFields) {
        if (!productData[field]) {
          return next(new ErrorHandler(`Please enter product ${field}!`, 400));
        }
      }

      const product = await Product.create(productData);

      // Update shop's product count
      await Shop.findByIdAndUpdate(shopId, { $inc: { totalProducts: 1 } });

      res.status(201).json({
        success: true,
        product,
        message: "Product created successfully!"
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// Get all products of a shop - FIXED VERSION
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.id;
      console.log(`[API] Fetching products for shop: ${shopId}`);
      
      // FIX: Try multiple ways to find products
      let products = [];
      
      // Method 1: Try exact shopId match
      products = await Product.find({ shopId: shopId })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`[API] Method 1 (shopId): Found ${products.length} products`);
      
      // Method 2: Try with shop._id if first method fails
      if (products.length === 0) {
        products = await Product.find({ 'shop._id': shopId })
          .sort({ createdAt: -1 })
          .lean();
        console.log(`[API] Method 2 (shop._id): Found ${products.length} products`);
      }
      
      // Method 3: Try case-insensitive search
      if (products.length === 0) {
        products = await Product.find({
          $or: [
            { shopId: { $regex: new RegExp(`^${shopId}$`, 'i') } },
            { 'shop._id': { $regex: new RegExp(`^${shopId}$`, 'i') } }
          ]
        })
        .sort({ createdAt: -1 })
        .lean();
        console.log(`[API] Method 3 (case-insensitive): Found ${products.length} products`);
      }
      
      console.log(`[API] Total products found: ${products.length}`);
      
      // Calculate statistics
      const importedCount = products.filter(p => p.isImported === true).length;
      const manualCount = products.filter(p => !p.isImported || p.isImported === false).length;
      const inStockCount = products.filter(p => p.stock > 0).length;
      const outOfStockCount = products.filter(p => p.stock <= 0).length;
      
      console.log(`[API] Statistics - Imported: ${importedCount}, Manual: ${manualCount}, In Stock: ${inStockCount}`);

      res.status(200).json({
        success: true,
        products,
        statistics: {
          total: products.length,
          imported: importedCount,
          manual: manualCount,
          inStock: inStockCount,
          outOfStock: outOfStockCount
        }
      });
    } catch (error) {
      console.error(`[API] Error fetching products for shop ${req.params.id}:`, error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ========== COMPATIBILITY ROUTE ==========

// Compatibility route: get-all-products with shopId query parameter
router.get(
  "/get-all-products",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.query.shopId;
      
      console.log("[COMPATIBILITY] /get-all-products called with shopId:", shopId);
      
      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: "shopId query parameter is required",
          example: "/api/v2/product/get-all-products?shopId=YOUR_SHOP_ID",
          correctEndpoint: "/api/v2/product/get-all-products-shop/:shopId",
          note: "This endpoint exists for compatibility. Use /get-all-products-shop/:shopId for new code."
        });
      }
      
      // Get products for the shop
      const products = await Product.find({ shopId: shopId })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`[COMPATIBILITY] Found ${products.length} products for shop ${shopId}`);
      
      const importedCount = products.filter(p => p.isImported === true).length;
      const manualCount = products.filter(p => !p.isImported || p.isImported === false).length;
      const inStockCount = products.filter(p => p.stock > 0).length;
      const outOfStockCount = products.filter(p => p.stock <= 0).length;
      
      res.status(200).json({
        success: true,
        products,
        statistics: {
          total: products.length,
          imported: importedCount,
          manual: manualCount,
          inStock: inStockCount,
          outOfStock: outOfStockCount
        },
        message: "Products fetched successfully (compatibility route)",
        note: "This is a compatibility route. Please use /get-all-products-shop/:shopId in the future"
      });
    } catch (error) {
      console.error("[COMPATIBILITY] Error:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ========== PRODUCT IMPORT ROUTES ==========

// Generate mock products for import (Demo)
const generateMockProducts = (count = 100) => {
  const products = [];
  const categories = [
    "Electronics", "Mobile Phones", "Laptops", "Tablets", 
    "Smart Watches", "Headphones", "Speakers", "Cameras",
    "Fashion", "Men's Clothing", "Women's Clothing", "Shoes",
    "Home & Kitchen", "Furniture", "Home Decor", "Kitchen Appliances",
    "Beauty & Health", "Skincare", "Makeup", "Health Supplements",
    "Sports & Outdoors", "Fitness Equipment", "Outdoor Gear",
    "Toys & Games", "Video Games", "Board Games", "Educational Toys",
    "Automotive", "Car Parts", "Car Accessories", "Motorcycle Parts",
    "Books", "Fiction", "Non-fiction", "Educational",
    "Jewelry", "Watches", "Accessories"
  ];

  const brands = {
    "Mobile Phones": ["Samsung", "Apple", "Xiaomi", "OnePlus", "Google Pixel"],
    "Laptops": ["Dell", "HP", "Lenovo", "Apple", "Asus"],
    "Fashion": ["Nike", "Adidas", "Zara", "H&M", "Levi's"],
    "Home & Kitchen": ["IKEA", "Philips", "Tefal", "KitchenAid"],
    "Electronics": ["Sony", "LG", "Panasonic", "Bose", "JBL"]
  };

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brandList = brands[category] || ["Generic", "Premium", "Standard"];
    const brand = brandList[Math.floor(Math.random() * brandList.length)];
    
    const costPrice = parseFloat((Math.random() * 500 + 5).toFixed(2));
    const originalPrice = parseFloat((costPrice * (1.3 + Math.random() * 0.7)).toFixed(2));
    
    products.push({
      externalId: `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
      name: `${brand} ${category} Product ${i + 1}`,
      description: `Premium quality ${category.toLowerCase()} from ${brand}. Features include high-end materials and excellent durability. Perfect for everyday use and long-term performance.`,
      category,
      originalPrice,
      discountPrice: costPrice,
      stock: Math.floor(Math.random() * 500) + 10,
      images: ["default-product.jpg"],
      externalSource: "MOCK_API",
      externalUrl: `https://mockapi.com/product/${i}`,
      tags: ["Best Seller", "New Arrival", "Hot Item"].slice(0, Math.floor(Math.random() * 3) + 1).join(","),
      brand,
      specifications: {
        brand,
        model: `MOD-${Math.floor(Math.random() * 10000)}`,
        weight: `${(Math.random() * 5 + 0.1).toFixed(1)}kg`,
        color: ["Black", "White", "Silver", "Blue", "Red"][Math.floor(Math.random() * 5)],
        warranty: `${Math.floor(Math.random() * 3) + 1} years`
      },
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 1000)
    });
  }
  
  return products;
};

// 1. Fetch external products for import
router.get(
  "/fetch-external",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        category = "",
        search = "",
        page = 1,
        limit = 12,
      } = req.query;

      console.log(`[IMPORT] Fetching external products: category=${category}, search=${search}, page=${page}, limit=${limit}`);

      // Use mock data (in production, you would call external API)
      let products = generateMockProducts(100);
      
      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
        );
      }
      
      if (category && category !== "All") {
        products = products.filter(p => p.category === category);
      }
      
      // Get unique categories
      const allCategories = [...new Set(products.map(p => p.category))].sort();
      
      // Pagination
      const start = (page - 1) * limit;
      const end = start + parseInt(limit);
      const paginatedProducts = products.slice(start, end);
      
      res.status(200).json({
        success: true,
        products: paginatedProducts,
        total: products.length,
        page: parseInt(page),
        pages: Math.ceil(products.length / limit),
        source: "MOCK_DATA_API",
        categories: ["All", ...allCategories],
        message: `${paginatedProducts.length} products fetched successfully`
      });

    } catch (error) {
      console.error("[IMPORT] Error fetching external products:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch external products",
        error: error.message,
      });
    }
  })
);

// 2. Get import categories
router.get(
  "/import-categories",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const categories = [
        "All",
        "Electronics",
        "Mobile Phones", 
        "Laptops",
        "Tablets",
        "Smart Watches",
        "Headphones",
        "Speakers",
        "Cameras",
        "Fashion",
        "Men's Clothing",
        "Women's Clothing",
        "Shoes",
        "Home & Kitchen",
        "Furniture",
        "Home Decor",
        "Kitchen Appliances",
        "Beauty & Health",
        "Skincare",
        "Makeup",
        "Health Supplements",
        "Sports & Outdoors",
        "Fitness Equipment",
        "Outdoor Gear",
        "Toys & Games",
        "Video Games",
        "Board Games",
        "Educational Toys",
        "Automotive",
        "Car Parts",
        "Car Accessories",
        "Motorcycle Parts",
        "Books",
        "Fiction",
        "Non-fiction",
        "Educational",
        "Jewelry",
        "Watches",
        "Accessories"
      ];

      res.status(200).json({
        success: true,
        categories,
        message: "Import categories fetched successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch import categories",
        error: error.message,
      });
    }
  })
);

// 3. Import single product
router.post(
  "/import-external",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        externalId,
        name,
        description,
        category,
        originalPrice,
        discountPrice,
        stock,
        images,
        shopId,
        markupPercentage = 30,
        tags,
        externalSource
      } = req.body;

      console.log("[IMPORT] Single import request:", { 
        name, 
        shopId,
        externalSource,
        discountPrice,
        markupPercentage 
      });

      // Validate required fields
      if (!name || !category || !shopId) {
        return res.status(400).json({
          success: false,
          message: "Name, category, and shopId are required"
        });
      }

      // Validate shop exists
      const shop = await Shop.findById(shopId);
      if (!shop) {
        console.log(`[IMPORT] Shop not found: ${shopId}`);
        return res.status(404).json({
          success: false,
          message: "Shop not found",
        });
      }

      // Calculate selling price with markup
      const costPrice = parseFloat(discountPrice || 10);
      const sellingPrice = parseFloat((costPrice * (1 + (markupPercentage / 100))).toFixed(2));
      
      // Prepare product data
      const productData = {
        name: (name || `Imported Product ${Date.now()}`).substring(0, 200),
        description: description || "Imported product description",
        category: category || "Uncategorized",
        originalPrice: parseFloat(originalPrice || (sellingPrice * 1.5)).toFixed(2),
        discountPrice: sellingPrice,
        stock: stock || 100,
        images: images || ["default-product.jpg"],
        shopId: shopId,
        shop: {
          _id: shop._id,
          name: shop.name,
          email: shop.email,
          avatar: shop.avatar || ""
        },
        tags: tags || "imported",
        externalId: externalId || `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalSource: externalSource || 'IMPORTED',
        isImported: true,
        importData: {
          originalCost: costPrice,
          importedAt: new Date(),
          markupPercentage: markupPercentage,
          sourceId: externalId
        }
      };

      console.log(`[IMPORT] Creating imported product:`, {
        name: productData.name,
        isImported: productData.isImported,
        price: productData.discountPrice,
        stock: productData.stock
      });

      // Create product in database
      const product = await Product.create(productData);

      // Update shop's product count
      await Shop.findByIdAndUpdate(shopId, { $inc: { totalProducts: 1 } });

      console.log(`[IMPORT] Product created successfully with ID: ${product._id}`);

      res.status(201).json({
        success: true,
        product: {
          id: product._id,
          name: product.name,
          price: product.discountPrice,
          stock: product.stock,
          isImported: product.isImported,
          externalSource: product.externalSource
        },
        message: "Product imported successfully!",
        pricing: {
          costPrice: costPrice,
          sellingPrice: sellingPrice,
          markupPercentage: markupPercentage,
          profit: parseFloat((sellingPrice - costPrice).toFixed(2))
        }
      });

    } catch (error) {
      console.error("[IMPORT] Error importing single product:", error);
      
      let errorMessage = "Failed to import product";
      if (error.code === 11000) {
        errorMessage = "Product with this external ID already exists";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Validation error: " + Object.values(error.errors).map(e => e.message).join(', ');
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message,
        details: error.errors
      });
    }
  })
);

// 4. Bulk import products
router.post(
  "/bulk-import-external",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { 
        products = [], 
        shopId, 
        markupPercentage = 30 
      } = req.body;

      console.log(`[BULK IMPORT] Starting bulk import for shop: ${shopId}`);
      console.log(`[BULK IMPORT] Received ${products.length} products to import`);
      
      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No products provided for import",
        });
      }

      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: "Shop ID is required",
        });
      }

      // Validate shop exists
      const shop = await Shop.findById(shopId);
      if (!shop) {
        console.log(`[BULK IMPORT] Shop not found: ${shopId}`);
        return res.status(404).json({
          success: false,
          message: "Shop not found",
        });
      }

      console.log(`[BULK IMPORT] Shop found: ${shop.name}`);

      const importedProducts = [];
      const failed = [];

      // Process each product
      for (let i = 0; i < products.length; i++) {
        const extProduct = products[i];
        try {
          console.log(`[BULK IMPORT ${i + 1}/${products.length}] Processing: ${extProduct.name}`);
          
          // Validate product data
          if (!extProduct.name || !extProduct.category) {
            throw new Error("Product name and category are required");
          }

          // Calculate pricing
          const costPrice = parseFloat(extProduct.discountPrice || 10);
          const sellingPrice = parseFloat((costPrice * (1 + (markupPercentage / 100))).toFixed(2));
          
          // Generate unique external ID if not provided
          const uniqueId = extProduct.externalId || 
            `bulk-import-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Prepare product data
          const productData = {
            name: extProduct.name.substring(0, 200),
            description: extProduct.description || `Imported ${extProduct.name}`,
            category: extProduct.category,
            originalPrice: parseFloat(extProduct.originalPrice || (sellingPrice * 1.5)).toFixed(2),
            discountPrice: sellingPrice,
            stock: extProduct.stock || 100,
            images: extProduct.images || ["default-product.jpg"],
            shopId: shopId,
            shop: {
              _id: shop._id,
              name: shop.name,
              email: shop.email,
              avatar: shop.avatar || ""
            },
            tags: extProduct.tags || "imported",
            externalId: uniqueId,
            externalSource: extProduct.externalSource || 'IMPORTED',
            isImported: true,
            importData: {
              originalCost: costPrice,
              importedAt: new Date(),
              markupPercentage: markupPercentage,
              sourceId: extProduct.externalId
            }
          };

          console.log(`[BULK IMPORT] Creating product: ${productData.name} (isImported: ${productData.isImported})`);
          
          // Create product
          const product = await Product.create(productData);
          
          console.log(`[BULK IMPORT] Created product ID: ${product._id}`);
          
          importedProducts.push({
            id: product._id,
            name: product.name,
            price: product.discountPrice,
            isImported: product.isImported,
            externalSource: product.externalSource
          });

        } catch (productError) {
          console.error(`[BULK IMPORT] Failed to import product ${i + 1}:`, productError.message);
          
          failed.push({
            index: i + 1,
            name: extProduct.name || `Product ${i + 1}`,
            error: productError.message,
            externalId: extProduct.externalId
          });
        }
      }

      // Update shop's product count
      if (importedProducts.length > 0) {
        await Shop.findByIdAndUpdate(shopId, {
          $inc: { totalProducts: importedProducts.length }
        });
      }

      console.log(`[BULK IMPORT] Completed. Success: ${importedProducts.length}, Failed: ${failed.length}`);

      res.status(201).json({
        success: true,
        message: `Bulk import completed! ${importedProducts.length} products imported successfully.`,
        results: {
          imported: importedProducts.length,
          failed: failed.length,
          total: importedProducts.length + failed.length,
          importedProducts: importedProducts,
          failedProducts: failed
        }
      });

    } catch (error) {
      console.error("[BULK IMPORT] Critical error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import products",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// ========== DEBUG & UTILITY ENDPOINTS ==========

// 5. Get product statistics
router.get(
  "/stats/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId } = req.params;
      
      // Calculate statistics manually since the static method might not exist
      const allProducts = await Product.find({ shopId }).lean();
      
      const total = allProducts.length;
      const imported = allProducts.filter(p => p.isImported === true).length;
      const manual = allProducts.filter(p => !p.isImported || p.isImported === false).length;
      const inStock = allProducts.filter(p => p.stock > 0).length;
      const outOfStock = allProducts.filter(p => p.stock <= 0).length;
      
      // Calculate total stock and value
      const totalStock = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
      const totalValue = allProducts.reduce((sum, p) => sum + (p.discountPrice || 0) * (p.stock || 0), 0);
      
      const stats = {
        total,
        imported,
        manual,
        inStock,
        outOfStock,
        totalStock,
        totalValue: parseFloat(totalValue.toFixed(2))
      };
      
      res.status(200).json({
        success: true,
        stats,
        message: "Product statistics fetched successfully"
      });
    } catch (error) {
      console.error("[STATS] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message
      });
    }
  })
);

// 6. Debug endpoint to check products
router.get(
  "/debug/check-products/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId } = req.params;
      
      const allProducts = await Product.find({ shopId })
        .sort({ createdAt: -1 })
        .select('name isImported externalSource discountPrice stock createdAt')
        .lean();
      
      const importedProducts = allProducts.filter(p => p.isImported === true);
      const manualProducts = allProducts.filter(p => !p.isImported || p.isImported === false);
      
      // Group by externalSource
      const sourceCounts = {};
      allProducts.forEach(p => {
        const source = p.externalSource || 'NOT_SET';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      
      res.status(200).json({
        success: true,
        shopId,
        totalProducts: allProducts.length,
        importedCount: importedProducts.length,
        manualCount: manualProducts.length,
        externalSourceCounts: sourceCounts,
        importedProducts: importedProducts.slice(0, 10),
        manualProducts: manualProducts.slice(0, 10)
      });
    } catch (error) {
      console.error("[DEBUG] Error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

// 7. Fix imported products (migration endpoint)
router.post(
  "/fix-imported-products/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId } = req.params;
      
      console.log(`[FIX] Fixing imported products for shop: ${shopId}`);
      
      // Find products with externalId but not marked as imported
      const result = await Product.updateMany(
        { 
          shopId, 
          externalId: { $exists: true, $ne: null },
          $or: [
            { isImported: { $exists: false } },
            { isImported: false },
            { isImported: { $ne: true } }
          ]
        },
        { 
          $set: { 
            isImported: true,
            externalSource: 'IMPORTED',
            'importData.importedAt': new Date(),
            'importData.markupPercentage': 30,
            'importData.sourceId': '$externalId'
          } 
        }
      );
      
      // Also mark products with externalSource as IMPORTED but not marked as imported
      const result2 = await Product.updateMany(
        { 
          shopId, 
          externalSource: { $in: ['IMPORTED', 'IMPORT', 'EXTERNAL', 'MOCK', 'API'] },
          isImported: { $ne: true }
        },
        { 
          $set: { 
            isImported: true 
          } 
        }
      );
      
      const totalFixed = result.modifiedCount + result2.modifiedCount;
      
      console.log(`[FIX] Fixed ${totalFixed} products`);
      
      // Refresh the product list
      const updatedProducts = await Product.find({ shopId }).lean();
      const importedCount = updatedProducts.filter(p => p.isImported === true).length;
      
      res.status(200).json({
        success: true,
        message: `Fixed ${totalFixed} products to be marked as imported`,
        results: {
          fixedByExternalId: result.modifiedCount,
          fixedByExternalSource: result2.modifiedCount,
          totalFixed: totalFixed,
          currentImportedCount: importedCount,
          totalProducts: updatedProducts.length
        }
      });
      
    } catch (error) {
      console.error("[FIX] Error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

// 8. Get imported products only
router.get(
  "/imported-products/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const skip = (page - 1) * limit;
      
      const importedProducts = await Product.find({ 
        shopId, 
        isImported: true 
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const totalImported = await Product.countDocuments({ 
        shopId, 
        isImported: true 
      });
      
      res.status(200).json({
        success: true,
        importedProducts,
        total: totalImported,
        page: parseInt(page),
        pages: Math.ceil(totalImported / limit),
        message: "Imported products fetched successfully"
      });
    } catch (error) {
      console.error("[IMPORTED] Error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

// 9. Test endpoint
router.get(
  "/test-import-connection",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.status(200).json({
        success: true,
        message: "Product import API is working correctly",
        timestamp: new Date().toISOString(),
        endpoints: {
          fetchExternal: "GET /api/v2/product/fetch-external",
          bulkImport: "POST /api/v2/product/bulk-import-external",
          importSingle: "POST /api/v2/product/import-external",
          getCategories: "GET /api/v2/product/import-categories",
          getImported: "GET /api/v2/product/imported-products/:shopId",
          debug: "GET /api/v2/product/debug/check-products/:shopId",
          fix: "POST /api/v2/product/fix-imported-products/:shopId",
          getAllProducts: "GET /api/v2/product/get-all-products?shopId=YOUR_SHOP_ID",
          getAllProductsShop: "GET /api/v2/product/get-all-products-shop/:shopId",
          createProduct: "POST /api/v2/product/create-product",
          stats: "GET /api/v2/product/stats/:shopId"
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

// 10. Admin: Get all products from all shops
router.get(
  "/admin-get-all-products",
  isAdmin,
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("[ADMIN] Getting all products from all shops");
      
      const { page = 1, limit = 50, shopId, category, search } = req.query;
      const skip = (page - 1) * limit;
      
      // Build query
      const query = {};
      if (shopId) query.shopId = shopId;
      if (category && category !== 'All') query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('shop', 'name email')
        .lean();
      
      const total = await Product.countDocuments(query);
      
      const importedCount = await Product.countDocuments({ ...query, isImported: true });
      const manualCount = await Product.countDocuments({ ...query, isImported: false });
      
      res.status(200).json({
        success: true,
        products: products || [],
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        statistics: {
          total,
          imported: importedCount,
          manual: manualCount
        },
        message: "All products retrieved successfully (admin view)"
      });
    } catch (error) {
      console.error("[ADMIN] Error getting all products:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get all products",
        error: error.message
      });
    }
  })
);

// ========== ADDITIONAL UTILITY ENDPOINTS ==========

// 11. Delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      
      console.log(`[DELETE] Deleting product: ${productId}`);
      
      const product = await Product.findById(productId);
      
      if (!product) {
        return next(new ErrorHandler("Product not found with this id!", 400));
      }

      // Delete images from server
      product.images.forEach((image) => {
        const filename = image;
        const filePath = `uploads/${filename}`;
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DELETE] Deleted image: ${filename}`);
        }
      });

      await Product.findByIdAndDelete(productId);
      
      // Update shop's product count
      await Shop.findByIdAndUpdate(product.shopId, { $inc: { totalProducts: -1 } });

      res.status(200).json({
        success: true,
        message: "Product deleted successfully!",
        productId
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// 12. Update product
router.put(
  "/update-product/:id",
  isSeller,
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      const productData = req.body;
      
      console.log(`[UPDATE] Updating product: ${productId}`);
      
      const product = await Product.findById(productId);
      
      if (!product) {
        return next(new ErrorHandler("Product not found with this id!", 400));
      }

      // Handle image updates
      if (req.files && req.files.length > 0) {
        // Delete old images
        product.images.forEach((image) => {
          const filename = image;
          const filePath = `uploads/${filename}`;
          
          if (fs.existsSync(filePath) && filename !== "default-product.jpg") {
            fs.unlinkSync(filePath);
            console.log(`[UPDATE] Deleted old image: ${filename}`);
          }
        });
        
        // Add new images
        const imageUrls = req.files.map((file) => `${file.filename}`);
        productData.images = imageUrls;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        productData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        product: updatedProduct,
        message: "Product updated successfully!"
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// 13. Get single product details
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productId = req.params.id;
      
      console.log(`[GET] Getting product details: ${productId}`);
      
      const product = await Product.findById(productId).lean();
      
      if (!product) {
        return next(new ErrorHandler("Product not found with this id!", 400));
      }

      res.status(200).json({
        success: true,
        product,
        message: "Product details fetched successfully"
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// 14. Get all products for homepage (public)
router.get(
  "/get-all-products-public",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { page = 1, limit = 20, category, search } = req.query;
      const skip = (page - 1) * limit;
      
      // Build query for active products only
      const query = { stock: { $gt: 0 } };
      if (category && category !== 'All') query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('shop', 'name avatar')
        .lean();
      
      const total = await Product.countDocuments(query);
      
      res.status(200).json({
        success: true,
        products: products || [],
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        message: "Products fetched successfully for public view"
      });
    } catch (error) {
      console.error("[PUBLIC] Error getting products:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// 15. Check API health
router.get(
  "/health",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productCount = await Product.countDocuments();
      const shopCount = await Shop.countDocuments();
      
      res.status(200).json({
        success: true,
        message: "Product API is healthy",
        timestamp: new Date().toISOString(),
        statistics: {
          totalProducts: productCount,
          totalShops: shopCount
        },
        routes: {
          getAllProducts: "/api/v2/product/get-all-products?shopId=YOUR_SHOP_ID",
          getAllProductsShop: "/api/v2/product/get-all-products-shop/:shopId",
          createProduct: "/api/v2/product/create-product",
          bulkImport: "/api/v2/product/bulk-import-external",
          fetchExternal: "/api/v2/product/fetch-external"
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  })
);

module.exports = router;