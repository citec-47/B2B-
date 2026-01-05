const express = require("express");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isSeller } = require("../middleware/auth");
const router = express.Router();

// Generate mock products
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
    
    const costPrice = Math.random() * 500 + 5;
    const originalPrice = costPrice * (1.3 + Math.random() * 0.7);
    
    products.push({
      externalId: `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
      name: `${brand} ${category} Product ${i + 1}`,
      description: `Premium quality ${category.toLowerCase()} from ${brand}. Features include high-end materials and excellent durability.`,
      category,
      originalPrice: parseFloat(originalPrice.toFixed(2)),
      discountPrice: parseFloat(costPrice.toFixed(2)),
      stock: Math.floor(Math.random() * 500) + 10,
      images: [
        `https://source.unsplash.com/400x400/?${category.toLowerCase().replace(/\s+/g, '')}`,
        `https://source.unsplash.com/400x400/?product`,
        `https://source.unsplash.com/400x400/?${brand.toLowerCase()}`
      ],
      externalSource: "MOCK",
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

// 1. Fetch external products
router.get(
  "/fetch-external",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        category = "",
        search = "",
        page = 1,
        limit = 20,
      } = req.query;

      console.log(`[API] Fetching products: category=${category}, search=${search}, page=${page}`);

      // Use mock data
      let products = generateMockProducts(500);
      
      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower)
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
        source: "MOCK_DATA",
        categories: ["All", ...allCategories],
        message: `${paginatedProducts.length} products fetched successfully`
      });

    } catch (error) {
      console.error("[API Error] Fetching external products:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch external products",
        error: error.message,
      });
    }
  })
);

// 2. Get categories
router.get(
  "/categories",
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
        message: "Categories fetched successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
        error: error.message,
      });
    }
  })
);

// 3. Import single product
router.post(
  "/import",
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
      } = req.body;

      console.log("[API] Importing product:", { name, shopId });

      // For now, just simulate success
      res.status(201).json({
        success: true,
        product: {
          _id: `imported-${Date.now()}`,
          name,
          description,
          category,
          originalPrice,
          discountPrice: discountPrice * (1 + markupPercentage / 100),
          stock,
          images,
          shopId,
          isImported: true,
          createdAt: new Date()
        },
        message: "Product imported successfully!",
        pricing: {
          costPrice: discountPrice,
          sellingPrice: discountPrice * (1 + markupPercentage / 100),
          markupPercentage,
          profit: discountPrice * (markupPercentage / 100)
        }
      });

    } catch (error) {
      console.error("[API Error] Import product:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import product",
        error: error.message,
      });
    }
  })
);

// 4. Bulk import
router.post(
  "/bulk-import",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { 
        products, 
        shopId, 
        markupPercentage = 30 
      } = req.body;

      console.log(`[API] Bulk import: ${products?.length || 0} products for shop ${shopId}`);

      // Simulate import
      res.status(201).json({
        success: true,
        message: `Successfully imported ${products?.length || 0} products!`,
        results: {
          imported: products?.length || 0,
          failed: 0,
          skipped: 0
        }
      });

    } catch (error) {
      console.error("[API Error] Bulk import:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import products",
        error: error.message,
      });
    }
  })
);

module.exports = router;