// Migration script: MongoDB to Firebase
require('dotenv').config();
const mongoose = require('mongoose');
const { db } = require('./config/firebase-config');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Models (from your current schema)
const ShopSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  address: String,
  phoneNumber: String,
  zipCode: String,
  avatar: String,
  isActive: Boolean,
  role: String,
  availableBalance: Number,
  lockedBalance: Number,
  totalSales: Number,
  ratings: Number,
  description: String,
  category: String,
  totalProducts: Number,
  withdrawMethod: Object,
  transactions: Array,
  createdAt: Date,
  updatedAt: Date
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  isActive: Boolean,
  role: String,
  addresses: Array,
  phoneNumber: String,
  createdAt: Date,
  updatedAt: Date
});

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  originalPrice: Number,
  discountPrice: Number,
  stock: Number,
  images: Array,
  shopId: String,
  shop: Object,
  sold_out: Number,
  isImported: Boolean,
  externalId: String,
  externalSource: String,
  tags: String,
  brand: String,
  specifications: Object,
  importData: Object,
  reviews: Array,
  ratings: Number,
  createdAt: Date,
  updatedAt: Date
});

const Shop = mongoose.model('Shop', ShopSchema);
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);

async function migrate() {
  console.log('🚀 Starting migration from MongoDB to Firebase...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Migrate Users
    console.log('\n📦 Migrating users...');
    const users = await User.find({});
    for (const user of users) {
      const userData = user.toObject();
      delete userData._id;
      delete userData.__v;
      
      await db.collection('users').doc(user._id.toString()).set({
        ...userData,
        id: user._id.toString(),
        createdAt: userData.createdAt ? userData.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: userData.updatedAt ? userData.updatedAt.toISOString() : new Date().toISOString()
      });
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migrate Shops
    console.log('\n🏪 Migrating shops...');
    const shops = await Shop.find({});
    for (const shop of shops) {
      const shopData = shop.toObject();
      delete shopData._id;
      delete shopData.__v;
      
      await db.collection('shops').doc(shop._id.toString()).set({
        ...shopData,
        id: shop._id.toString(),
        createdAt: shopData.createdAt ? shopData.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: shopData.updatedAt ? shopData.updatedAt.toISOString() : new Date().toISOString()
      });
    }
    console.log(`✅ Migrated ${shops.length} shops`);
    
    // Migrate Products
    console.log('\n🛍️ Migrating products...');
    const products = await Product.find({});
    for (const product of products) {
      const productData = product.toObject();
      delete productData._id;
      delete productData.__v;
      
      await db.collection('products').doc(product._id.toString()).set({
        ...productData,
        id: product._id.toString(),
        createdAt: productData.createdAt ? productData.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: productData.updatedAt ? productData.updatedAt.toISOString() : new Date().toISOString()
      });
    }
    console.log(`✅ Migrated ${products.length} products`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`• Users: ${users.length}`);
    console.log(`• Shops: ${shops.length}`);
    console.log(`• Products: ${products.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();