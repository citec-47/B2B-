const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
    trim: true,
    maxlength: [200, "Product name cannot exceed 200 characters!"]
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
    trim: true
  },
  category: {
    type: String,
    required: [true, "Please enter your product category!"],
    trim: true
  },
  originalPrice: {
    type: Number,
    min: [0, "Price cannot be negative!"]
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
    min: [0, "Price cannot be negative!"]
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
    min: [0, "Stock cannot be negative!"],
    default: 0
  },
  images: [
    {
      type: String,
      required: [true, "Please upload product images!"]
    }
  ],
  reviews: [
    {
      user: {
        type: Object,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true,
        trim: true
      },
      productId: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  shopId: {
    type: String,
    required: [true, "Shop ID is required!"]
  },
  shop: {
    type: Object,
    required: [true, "Shop information is required!"]
  },
  sold_out: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: {
    type: String,
    trim: true
  },
  
  // Import specific fields
  externalId: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  externalSource: {
    type: String,
    default: 'MANUAL',
    trim: true
  },
  externalUrl: {
    type: String,
    trim: true
  },
  isImported: {
    type: Boolean,
    default: false,
    required: true
  },
  importData: {
    originalCost: {
      type: Number,
      min: 0
    },
    importedAt: {
      type: Date,
      default: Date.now
    },
    markupPercentage: {
      type: Number,
      min: 0,
      max: 500
    },
    sourceId: {
      type: String,
      trim: true
    }
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  brand: {
    type: String,
    trim: true
  },
  features: {
    type: [String],
    default: []
  },
  dimensions: {
    weight: String,
    height: String,
    width: String,
    length: String
  },
  warranty: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit calculation
productSchema.virtual('profit').get(function() {
  if (this.importData && this.importData.originalCost) {
    return this.discountPrice - this.importData.originalCost;
  }
  return 0;
});

// Indexes for better performance
productSchema.index({ shopId: 1, isImported: 1 });
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ shopId: 1, category: 1 });
productSchema.index({ shopId: 1, createdAt: -1 });
productSchema.index({ externalId: 1 }, { sparse: true, unique: true });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Middleware to ensure imported products have proper data
productSchema.pre('save', function(next) {
  if (this.isImported) {
    // Ensure externalId exists for imported products
    if (!this.externalId) {
      this.externalId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set externalSource if not provided
    if (!this.externalSource || this.externalSource === 'MANUAL') {
      this.externalSource = 'IMPORTED';
    }
    
    // Ensure importData exists
    if (!this.importData) {
      this.importData = {};
    }
    
    if (!this.importData.importedAt) {
      this.importData.importedAt = new Date();
    }
  } else {
    // Manual products should not have external data
    if (!this.externalId) {
      this.externalId = undefined;
    }
    this.externalSource = 'MANUAL';
  }
  
  next();
});

// Static method to count imported vs manual products
productSchema.statics.getProductStats = async function(shopId) {
  const stats = await this.aggregate([
    { $match: { shopId } },
    {
      $group: {
        _id: '$isImported',
        count: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        totalValue: { $sum: '$discountPrice' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    imported: 0,
    manual: 0,
    inStock: 0,
    outOfStock: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    if (stat._id === true) {
      result.imported = stat.count;
    } else {
      result.manual = stat.count;
    }
  });
  
  return result;
};

module.exports = mongoose.model("Product", productSchema);