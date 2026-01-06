// server.js - COMPLETE UPDATED VERSION
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== DATABASE CONNECTION ====================
let dbConnected = false;

const connectDatabase = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('❌ MONGODB_URI is not defined in .env file');
    }
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    mongoose.set('strictQuery', true);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 50000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    dbConnected = true;
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    return false;
  }
};

// Initialize database connection
(async () => {
  dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.log('⚠️  Server will run with limited functionality');
  }
})();

// ==================== EMAIL CONFIGURATION ====================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️  Email server not configured properly:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

const sendMail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'E-Commerce <noreply@ecommerce.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

// ==================== MONGODB MODELS ====================
const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  zipCode: { type: String, required: true },
  avatar: { type: String, default: 'default-shop.jpg' },
  isActive: { type: Boolean, default: false },
  role: { type: String, default: 'Seller' },
  availableBalance: { type: Number, default: 0 },
  lockedBalance: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  ratings: { type: Number, default: 0 },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  totalProducts: { type: Number, default: 0 },
  withdrawMethod: { 
    type: Object,
    default: null
  },
  transections: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'default-avatar.jpg' },
  isActive: { type: Boolean, default: false },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  addresses: { type: Array, default: [] },
  phoneNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  stock: { type: Number, required: true },
  images: { type: Array, required: true },
  shopId: { type: String, required: true },
  shop: { 
    _id: String,
    name: String,
    email: String,
    avatar: String
  },
  sold_out: { type: Number, default: 0 },
  isImported: { type: Boolean, default: false },
  externalId: { type: String, default: null },
  externalSource: { type: String, default: null },
  tags: { type: String, default: '' },
  brand: { type: String, default: '' },
  specifications: { type: Object, default: {} },
  importData: { type: Object, default: {} },
  reviews: { type: Array, default: [] },
  ratings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  cart: { type: Array, required: true },
  shippingAddress: { type: Object, required: true },
  user: { type: Object, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'Processing',
    enum: ['Processing', 'Transferred to delivery partner', 'Shipping', 'Received', 'On the way', 'Delivered', 'Cancelled', 'Refund Requested', 'Refund Success']
  },
  paymentInfo: { 
    id: String,
    status: { type: String, default: 'Pending' },
    type: String
  },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  stock: { type: Number, required: true },
  images: { type: Array, required: true },
  shopId: { type: String, required: true },
  shop: { type: Object, required: true },
  sold_out: { type: Number, default: 0 },
  start_Date: { type: Date, required: true },
  finish_Date: { type: Date, required: true },
  status: { type: String, default: 'Running' },
  reviews: { type: Array, default: [] },
  ratings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const WithdrawSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'completed', 'rejected']
  },
  withdrawMethod: { type: Object, required: true },
  adminNote: { type: String, default: '' },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', WithdrawSchema);

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
app.use('/uploads', express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`);
  next();
});

// ==================== HELPER FUNCTIONS ====================
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Auth middleware
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.user_token || req.cookies.seller_token || 
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      req.user = user;
      return next();
    } else if (decoded.type === 'shop') {
      const shop = await Shop.findById(decoded.id);
      if (!shop) {
        return res.status(401).json({
          success: false,
          message: 'Shop not found'
        });
      }
      req.seller = shop;
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token type'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const isSeller = async (req, res, next) => {
  if (!req.seller) {
    return res.status(401).json({
      success: false,
      message: 'Seller access required'
    });
  }
  next();
};

const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
};

// ==================== MULTER CONFIG ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// ==================== ROUTES ====================

// HEALTH & STATUS
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV,
    version: '2.0.0'
  });
});

app.get('/api/v2/db/status', (req, res) => {
  res.json({
    success: true,
    database: {
      connected: dbConnected,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    }
  });
});

// CREATE DEFAULT ADMIN USER
app.post('/api/v2/setup/admin', catchAsyncErrors(async (req, res) => {
  if (!dbConnected) {
    return res.status(500).json({
      success: false,
      message: 'Database not connected'
    });
  }
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecommerce.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    return res.json({
      success: true,
      message: 'Admin user already exists',
      user: existingAdmin
    });
  }
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = await User.create({
    name: 'Administrator',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
    avatar: 'default-avatar.jpg'
  });
  
  res.json({
    success: true,
    message: 'Admin user created successfully',
    user: {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    },
    login: {
      email: adminEmail,
      password: adminPassword
    }
  });
}));

// USER ROUTES
app.post('/api/v2/user/create-user', upload.single('file'), catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return next(new ErrorHandler('Please provide all fields', 400));
    }
    
    if (!dbConnected) {
      return next(new ErrorHandler('Database not available', 503));
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (req.file) {
        fs.unlinkSync(`uploads/${req.file.filename}`);
      }
      return next(new ErrorHandler('User already exists', 400));
    }
    
    const fileUrl = req.file ? req.file.filename : 'default-avatar.jpg';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: fileUrl,
      isActive: false
    });
    
    const activationToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        type: 'user' 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '5m' }
    );
    
    const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activation/${activationToken}`;
    
    await sendMail({
      email: user.email,
      subject: 'Activate Your Account',
      message: `Hello ${name},\n\nPlease click on the link to activate your account:\n\n${activationUrl}\n\nThis link will expire in 5 minutes.`
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully! Check your email for activation.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(`uploads/${req.file.filename}`);
    }
    next(new ErrorHandler(error.message, 500));
  }
}));

app.post('/api/v2/user/activation', catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;
    
    if (!activation_token) {
      return next(new ErrorHandler('Activation token is required', 400));
    }
    
    const decoded = jwt.verify(activation_token, process.env.JWT_SECRET_KEY);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }
    
    if (user.isActive) {
      return next(new ErrorHandler('User already activated', 400));
    }
    
    user.isActive = true;
    await user.save();
    
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        type: 'user',
        role: user.role 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );
    
    res.cookie('user_token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.status(201).json({
      success: true,
      message: 'Account activated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
}));

app.post('/api/v2/user/login-user', catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new ErrorHandler('Please provide email and password', 400));
    }
    
    if (!dbConnected) {
      return next(new ErrorHandler('Database not available', 503));
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorHandler("User doesn't exist", 400));
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new ErrorHandler('Incorrect password', 400));
    }
    
    if (!user.isActive) {
      return next(new ErrorHandler('Please activate your account first', 400));
    }
    
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        type: 'user',
        role: user.role 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );
    
    res.cookie('user_token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber
      },
      token
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/user/getuser', isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler('User not found', 404));
    }
    
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/user/logout', catchAsyncErrors(async (req, res) => {
  res.cookie('user_token', null, { 
    expires: new Date(Date.now()),
    httpOnly: true 
  });
  
  res.status(200).json({
    success: true,
    message: 'Logout successful!'
  });
}));

// SHOP ROUTES
app.post('/api/v2/shop/create-shop', upload.single('file'), catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password, address, phoneNumber, zipCode } = req.body;
    
    if (!name || !email || !password || !address || !phoneNumber || !zipCode) {
      return next(new ErrorHandler('Please provide all fields', 400));
    }
    
    if (!dbConnected) {
      return next(new ErrorHandler('Database not available', 503));
    }
    
    const shopExists = await Shop.findOne({ email });
    if (shopExists) {
      if (req.file) {
        fs.unlinkSync(`uploads/${req.file.filename}`);
      }
      return next(new ErrorHandler('Shop already exists', 400));
    }
    
    const avatar = req.file ? req.file.filename : 'default-shop.jpg';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const shop = await Shop.create({
      name,
      email,
      password: hashedPassword,
      address,
      phoneNumber,
      zipCode,
      avatar,
      isActive: false
    });
    
    const activationToken = jwt.sign(
      { 
        id: shop._id, 
        email: shop.email, 
        name: shop.name,
        type: 'shop' 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '10m' }
    );
    
    const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/activation/${activationToken}`;
    
    await sendMail({
      email: shop.email,
      subject: 'Activate Your Shop',
      message: `Hello ${name},\n\nPlease click on the link to activate your shop:\n\n${activationUrl}\n\nThis link will expire in 10 minutes.`
    });
    
    res.status(201).json({
      success: true,
      message: 'Shop created successfully! Check your email for activation.',
      shop: {
        id: shop._id,
        name: shop.name,
        email: shop.email
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(`uploads/${req.file.filename}`);
    }
    next(new ErrorHandler(error.message, 500));
  }
}));

app.post('/api/v2/shop/activation', catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;
    
    if (!activation_token) {
      return next(new ErrorHandler('Activation token is required', 400));
    }
    
    const decoded = jwt.verify(activation_token, process.env.JWT_SECRET_KEY);
    
    const shop = await Shop.findById(decoded.id);
    if (!shop) {
      return next(new ErrorHandler('Shop not found', 404));
    }
    
    if (shop.isActive) {
      return next(new ErrorHandler('Shop already activated', 400));
    }
    
    shop.isActive = true;
    await shop.save();
    
    const token = jwt.sign(
      { 
        id: shop._id, 
        email: shop.email, 
        type: 'shop',
        role: shop.role 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );
    
    res.cookie('seller_token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.status(201).json({
      success: true,
      message: 'Shop activated successfully!',
      seller: shop,
      token
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
}));

app.post('/api/v2/shop/login-shop', catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new ErrorHandler('Please provide email and password', 400));
    }
    
    if (!dbConnected) {
      return next(new ErrorHandler('Database not available', 503));
    }
    
    const shop = await Shop.findOne({ email }).select('+password');
    if (!shop) {
      return next(new ErrorHandler("Shop doesn't exist", 400));
    }
    
    const isPasswordValid = await bcrypt.compare(password, shop.password);
    if (!isPasswordValid) {
      return next(new ErrorHandler('Incorrect password', 400));
    }
    
    if (!shop.isActive) {
      return next(new ErrorHandler('Please activate your shop first', 400));
    }
    
    const token = jwt.sign(
      { 
        id: shop._id, 
        email: shop.email, 
        type: 'shop',
        role: shop.role 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );
    
    res.cookie('seller_token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      seller: shop,
      token
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/shop/getSeller', isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.seller) {
      return next(new ErrorHandler('Seller not found', 404));
    }
    
    res.status(200).json({
      success: true,
      seller: req.seller
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/shop/logout', catchAsyncErrors(async (req, res) => {
  res.cookie('seller_token', null, { 
    expires: new Date(Date.now()),
    httpOnly: true 
  });
  
  res.status(200).json({
    success: true,
    message: 'Logout successful!'
  });
}));

app.get('/api/v2/shop/admin-all-sellers', isAuthenticated, isAdmin, catchAsyncErrors(async (req, res, next) => {
  try {
    const sellers = await Shop.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      sellers
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

// PRODUCT ROUTES
app.post('/api/v2/product/create-product', upload.array('images'), catchAsyncErrors(async (req, res, next) => {
  try {
    const shopId = req.body.shopId;
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return next(new ErrorHandler('Shop not found', 400));
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return next(new ErrorHandler('Please upload product images', 400));
    }

    const imageUrls = files.map((file) => `${file.filename}`);

    const productData = {
      ...req.body,
      images: imageUrls,
      shop: {
        _id: shop._id,
        name: shop.name,
        email: shop.email,
        avatar: shop.avatar || 'default-shop.jpg'
      },
      isImported: false
    };

    const requiredFields = ['name', 'description', 'category', 'discountPrice', 'stock'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return next(new ErrorHandler(`Please enter product ${field}`, 400));
      }
    }

    const product = await Product.create(productData);

    await Shop.findByIdAndUpdate(shopId, { $inc: { totalProducts: 1 } });

    res.status(201).json({
      success: true,
      product,
      message: 'Product created successfully!'
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
}));

// FIXED: Get all products of a shop
app.get('/api/v2/product/get-all-products-shop/:id', catchAsyncErrors(async (req, res, next) => {
  try {
    const shopId = req.params.id;
    console.log(`[API] Fetching products for shop: ${shopId}`);
    
    let products = [];
    
    // Try multiple ways to find products
    products = await Product.find({ shopId: shopId })
      .sort({ createdAt: -1 })
      .lean();
    
    if (products.length === 0) {
      products = await Product.find({ 'shop._id': shopId })
        .sort({ createdAt: -1 })
        .lean();
    }
    
    console.log(`[API] Found ${products.length} products`);
    
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
      }
    });
  } catch (error) {
    console.error(`[API] Error:`, error);
    next(new ErrorHandler(error.message, 400));
  }
}));

// Get all products (public)
app.get('/api/v2/product/get-all-products-public', catchAsyncErrors(async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { stock: { $gt: 0 } };
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      products: products || [],
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
}));

// PRODUCT IMPORT ROUTES
const generateMockProducts = (count = 100) => {
  const products = [];
  const categories = [
    "Electronics", "Mobile Phones", "Laptops", "Tablets", 
    "Smart Watches", "Headphones", "Speakers", "Cameras",
    "Fashion", "Men's Clothing", "Women's Clothing", "Shoes",
    "Home & Kitchen", "Furniture", "Home Decor", "Kitchen Appliances"
  ];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const costPrice = parseFloat((Math.random() * 500 + 5).toFixed(2));
    const originalPrice = parseFloat((costPrice * (1.3 + Math.random() * 0.7)).toFixed(2));
    
    products.push({
      externalId: `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
      name: `${category} Product ${i + 1}`,
      description: `Premium quality ${category.toLowerCase()}. Features include high-end materials and excellent durability.`,
      category,
      originalPrice,
      discountPrice: costPrice,
      stock: Math.floor(Math.random() * 500) + 10,
      images: ["default-product.jpg"],
      externalSource: "MOCK_API",
      tags: "Best Seller,New Arrival",
      brand: "Generic",
      specifications: {
        brand: "Generic",
        model: `MOD-${Math.floor(Math.random() * 10000)}`,
        weight: `${(Math.random() * 5 + 0.1).toFixed(1)}kg`
      },
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 1000)
    });
  }
  
  return products;
};

// Fetch external products
app.get('/api/v2/product/fetch-external', isSeller, catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      category = "",
      search = "",
      page = 1,
      limit = 12,
    } = req.query;

    console.log(`[IMPORT] Fetching external products`);

    let products = generateMockProducts(100);
    
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );
    }
    
    if (category && category !== "All") {
      products = products.filter(p => p.category === category);
    }
    
    const allCategories = [...new Set(products.map(p => p.category))].sort();
    
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedProducts = products.slice(start, end);
    
    res.status(200).json({
      success: true,
      products: paginatedProducts,
      total: products.length,
      page: parseInt(page),
      pages: Math.ceil(products.length / limit),
      categories: ["All", ...allCategories]
    });

  } catch (error) {
    console.error("[IMPORT] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch external products",
      error: error.message,
    });
  }
}));

// Import categories
app.get('/api/v2/product/import-categories', isSeller, catchAsyncErrors(async (req, res, next) => {
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
      "Health Supplements"
    ];

    res.status(200).json({
      success: true,
      categories,
      message: "Import categories fetched successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
}));

// Bulk import products
app.post('/api/v2/product/bulk-import-external', isSeller, catchAsyncErrors(async (req, res, next) => {
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

    for (let i = 0; i < products.length; i++) {
      const extProduct = products[i];
      try {
        console.log(`[BULK IMPORT ${i + 1}/${products.length}] Processing: ${extProduct.name}`);
        
        if (!extProduct.name || !extProduct.category) {
          throw new Error("Product name and category are required");
        }

        const costPrice = parseFloat(extProduct.discountPrice || 10);
        const sellingPrice = parseFloat((costPrice * (1 + (markupPercentage / 100))).toFixed(2));
        
        const uniqueId = extProduct.externalId || 
          `bulk-import-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        
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
            avatar: shop.avatar || "default-shop.jpg"
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

        console.log(`[BULK IMPORT] Creating product: ${productData.name}`);
        
        const product = await Product.create(productData);
        
        console.log(`[BULK IMPORT] Created product ID: ${product._id}`);
        
        importedProducts.push({
          id: product._id,
          name: product.name,
          price: product.discountPrice,
          isImported: product.isImported
        });

      } catch (productError) {
        console.error(`[BULK IMPORT] Failed to import product ${i + 1}:`, productError.message);
        
        failed.push({
          index: i + 1,
          name: extProduct.name || `Product ${i + 1}`,
          error: productError.message
        });
      }
    }

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
      error: error.message
    });
  }
}));

// ORDER ROUTES
app.post('/api/v2/order/create-order', catchAsyncErrors(async (req, res, next) => {
  try {
    const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

    const shopItemsMap = new Map();

    for (const item of cart) {
      const shopId = item.shopId;
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId).push(item);
    }

    const orders = [];

    for (const [shopId, items] of shopItemsMap) {
      const order = await Order.create({
        cart: items,
        shippingAddress,
        user,
        totalPrice,
        paymentInfo,
      });
      orders.push(order);
    }

    res.status(201).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/order/get-all-orders/:userId', catchAsyncErrors(async (req, res, next) => {
  try {
    const orders = await Order.find({ "user._id": req.params.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/order/get-seller-all-orders/:shopId', catchAsyncErrors(async (req, res, next) => {
  try {
    const orders = await Order.find({
      "cart.shopId": req.params.shopId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
}));

// WITHDRAW ROUTES
app.post('/api/v2/withdraw/create-withdraw-request', isSeller, catchAsyncErrors(async (req, res, next) => {
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

    if (!seller.withdrawMethod) {
      console.error("❌ No withdrawal method set for seller:", seller.name);
      return next(new ErrorHandler("Please set up your withdrawal method first", 400));
    }

    console.log("📝 Withdraw method:", seller.withdrawMethod.type);

    if (seller.withdrawMethod.type !== "bank" && seller.withdrawMethod.type !== "binance") {
      return next(new ErrorHandler("Invalid withdrawal method", 400));
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

    seller.availableBalance -= amount;
    seller.lockedBalance = (seller.lockedBalance || 0) + amount;
    
    seller.transections.push({
      amount: -amount,
      status: "Withdraw Requested (Pending)",
      createdAt: new Date(),
    });

    await seller.save();
    console.log("✅ Seller balance updated.");

    await sendMail({
      email: seller.email,
      subject: "Withdraw Request Submitted",
      message: `Hello ${seller.name},\n\nYour withdrawal request of $${amount} has been submitted successfully and is pending admin approval.`
    });

    if (process.env.ADMIN_EMAIL) {
      await sendMail({
        email: process.env.ADMIN_EMAIL,
        subject: "New Withdrawal Request",
        message: `New withdrawal request received:\n\nSeller: ${seller.name} (${seller.email})\nAmount: $${amount}\nRequest ID: ${withdraw._id}`
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
    next(new ErrorHandler(error.message, 500));
  }
}));

app.get('/api/v2/withdraw/get-all-withdraw-request', isAuthenticated, isAdmin, catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("📋 ADMIN: Fetching all withdrawal requests...");
    
    const withdraws = await Withdraw.find()
      .populate("seller", "name email avatar availableBalance withdrawMethod")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${withdraws.length} withdrawal requests`);

    res.status(200).json({
      success: true,
      withdraws,
    });
  } catch (error) {
    console.error("❌ Error fetching withdrawals:", error);
    next(new ErrorHandler(error.message, 500));
  }
}));

// PAYMENT ROUTES
app.post('/api/v2/payment/process', catchAsyncErrors(async (req, res, next) => {
  const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    metadata: {
      company: "E-Commerce",
    },
  });
  res.status(200).json({
    success: true,
    client_secret: myPayment.client_secret,
  });
}));

app.get('/api/v2/payment/stripeapikey', catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
}));

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
  ================================================
  🚀 E-COMMERCE BACKEND API V2.0
  ================================================
  ✅ Server running on port: ${PORT}
  ✅ URL: http://localhost:${PORT}
  ✅ Environment: ${process.env.NODE_ENV}
  ✅ Database: ${dbConnected ? 'Connected ✅' : 'Disconnected ❌'}
  ================================================
  `);
});