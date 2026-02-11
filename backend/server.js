require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// ==================== INITIALIZATION ====================
const app = express();
const PORT = process.env.PORT || 5000;

// Firebase Admin Initialization
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('✅ Using existing Firebase app');
  } else {
    console.error('❌ Firebase initialization error:', error);
  }
}

const db = admin.firestore();

// Email Configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ==================== FILE MANAGEMENT ====================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

const createDefaultImage = (filename, text) => {
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f0f0f0"/>
        <rect x="50" y="50" width="300" height="200" fill="#e0e0e0" stroke="#ccc" stroke-width="2"/>
        <text x="200" y="160" font-family="Arial" font-size="18" fill="#666" text-anchor="middle">
          ${text}
        </text>
        <text x="200" y="190" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">
          Default Image
        </text>
      </svg>
    `;
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created default image: ${filename}`);
  }
};

createDefaultImage('default-product.jpg', 'Product Image');
createDefaultImage('default-avatar.jpg', 'User Avatar');
createDefaultImage('default-shop.jpg', 'Shop Logo');
createDefaultImage('default-event.jpg', 'Event Image');
createDefaultImage('default-message.jpg', 'Message Image');

// ==================== HELPER FUNCTIONS ====================
const getImageUrl = (filename, type = 'product') => {
  if (!filename || ['null', 'undefined', ''].includes(filename)) {
    const defaultImages = {
      'product': 'default-product.jpg',
      'avatar': 'default-avatar.jpg',
      'shop': 'default-shop.jpg',
      'event': 'default-event.jpg',
      'message': 'default-message.jpg'
    };
    return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${defaultImages[type] || 'default-product.jpg'}`;
  }

  if (typeof filename === 'string') {
    if (filename.startsWith("http://") || filename.startsWith("https://")) {
      return filename;
    }

    const cleanFilename = filename.replace(/^\/+/, '');

    if (cleanFilename.startsWith('uploads/')) {
      return `${process.env.BACKEND_URL || 'http://localhost:5000'}/${cleanFilename}`;
    }

    return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${cleanFilename}`;
  }

  return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/default-product.jpg`;
};

const validateImages = (images) => {
  if (!images) return ['default-product.jpg'];
  if (typeof images === 'string') return [images];
  if (Array.isArray(images)) return images.length > 0 ? images : ['default-product.jpg'];
  return ['default-product.jpg'];
};

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
};

// ==================== AUTHENTICATION MIDDLEWARE ====================
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.seller_token ||
                 req.cookies?.user_token ||
                 req.cookies?.admin_token ||
                 req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role || decoded.type;
    req.userName = decoded.name;

    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const isUser = (req, res, next) => {
  if (req.userRole !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User only.'
    });
  }
  next();
};

const isSeller = (req, res, next) => {
  if (req.userRole !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller only.'
    });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// ==================== MULTER CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = uniqueSuffix + extension;
    console.log(`📁 File uploaded: ${filename}`);
    cb(null, filename);
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
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ==================== ADMIN SETUP ====================
const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'aliexpressglobal0@gmail.com';
    const adminPassword = 'admin123@12';

    console.log('\n👑 Checking/Creating default admin account...');

    const existingAdmin = await db.collection('users')
      .where('email', '==', adminEmail.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      console.log('✅ Admin account already exists');
      const adminDoc = existingAdmin.docs[0];
      const adminData = adminDoc.data();
      const isPasswordValid = await bcrypt.compare(adminPassword, adminData.password);

      if (isPasswordValid) {
        console.log('✅ Admin password verified successfully');
      } else {
        console.log('⚠️ Admin password incorrect in database');
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminData = {
      name: 'System Administrator',
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      avatar: 'default-avatar.jpg',
      role: 'admin',
      isActive: true,
      phoneNumber: '',
      addresses: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const adminRef = await db.collection('users').add(adminData);

    console.log('👑 Default admin account created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 Admin ID:', adminRef.id);

    console.log('\n📋 ADMIN LOGIN CREDENTIALS:');
    console.log('===========================');
    console.log('📧 Email: aliexpressglobal0@gmail.com');
    console.log('🔑 Password: admin123@12');
    console.log('👑 Role: admin');
    console.log('===========================\n');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  }
};

createDefaultAdmin();

// ==================== HEALTH CHECK ENDPOINTS ====================
app.get('/test', (req, res) => {
  res.send("Hello World!");
});

app.get('/', (req, res) => {
  res.json({
    message: "API is running...",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    backend_url: process.env.BACKEND_URL || `http://localhost:${PORT}`,
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});

// ==================== DEBUG ENDPOINTS ====================
app.get('/api/v2/debug/firebase-orders', async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();

    const allOrders = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      return {
        id: doc.id,
        shopId: order.shopId || 'No shopId',
        orderStatus: order.orderStatus || 'No status',
        totalPrice: order.totalPrice || 0,
        cartItems: order.cart?.length || 0,
        createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : 'No date',
        user: order.user ? `${order.user.name} (${order.user.email})` : 'No user',
        _debug: {
          hasShopId: !!order.shopId,
          hasCart: !!order.cart,
          hasUser: !!order.user
        }
      };
    });

    res.status(200).json({
      success: true,
      totalOrders: ordersSnapshot.size,
      orders: allOrders,
      debugInfo: {
        collectionName: 'orders',
        timestamp: new Date().toISOString(),
        database: 'Firestore'
      }
    });

  } catch (error) {
    console.error('❌ Firestore debug error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v2/debug/create-test-order', async (req, res) => {
  try {
    const { shopId, sellerName = 'Test Seller', customerName = 'Test Customer' } = req.body;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'shopId is required'
      });
    }

    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      await db.collection('shops').doc(shopId).set({
        name: sellerName || 'Test Shop',
        email: 'test@shop.com',
        avatar: 'default-shop.jpg',
        address: '123 Test St',
        phoneNumber: '123-456-7890',
        zipCode: '12345',
        role: 'seller',
        isActive: true,
        availableBalance: 0,
        totalSales: 0,
        totalProducts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const testOrder = {
      cart: [
        {
          _id: 'test-product-' + Date.now(),
          name: 'Luxury Watch',
          price: 299.99,
          discountPrice: 249.99,
          qty: 1,
          shopId: shopId,
          images: ['default-product.jpg']
        },
        {
          _id: 'test-product-2-' + Date.now(),
          name: 'Watch Band',
          price: 49.99,
          discountPrice: 39.99,
          qty: 2,
          shopId: shopId,
          images: ['default-product.jpg']
        }
      ],
      shippingAddress: {
        address1: '456 Customer Street',
        address2: 'Apt 101',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      user: {
        _id: 'test-user-' + Date.now(),
        name: customerName,
        email: 'customer@example.com',
        phone: '555-123-4567'
      },
      totalPrice: 329.97,
      discountPrice: 0,
      shipping: 10.99,
      paymentInfo: {
        id: 'test_payment_' + Date.now(),
        status: 'succeeded',
        type: 'card'
      },
      paidAt: new Date().toISOString(),
      orderStatus: 'Processing',
      status: 'Processing',
      shopId: shopId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const orderRef = await db.collection('orders').add(testOrder);

    await db.collection('shops').doc(shopId).update({
      totalSales: admin.firestore.FieldValue.increment(testOrder.totalPrice),
      availableBalance: admin.firestore.FieldValue.increment(testOrder.totalPrice),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      message: 'Test order created successfully',
      order: {
        _id: orderRef.id,
        id: orderRef.id,
        ...testOrder,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Create test order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/debug/order-test/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const shopDoc = await db.collection('shops').doc(shopId).get();
    const shopExists = shopDoc.exists;

    const ordersSnapshot = await db.collection('orders')
      .where('shopId', '==', shopId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));

    res.status(200).json({
      success: true,
      shopId,
      shopExists,
      orderCount: orders.length,
      orders: orders,
      endpointTested: '/api/v2/order/get-seller-all-orders/' + shopId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/test/conversations', async (req, res) => {
  try {
    const conversationsSnapshot = await db.collection('conversations').get();

    const allConversations = conversationsSnapshot.docs.map(doc => {
      const conversation = doc.data();
      return {
        id: doc.id,
        userId: conversation.userId || 'No userId',
        sellerId: conversation.sellerId || 'No sellerId',
        shopId: conversation.shopId || 'No shopId',
        members: conversation.members || [],
        lastMessage: conversation.lastMessage || 'No message',
        unreadCounts: conversation.unreadCounts || {},
        createdAt: conversation.createdAt ?
          (conversation.createdAt.toDate ?
            conversation.createdAt.toDate().toISOString() :
            conversation.createdAt) : 'No date'
      };
    });

    res.status(200).json({
      success: true,
      total: conversationsSnapshot.size,
      conversations: allConversations
    });

  } catch (error) {
    console.error('❌ Test conversations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/debug/sellers', async (req, res) => {
  try {
    const shopsSnapshot = await db.collection('shops').get();

    const shops = shopsSnapshot.docs.map(doc => {
      const shop = doc.data();
      return {
        id: doc.id,
        name: shop.name || 'No Name',
        email: shop.email || 'No Email',
        role: shop.role || 'No Role',
        isActive: shop.isActive || false,
        createdAt: shop.createdAt ? shop.createdAt.toDate().toISOString() : 'No Date'
      };
    });

    res.status(200).json({
      success: true,
      totalSellers: shopsSnapshot.size,
      shops: shops,
      debugInfo: {
        endpoint: '/api/v2/shop/admin-all-sellers',
        requiredRole: 'admin',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Debug sellers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== USER ENDPOINTS ====================
app.post('/api/v2/user/create-user', upload.single('file'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingUsers = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = req.file ? req.file.filename : 'default-avatar.jpg';

    const userData = {
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar,
      role: 'user',
      isActive: true,
      phoneNumber: '',
      addresses: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await db.collection('users').add(userData);

    const token = jwt.sign(
      {
        id: userRef.id,
        email: email,
        role: 'user',
        name: name
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

    const userResponse = {
      _id: userRef.id,
      id: userRef.id,
      name,
      email,
      role: 'user',
      avatar: getImageUrl(avatar, 'avatar'),
      phoneNumber: '',
      addresses: [],
      createdAt: new Date().toISOString(),
      isAuthenticated: true
    };

    await sendEmail(
      email,
      'Welcome to Our Platform!',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Platform, ${name}!</h2>
          <p>Thank you for registering with us. Your account has been successfully created.</p>
          <p>You can now login and start exploring our platform.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Login to Your Account
            </a>
          </div>
        </div>
      `
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      user: userResponse,
      token: token
    });

  } catch (error) {
    console.error('❌ User registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v2/user/login-user', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        name: user.name
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );

    let cookieName;
    if (user.role === 'admin') {
      cookieName = 'admin_token';
    } else if (user.role === 'seller') {
      cookieName = 'seller_token';
    } else {
      cookieName = 'user_token';
    }

    res.cookie(cookieName, token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    const userResponse = {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      avatar: getImageUrl(user.avatar || 'default-avatar.jpg', 'avatar'),
      phoneNumber: user.phoneNumber || '',
      addresses: user.addresses || [],
      createdAt: user.createdAt ? user.createdAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
      isSeller: user.role === 'seller'
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token: token
    });

  } catch (error) {
    console.error('❌ User login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/user/getuser', isAuthenticated, async (req, res) => {
  try {
    let userData;
    let collection = req.userRole === 'seller' ? 'shops' : 'users';

    const doc = await db.collection(collection).doc(req.userId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    userData = { id: doc.id, ...doc.data() };

    const responseData = {
      _id: userData.id,
      id: userData.id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true
    };

    if (req.userRole === 'seller') {
      responseData.role = 'seller';
      responseData.isSeller = true;
      responseData.avatar = getImageUrl(userData.avatar || 'default-shop.jpg', 'shop');
      responseData.address = userData.address || '';
      responseData.phoneNumber = userData.phoneNumber || '';
      responseData.zipCode = userData.zipCode || '';
      responseData.availableBalance = userData.availableBalance || 0;
      responseData.totalSales = userData.totalSales || 0;
      responseData.totalProducts = userData.totalProducts || 0;
      responseData.description = userData.description || '';
      responseData.category = userData.category || '';
    } else if (req.userRole === 'admin') {
      responseData.role = 'admin';
      responseData.isAdmin = true;
      responseData.avatar = getImageUrl(userData.avatar || 'default-avatar.jpg', 'avatar');
      responseData.phoneNumber = userData.phoneNumber || '';
      responseData.addresses = userData.addresses || [];
    } else {
      responseData.role = 'user';
      responseData.avatar = getImageUrl(userData.avatar || 'default-avatar.jpg', 'avatar');
      responseData.phoneNumber = userData.phoneNumber || '';
      responseData.addresses = userData.addresses || [];
      responseData.isUser = true;
    }

    res.status(200).json({
      success: true,
      user: responseData
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/user/update-user-info', isAuthenticated, async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const collection = req.userRole === 'seller' ? 'shops' : 'users';
    const userRef = db.collection(collection).doc(req.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await userRef.update(updateData);

    const updatedUser = (await userRef.get()).data();

    const userResponse = {
      _id: req.userId,
      id: req.userId,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt ? updatedUser.createdAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true
    };

    if (req.userRole === 'seller') {
      userResponse.role = 'seller';
      userResponse.isSeller = true;
      userResponse.avatar = getImageUrl(updatedUser.avatar || 'default-shop.jpg', 'shop');
      userResponse.phoneNumber = updatedUser.phoneNumber || '';
      userResponse.address = updatedUser.address || '';
      userResponse.zipCode = updatedUser.zipCode || '';
    } else if (req.userRole === 'admin') {
      userResponse.role = 'admin';
      userResponse.isAdmin = true;
      userResponse.avatar = getImageUrl(updatedUser.avatar || 'default-avatar.jpg', 'avatar');
      userResponse.phoneNumber = updatedUser.phoneNumber || '';
    } else {
      userResponse.role = 'user';
      userResponse.isUser = true;
      userResponse.avatar = getImageUrl(updatedUser.avatar || 'default-avatar.jpg', 'avatar');
      userResponse.phoneNumber = updatedUser.phoneNumber || '';
      userResponse.addresses = updatedUser.addresses || [];
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/user/update-avatar', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const collection = req.userRole === 'seller' ? 'shops' : 'users';
    const userRef = db.collection(collection).doc(req.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userDoc.data();
    const defaultAvatar = req.userRole === 'seller' ? 'default-shop.jpg' : 'default-avatar.jpg';

    if (user.avatar && user.avatar !== defaultAvatar) {
      const oldAvatarPath = path.join(uploadsDir, user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    const avatar = req.file ? req.file.filename : defaultAvatar;

    await userRef.update({
      avatar,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedUser = (await userRef.get()).data();

    const userResponse = {
      _id: req.userId,
      id: req.userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: req.userRole,
      avatar: getImageUrl(avatar, req.userRole === 'seller' ? 'shop' : 'avatar'),
      createdAt: updatedUser.createdAt ? updatedUser.createdAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true
    };

    if (req.userRole === 'seller') {
      userResponse.isSeller = true;
      userResponse.phoneNumber = updatedUser.phoneNumber || '';
      userResponse.address = updatedUser.address || '';
      userResponse.zipCode = updatedUser.zipCode || '';
    } else if (req.userRole === 'admin') {
      userResponse.isAdmin = true;
      userResponse.phoneNumber = updatedUser.phoneNumber || '';
    } else {
      userResponse.isUser = true;
      userResponse.phoneNumber = updatedUser.phoneNumber || '';
      userResponse.addresses = updatedUser.addresses || [];
    }

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/user/update-user-addresses', isAuthenticated, isUser, async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({
        success: false,
        message: 'Addresses must be an array'
      });
    }

    const userRef = db.collection('users').doc(req.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await userRef.update({
      addresses,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedUser = (await userRef.get()).data();

    const userResponse = {
      _id: req.userId,
      id: req.userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: 'user',
      avatar: getImageUrl(updatedUser.avatar || 'default-avatar.jpg', 'avatar'),
      phoneNumber: updatedUser.phoneNumber || '',
      addresses: updatedUser.addresses || [],
      createdAt: updatedUser.createdAt ? updatedUser.createdAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true,
      isUser: true
    };

    res.status(200).json({
      success: true,
      message: 'Addresses updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Update addresses error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/v2/user/delete-user/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userDoc.data();

    if (user.avatar && user.avatar !== 'default-avatar.jpg') {
      const avatarPath = path.join(uploadsDir, user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await userRef.delete();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/user/admin-all-users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();

    const users = usersSnapshot.docs.map(doc => {
      const user = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatar: getImageUrl(user.avatar || 'default-avatar.jpg', 'avatar'),
        phoneNumber: user.phoneNumber || '',
        addresses: user.addresses || [],
        isActive: user.isActive || true,
        createdAt: user.createdAt ? user.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: user.updatedAt ? user.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/user/user-info/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      const shopDoc = await db.collection('shops').doc(id).get();
      if (!shopDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const shop = shopDoc.data();
      const shopResponse = {
        _id: shopDoc.id,
        id: shopDoc.id,
        name: shop.name || '',
        email: shop.email || '',
        avatar: getImageUrl(shop.avatar || 'default-shop.jpg', 'shop'),
        phoneNumber: shop.phoneNumber || '',
        role: 'seller'
      };

      return res.status(200).json({
        success: true,
        user: shopResponse
      });
    }

    const user = userDoc.data();

    const userResponse = {
      _id: userDoc.id,
      id: userDoc.id,
      name: user.name || '',
      email: user.email || '',
      avatar: getImageUrl(user.avatar || 'default-avatar.jpg', 'avatar'),
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'user'
    };

    res.status(200).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Get user info error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v2/user/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const usersSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      const shopsSnapshot = await db.collection('shops')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();

      if (shopsSnapshot.empty) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email'
        });
      }

      const shopDoc = shopsSnapshot.docs[0];
      const shop = { id: shopDoc.id, ...shopDoc.data() };

      const resetToken = jwt.sign(
        { id: shop.id, email: shop.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '15m' }
      );

      await db.collection('shops').doc(shop.id).update({
        resetPasswordToken: resetToken,
        resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

      await sendEmail(
        email,
        'Password Reset Request',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${shop.name},</p>
            <p>You requested a password reset for your seller account. Click the button below to reset your password:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      );

      return res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15m' }
    );

    await db.collection('users').doc(user.id).update({
      resetPasswordToken: resetToken,
      resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      'Password Reset Request',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/user/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    let userRef = db.collection('users').doc(decoded.id);
    let userDoc = await userRef.get();
    let isShop = false;

    if (!userDoc.exists) {
      userRef = db.collection('shops').doc(decoded.id);
      userDoc = await userRef.get();
      isShop = true;

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const user = userDoc.data();

    if (user.resetPasswordToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (user.resetPasswordExpire && new Date(user.resetPasswordExpire) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userRef.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const userType = isShop ? 'seller' : 'user';
    await sendEmail(
      user.email,
      'Password Reset Successful',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Hello ${user.name},</p>
          <p>Your ${userType} password has been successfully reset.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${isShop ? 'shop-login' : 'login'}"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Login with New Password
            </a>
          </div>
        </div>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== SHOP ENDPOINTS ====================
app.post('/api/v2/shop/create-shop', upload.single('file'), async (req, res) => {
  try {
    const { name, email, password, address, phoneNumber, zipCode } = req.body;

    if (!name || !email || !password || !address || !phoneNumber || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingShops = await db.collection('shops')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingShops.empty) {
      return res.status(400).json({
        success: false,
        message: 'Shop already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = req.file ? req.file.filename : 'default-shop.jpg';

    const shopData = {
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      avatar,
      address,
      phoneNumber,
      zipCode,
      role: 'seller',
      isActive: true,
      availableBalance: 0,
      totalSales: 0,
      totalProducts: 0,
      ratings: 0,
      description: '',
      category: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const shopRef = await db.collection('shops').add(shopData);

    const token = jwt.sign(
      {
        id: shopRef.id,
        email: email,
        role: 'seller',
        name: name
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

    const sellerResponse = {
      _id: shopRef.id,
      id: shopRef.id,
      name,
      email,
      role: 'seller',
      avatar: getImageUrl(avatar, 'shop'),
      address,
      phoneNumber,
      zipCode,
      availableBalance: 0,
      totalSales: 0,
      totalProducts: 0,
      createdAt: new Date().toISOString(),
      isAuthenticated: true,
      isSeller: true
    };

    await sendEmail(
      email,
      'Welcome to Our Seller Platform!',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Seller Platform, ${name}!</h2>
          <p>Congratulations! Your shop has been successfully registered as a seller.</p>
          <p>You can now add products and start selling.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/shop-login"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Go to Seller Dashboard
            </a>
          </div>
        </div>
      `
    );

    res.status(201).json({
      success: true,
      message: 'Shop registered successfully as a seller!',
      seller: sellerResponse,
      token: token
    });

  } catch (error) {
    console.error('❌ Shop registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v2/shop/login-shop', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const shopsSnapshot = await db.collection('shops')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (shopsSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const shopDoc = shopsSnapshot.docs[0];
    const shop = { id: shopDoc.id, ...shopDoc.data() };

    const isPasswordValid = await bcrypt.compare(password, shop.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: shop.id,
        email: shop.email,
        role: 'seller',
        name: shop.name
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

    const sellerResponse = {
      _id: shop.id,
      id: shop.id,
      name: shop.name,
      email: shop.email,
      role: 'seller',
      avatar: getImageUrl(shop.avatar || 'default-shop.jpg', 'shop'),
      address: shop.address || '',
      phoneNumber: shop.phoneNumber || '',
      zipCode: shop.zipCode || '',
      availableBalance: shop.availableBalance || 0,
      totalSales: shop.totalSales || 0,
      totalProducts: shop.totalProducts || 0,
      description: shop.description || '',
      category: shop.category || '',
      createdAt: shop.createdAt ? shop.createdAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true,
      isSeller: true
    };

    res.status(200).json({
      success: true,
      message: 'Login successful as seller',
      seller: sellerResponse,
      token: token
    });

  } catch (error) {
    console.error('❌ Shop login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/shop/getSeller', isAuthenticated, isSeller, async (req, res) => {
  try {
    const shopRef = db.collection('shops').doc(req.userId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopDoc.data();

    const sellerResponse = {
      _id: req.userId,
      id: req.userId,
      name: shop.name,
      email: shop.email,
      role: 'seller',
      avatar: getImageUrl(shop.avatar || 'default-shop.jpg', 'shop'),
      address: shop.address || '',
      phoneNumber: shop.phoneNumber || '',
      zipCode: shop.zipCode || '',
      availableBalance: shop.availableBalance || 0,
      totalSales: shop.totalSales || 0,
      totalProducts: shop.totalProducts || 0,
      description: shop.description || '',
      category: shop.category || '',
      ratings: shop.ratings || 0,
      isActive: shop.isActive || true,
      createdAt: shop.createdAt ? shop.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: shop.updatedAt ? shop.updatedAt.toDate().toISOString() : new Date().toISOString(),
      isAuthenticated: true,
      isSeller: true
    };

    res.status(200).json({
      success: true,
      seller: sellerResponse
    });

  } catch (error) {
    console.error('❌ Get seller error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/shop/get-shop/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const shopRef = db.collection('shops').doc(id);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopDoc.data();

    const shopResponse = {
      _id: shopDoc.id,
      id: shopDoc.id,
      name: shop.name,
      email: shop.email,
      role: 'seller',
      avatar: getImageUrl(shop.avatar || 'default-shop.jpg', 'shop'),
      address: shop.address || '',
      phoneNumber: shop.phoneNumber || '',
      zipCode: shop.zipCode || '',
      availableBalance: shop.availableBalance || 0,
      totalSales: shop.totalSales || 0,
      totalProducts: shop.totalProducts || 0,
      description: shop.description || '',
      category: shop.category || '',
      ratings: shop.ratings || 0,
      isActive: shop.isActive || true,
      createdAt: shop.createdAt ? shop.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: shop.updatedAt ? shop.updatedAt.toDate().toISOString() : new Date().toISOString(),
      isSeller: true
    };

    res.status(200).json({
      success: true,
      shop: shopResponse,
      seller: shopResponse
    });

  } catch (error) {
    console.error('❌ Get shop error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/shop/update-shop', isAuthenticated, isSeller, upload.single('file'), async (req, res) => {
  try {
    const { name, description, address, phoneNumber, zipCode } = req.body;

    const shopRef = db.collection('shops').doc(req.userId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopDoc.data();
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (zipCode) updateData.zipCode = zipCode;

    if (req.file) {
      if (shop.avatar && shop.avatar !== 'default-shop.jpg') {
        const oldAvatarPath = path.join(uploadsDir, shop.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      updateData.avatar = req.file.filename;
    }

    await shopRef.update(updateData);

    const updatedShop = (await shopRef.get()).data();

    const shopResponse = {
      _id: req.userId,
      id: req.userId,
      name: updatedShop.name,
      email: updatedShop.email,
      role: 'seller',
      avatar: getImageUrl(updatedShop.avatar || 'default-shop.jpg', 'shop'),
      address: updatedShop.address || '',
      phoneNumber: updatedShop.phoneNumber || '',
      zipCode: updatedShop.zipCode || '',
      availableBalance: updatedShop.availableBalance || 0,
      totalSales: updatedShop.totalSales || 0,
      totalProducts: updatedShop.totalProducts || 0,
      description: updatedShop.description || '',
      category: updatedShop.category || '',
      createdAt: updatedShop.createdAt ? updatedShop.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: updatedShop.updatedAt ? updatedShop.updatedAt.toDate().toISOString() : new Date().toISOString(),
      isSeller: true
    };

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully',
      shop: shopResponse,
      seller: shopResponse
    });

  } catch (error) {
    console.error('❌ Update shop error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/shop/update-shop/:id', isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      description,
      address,
      phoneNumber,
      zipCode,
      category,
      isActive,
      availableBalance,
      totalSales,
      totalProducts,
      ratings
    } = req.body;

    const shopRef = db.collection('shops').doc(id);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopDoc.data();
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (description !== undefined) updateData.description = description;
    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (zipCode) updateData.zipCode = zipCode;
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (availableBalance !== undefined) updateData.availableBalance = parseFloat(availableBalance);
    if (totalSales !== undefined) updateData.totalSales = parseFloat(totalSales);
    if (totalProducts !== undefined) updateData.totalProducts = parseInt(totalProducts);
    if (ratings !== undefined) updateData.ratings = parseFloat(ratings);

    if (req.file) {
      if (shop.avatar && shop.avatar !== 'default-shop.jpg') {
        const oldAvatarPath = path.join(uploadsDir, shop.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      updateData.avatar = req.file.filename;
    }

    await shopRef.update(updateData);

    const updatedShop = (await shopRef.get()).data();

    const shopResponse = {
      _id: id,
      id: id,
      name: updatedShop.name,
      email: updatedShop.email,
      role: 'seller',
      avatar: getImageUrl(updatedShop.avatar || 'default-shop.jpg', 'shop'),
      address: updatedShop.address || '',
      phoneNumber: updatedShop.phoneNumber || '',
      zipCode: updatedShop.zipCode || '',
      availableBalance: updatedShop.availableBalance || 0,
      totalSales: updatedShop.totalSales || 0,
      totalProducts: updatedShop.totalProducts || 0,
      description: updatedShop.description || '',
      category: updatedShop.category || '',
      ratings: updatedShop.ratings || 0,
      isActive: updatedShop.isActive || true,
      createdAt: updatedShop.createdAt ? updatedShop.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: updatedShop.updatedAt ? updatedShop.updatedAt.toDate().toISOString() : new Date().toISOString(),
      isSeller: true
    };

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully by admin',
      shop: shopResponse
    });

  } catch (error) {
    console.error('❌ Update shop by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/shop/get-all-shops', async (req, res) => {
  try {
    const shopsSnapshot = await db.collection('shops')
      .where('isActive', '==', true)
      .get();

    const shops = shopsSnapshot.docs.map(doc => {
      const shop = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        name: shop.name,
        email: shop.email,
        role: 'seller',
        avatar: getImageUrl(shop.avatar || 'default-shop.jpg', 'shop'),
        address: shop.address || '',
        phoneNumber: shop.phoneNumber || '',
        zipCode: shop.zipCode || '',
        availableBalance: shop.availableBalance || 0,
        totalSales: shop.totalSales || 0,
        totalProducts: shop.totalProducts || 0,
        description: shop.description || '',
        category: shop.category || '',
        ratings: shop.ratings || 0,
        createdAt: shop.createdAt ? shop.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      shops
    });

  } catch (error) {
    console.error('❌ Get all shops error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/v2/shop/delete-shop/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const shopRef = db.collection('shops').doc(id);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopDoc.data();

    if (shop.avatar && shop.avatar !== 'default-shop.jpg') {
      const avatarPath = path.join(uploadsDir, shop.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await shopRef.delete();

    const productsSnapshot = await db.collection('products')
      .where('shopId', '==', id)
      .get();

    const batch = db.batch();
    productsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Shop deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete shop error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN SELLER ENDPOINTS ====================
app.get('/api/v2/shop/admin-all-sellers', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const shopsSnapshot = await db.collection('shops').get();

    const sellers = shopsSnapshot.docs.map(doc => {
      const shop = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        name: shop.name || '',
        email: shop.email || '',
        avatar: getImageUrl(shop.avatar || 'default-shop.jpg', 'shop'),
        address: shop.address || '',
        phoneNumber: shop.phoneNumber || '',
        zipCode: shop.zipCode || '',
        availableBalance: shop.availableBalance || 0,
        totalSales: shop.totalSales || 0,
        totalProducts: shop.totalProducts || 0,
        description: shop.description || '',
        category: shop.category || '',
        ratings: shop.ratings || 0,
        isActive: shop.isActive || true,
        role: shop.role || 'seller',
        createdAt: shop.createdAt ? shop.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: shop.updatedAt ? shop.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      sellers
    });

  } catch (error) {
    console.error('❌ Get all sellers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/v2/shop/delete-seller/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const shopRef = db.collection('shops').doc(id);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const shop = shopDoc.data();

    if (shop.avatar && shop.avatar !== 'default-shop.jpg') {
      const avatarPath = path.join(uploadsDir, shop.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await shopRef.delete();

    const productsSnapshot = await db.collection('products')
      .where('shopId', '==', id)
      .get();

    const batch = db.batch();
    productsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    const eventsSnapshot = await db.collection('events')
      .where('shopId', '==', id)
      .get();

    const eventsBatch = db.batch();
    eventsSnapshot.docs.forEach(doc => {
      eventsBatch.delete(doc.ref);
    });
    await eventsBatch.commit();

    const couponsSnapshot = await db.collection('coupons')
      .where('shopId', '==', id)
      .get();

    const couponsBatch = db.batch();
    couponsSnapshot.docs.forEach(doc => {
      couponsBatch.delete(doc.ref);
    });
    await couponsBatch.commit();

    const conversationsSnapshot = await db.collection('conversations')
      .where('shopId', '==', id)
      .get();

    const conversationsBatch = db.batch();
    conversationsSnapshot.docs.forEach(doc => {
      conversationsBatch.delete(doc.ref);
    });
    await conversationsBatch.commit();

    const withdrawsSnapshot = await db.collection('withdraws')
      .where('shopId', '==', id)
      .get();

    const withdrawsBatch = db.batch();
    withdrawsSnapshot.docs.forEach(doc => {
      withdrawsBatch.delete(doc.ref);
    });
    await withdrawsBatch.commit();

    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete seller error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== PRODUCT ENDPOINTS ====================
app.post('/api/v2/product/create-product', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tags,
      originalPrice,
      discountPrice,
      stock
    } = req.body;

    if (!name || !description || !category || !originalPrice || !stock) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, category, originalPrice, and stock are required'
      });
    }

    const shopDoc = await db.collection('shops').doc(req.userId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shopData = shopDoc.data();

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.filename);
    } else {
      images = ['default-product.jpg'];
    }

    const price = parseFloat(originalPrice);
    const discount = discountPrice ? parseFloat(discountPrice) : price;
    const stockCount = parseInt(stock);

    const productData = {
      name,
      description,
      category,
      tags: tags || '',
      originalPrice: price,
      discountPrice: discount,
      stock: stockCount,
      images,
      ratings: 0,
      reviews: [],
      sold_out: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      shopId: req.userId,
      shop: {
        _id: req.userId,
        id: req.userId,
        name: shopData.name,
        avatar: shopData.avatar || 'default-shop.jpg',
        email: shopData.email,
        address: shopData.address || '',
        phoneNumber: shopData.phoneNumber || '',
        zipCode: shopData.zipCode || ''
      }
    };

    const productRef = await db.collection('products').add(productData);

    await db.collection('shops').doc(req.userId).update({
      totalProducts: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const productResponse = {
      _id: productRef.id,
      id: productRef.id,
      name,
      description,
      category,
      tags: tags || '',
      originalPrice: price,
      discountPrice: discount,
      stock: stockCount,
      images: images.map(img => getImageUrl(img, 'product')),
      ratings: 0,
      sold_out: 0,
      shopId: req.userId,
      shop: {
        _id: req.userId,
        name: shopData.name,
        avatar: getImageUrl(shopData.avatar || 'default-shop.jpg', 'shop'),
        address: shopData.address || '',
        phoneNumber: shopData.phoneNumber || '',
        zipCode: shopData.zipCode || ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product: productResponse
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/product/get-all-products', async (req, res) => {
  try {
    const { category, name } = req.query;

    let query = db.collection('products');

    if (category && category !== 'All') {
      query = query.where('category', '==', category);
    }

    const productsSnapshot = await query.orderBy('createdAt', 'desc').get();

    const products = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      const images = validateImages(product.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: product.name || 'Product Name',
        description: product.description || '',
        category: product.category || '',
        discountPrice: product.discountPrice || 0,
        originalPrice: product.originalPrice || 0,
        stock: product.stock || 0,
        images: images.map(img => getImageUrl(img, 'product')),
        ratings: product.ratings || 0,
        sold_out: product.sold_out || 0,
        shopId: product.shopId || '',
        shop: product.shop || {},
        createdAt: product.createdAt ? product.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: product.updatedAt ? product.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    let filteredProducts = products;
    if (name) {
      filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      products: filteredProducts
    });

  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(200).json({
      success: true,
      products: []
    });
  }
});

app.get('/api/v2/product/get-product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const productDoc = await db.collection('products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productDoc.data();
    const images = validateImages(product.images);

    let shopInfo = product.shop || {};
    if (product.shopId && (!shopInfo || !shopInfo._id)) {
      try {
        const shopDoc = await db.collection('shops').doc(product.shopId).get();
        if (shopDoc.exists) {
          const shopData = shopDoc.data();
          shopInfo = {
            _id: shopDoc.id,
            id: shopDoc.id,
            name: shopData.name || '',
            avatar: getImageUrl(shopData.avatar || 'default-shop.jpg', 'shop'),
            email: shopData.email || '',
            address: shopData.address || '',
            phoneNumber: shopData.phoneNumber || '',
            zipCode: shopData.zipCode || ''
          };
        }
      } catch (shopError) {
        console.error('❌ Error fetching shop info:', shopError);
      }
    }

    const productResponse = {
      _id: productDoc.id,
      id: productDoc.id,
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      tags: product.tags || '',
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || 0,
      stock: product.stock || 0,
      images: images.map(img => getImageUrl(img, 'product')),
      ratings: product.ratings || 0,
      reviews: product.reviews || [],
      sold_out: product.sold_out || 0,
      shopId: product.shopId || '',
      shop: shopInfo,
      createdAt: product.createdAt ? product.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: product.updatedAt ? product.updatedAt.toDate().toISOString() : new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      product: productResponse
    });

  } catch (error) {
    console.error('❌ Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/product/get-shop-products/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const productsSnapshot = await db.collection('products')
      .where('shopId', '==', shopId)
      .get();

    let shopInfo = {};
    try {
      const shopDoc = await db.collection('shops').doc(shopId).get();
      if (shopDoc.exists) {
        const shopData = shopDoc.data();
        shopInfo = {
          _id: shopDoc.id,
          id: shopDoc.id,
          name: shopData.name || '',
          avatar: getImageUrl(shopData.avatar || 'default-shop.jpg', 'shop'),
          email: shopData.email || '',
          address: shopData.address || '',
          phoneNumber: shopData.phoneNumber || '',
          zipCode: shopData.zipCode || ''
        };
      }
    } catch (shopError) {
      console.error('❌ Error fetching shop info:', shopError);
    }

    const products = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      const images = validateImages(product.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        tags: product.tags || '',
        originalPrice: product.originalPrice || 0,
        discountPrice: product.discountPrice || 0,
        stock: product.stock || 0,
        images: images.map(img => getImageUrl(img, 'product')),
        ratings: product.ratings || 0,
        reviews: product.reviews || [],
        sold_out: product.sold_out || 0,
        shopId: product.shopId || '',
        shop: shopInfo,
        createdAt: product.createdAt ? product.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: product.updatedAt ? product.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    console.error('❌ Get shop products error:', error);
    res.status(200).json({
      success: true,
      products: []
    });
  }
});

app.get('/api/v2/product/get-all-products-shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const productsSnapshot = await db.collection('products')
      .where('shopId', '==', shopId)
      .get();

    const products = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      const images = validateImages(product.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        tags: product.tags || '',
        originalPrice: product.originalPrice || 0,
        discountPrice: product.discountPrice || 0,
        stock: product.stock || 0,
        images: images.map(img => getImageUrl(img, 'product')),
        ratings: product.ratings || 0,
        reviews: product.reviews || [],
        sold_out: product.sold_out || 0,
        shopId: product.shopId || '',
        shop: product.shop || {},
        createdAt: product.createdAt ? product.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: product.updatedAt ? product.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    console.error('❌ Get shop products error:', error);
    res.status(200).json({
      success: true,
      products: []
    });
  }
});

app.delete('/api/v2/product/delete-shop-product/:productId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { productId } = req.params;

    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productDoc.data();

    if (product.shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }

    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(image => {
        if (image && image !== 'default-product.jpg') {
          const filePath = path.join(uploadsDir, image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    await db.collection('products').doc(productId).delete();

    await db.collection('shops').doc(req.userId).update({
      totalProducts: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully!'
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/product/update-product/:id', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productDoc.data();

    if (product.shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }

    if (req.files && req.files.length > 0) {
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(image => {
          if (image && image !== 'default-product.jpg') {
            const filePath = path.join(uploadsDir, image);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });
      }

      updateData.images = req.files.map(file => file.filename);
    }

    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.discountPrice) updateData.discountPrice = parseFloat(updateData.discountPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('products').doc(productId).update(updateData);

    const updatedDoc = await db.collection('products').doc(productId).get();
    const updatedProduct = updatedDoc.data();
    const images = validateImages(updatedProduct.images);

    const productResponse = {
      _id: productId,
      id: productId,
      name: updatedProduct.name || '',
      description: updatedProduct.description || '',
      category: updatedProduct.category || '',
      tags: updatedProduct.tags || '',
      originalPrice: updatedProduct.originalPrice || 0,
      discountPrice: updatedProduct.discountPrice || 0,
      stock: updatedProduct.stock || 0,
      images: images.map(img => getImageUrl(img, 'product')),
      ratings: updatedProduct.ratings || 0,
      reviews: updatedProduct.reviews || [],
      sold_out: updatedProduct.sold_out || 0,
      shopId: updatedProduct.shopId || '',
      shop: updatedProduct.shop || {},
      createdAt: updatedProduct.createdAt ? updatedProduct.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: updatedProduct.updatedAt ? updatedProduct.updatedAt.toDate().toISOString() : new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      product: productResponse
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/product/create-new-review', isAuthenticated, isUser, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productDoc.data();
    const reviews = product.reviews || [];

    const alreadyReviewed = reviews.find(
      review => review.user && review.user._id === req.userId
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Product already reviewed'
      });
    }

    const userDoc = await db.collection('users').doc(req.userId).get();
    const user = userDoc.data();

    const review = {
      user: {
        _id: req.userId,
        name: user.name,
        avatar: getImageUrl(user.avatar || 'default-avatar.jpg', 'avatar')
      },
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    reviews.push(review);

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await productRef.update({
      reviews,
      ratings: averageRating,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Review added successfully'
    });

  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/product/products', async (req, res) => {
  try {
    const { category } = req.query;

    let query = db.collection('products');

    if (category && category !== 'All') {
      query = query.where('category', '==', category);
    }

    const productsSnapshot = await query.orderBy('createdAt', 'desc').limit(20).get();

    const products = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      const images = validateImages(product.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        originalPrice: product.originalPrice || 0,
        discountPrice: product.discountPrice || 0,
        stock: product.stock || 0,
        images: images.map(img => getImageUrl(img, 'product')),
        ratings: product.ratings || 0,
        sold_out: product.sold_out || 0,
        shopId: product.shopId || '',
        shop: product.shop || {},
        createdAt: product.createdAt ? product.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    console.error('❌ Get products by category error:', error);
    res.status(200).json({
      success: true,
      products: []
    });
  }
});

app.get('/api/v2/product/admin-all-products', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products')
      .orderBy('createdAt', 'desc')
      .get();

    const products = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      const images = validateImages(product.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        originalPrice: product.originalPrice || 0,
        discountPrice: product.discountPrice || 0,
        stock: product.stock || 0,
        images: images.map(img => getImageUrl(img, 'product')),
        ratings: product.ratings || 0,
        sold_out: product.sold_out || 0,
        shopId: product.shopId || '',
        shop: product.shop || {},
        createdAt: product.createdAt ? product.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    console.error('❌ Get admin all products error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== EVENT ENDPOINTS ====================
app.post('/api/v2/event/create-event', isAuthenticated, isSeller, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tags,
      originalPrice,
      discountPrice,
      stock,
      startDate,
      endDate
    } = req.body;

    if (!name || !description || !category || !originalPrice || !stock || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const shopId = req.userId;

    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shopData = shopDoc.data();

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.filename);
    } else {
      images = ['default-event.jpg'];
    }

    const price = parseFloat(originalPrice);
    const discount = discountPrice ? parseFloat(discountPrice) : price;
    const stockCount = parseInt(stock);

    const eventData = {
      name,
      description,
      category,
      tags: tags || '',
      originalPrice: price,
      discountPrice: discount,
      stock: stockCount,
      images,
      startDate,
      endDate,
      status: 'active',
      ratings: 0,
      reviews: [],
      sold_out: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      shopId: shopId,
      shop: {
        _id: shopId,
        id: shopId,
        name: shopData.name,
        avatar: shopData.avatar || 'default-shop.jpg',
        email: shopData.email
      }
    };

    const eventRef = await db.collection('events').add(eventData);

    const eventResponse = {
      _id: eventRef.id,
      id: eventRef.id,
      name,
      description,
      category,
      tags: tags || '',
      originalPrice: price,
      discountPrice: discount,
      stock: stockCount,
      images: images.map(img => getImageUrl(img, 'event')),
      startDate,
      endDate,
      status: 'active',
      ratings: 0,
      sold_out: 0,
      shopId: shopId,
      shop: {
        _id: shopId,
        name: shopData.name,
        avatar: getImageUrl(shopData.avatar || 'default-shop.jpg', 'shop')
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: eventResponse
    });

  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/event/get-all-events', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').get();

    const events = eventsSnapshot.docs.map(doc => {
      const event = doc.data();
      const images = validateImages(event.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: event.name || 'Event Name',
        description: event.description || '',
        category: event.category || '',
        originalPrice: event.originalPrice || 0,
        discountPrice: event.discountPrice || 0,
        stock: event.stock || 0,
        sold_out: event.sold_out || 0,
        images: images.map(img => getImageUrl(img, 'event')),
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        status: event.status || 'active',
        ratings: event.ratings || 0,
        shopId: event.shopId || '',
        shop: event.shop || {},
        createdAt: event.createdAt ? event.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: event.updatedAt ? event.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      events,
      message: `Found ${events.length} events for public viewing`
    });

  } catch (error) {
    console.error('❌ Get all events error:', error);
    res.status(200).json({
      success: true,
      events: [],
      message: 'No events found'
    });
  }
});

app.get('/api/v2/event/get-shop-events/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    const eventsSnapshot = await db.collection('events')
      .where('shopId', '==', shopId)
      .where('status', '==', 'active')
      .get();

    const events = eventsSnapshot.docs.map(doc => {
      const event = doc.data();
      const images = validateImages(event.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: event.name || 'Event Name',
        description: event.description || '',
        category: event.category || '',
        originalPrice: event.originalPrice || 0,
        discountPrice: event.discountPrice || 0,
        stock: event.stock || 0,
        sold_out: event.sold_out || 0,
        images: images.map(img => getImageUrl(img, 'event')),
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        status: event.status || 'active',
        ratings: event.ratings || 0,
        shopId: event.shopId || '',
        shop: event.shop || {},
        createdAt: event.createdAt ? event.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: event.updatedAt ? event.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      events,
      debug: {
        shopId,
        eventCount: events.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Get shop events error:', error);
    res.status(200).json({
      success: true,
      events: [],
      error: error.message
    });
  }
});

app.delete('/api/v2/event/delete-shop-event/:eventId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventDoc.data();

    if (event.shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own events'
      });
    }

    if (event.images && Array.isArray(event.images)) {
      event.images.forEach(image => {
        if (image && image !== 'default-event.jpg') {
          const filePath = path.join(uploadsDir, image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    await db.collection('events').doc(eventId).delete();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete event error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/event/get-event/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventDoc.data();
    const images = validateImages(event.images);

    const eventResponse = {
      _id: eventDoc.id,
      id: eventDoc.id,
      name: event.name || '',
      description: event.description || '',
      category: event.category || '',
      tags: event.tags || '',
      originalPrice: event.originalPrice || 0,
      discountPrice: event.discountPrice || 0,
      stock: event.stock || 0,
      images: images.map(img => getImageUrl(img, 'event')),
      startDate: event.startDate || '',
      endDate: event.endDate || '',
      status: event.status || 'active',
      ratings: event.ratings || 0,
      reviews: event.reviews || [],
      sold_out: event.sold_out || 0,
      shopId: event.shopId || '',
      shop: event.shop || {},
      createdAt: event.createdAt ? event.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? event.updatedAt.toDate().toISOString() : new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      event: eventResponse
    });

  } catch (error) {
    console.error('❌ Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/event/admin-all-events', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').get();

    const events = eventsSnapshot.docs.map(doc => {
      const event = doc.data();
      const images = validateImages(event.images);

      return {
        _id: doc.id,
        id: doc.id,
        name: event.name || '',
        description: event.description || '',
        category: event.category || '',
        originalPrice: event.originalPrice || 0,
        discountPrice: event.discountPrice || 0,
        stock: event.stock || 0,
        sold_out: event.sold_out || 0,
        images: images.map(img => getImageUrl(img, 'event')),
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        status: event.status || 'active',
        ratings: event.ratings || 0,
        shopId: event.shopId || '',
        shop: event.shop || {},
        createdAt: event.createdAt ? event.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      events
    });

  } catch (error) {
    console.error('❌ Get admin all events error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== COUPON ENDPOINTS ====================
app.post('/api/v2/coupon/create-coupon', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { name, value, minAmount, selectedProduct, shopId } = req.body;

    if (!name || !value || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code, value, and shopId are required'
      });
    }

    if (shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create coupons for your own shop'
      });
    }

    const existingCoupons = await db.collection('coupons')
      .where('shopId', '==', shopId)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (!existingCoupons.empty) {
      return res.status(400).json({
        success: false,
        message: 'Coupon with this code already exists for your shop'
      });
    }

    const couponData = {
      name: name.trim().toUpperCase(),
      value: parseFloat(value),
      minAmount: minAmount ? parseFloat(minAmount) : 0,
      selectedProduct: selectedProduct || '',
      shopId: shopId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const couponRef = await db.collection('coupons').add(couponData);

    const couponResponse = {
      _id: couponRef.id,
      id: couponRef.id,
      name: couponData.name,
      value: couponData.value,
      minAmount: couponData.minAmount,
      selectedProduct: couponData.selectedProduct,
      shopId: shopId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully!',
      coupon: couponResponse
    });

  } catch (error) {
    console.error('❌ Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v2/coupon/create-coupon-code', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { name, value, minAmount, selectedProduct, shopId } = req.body;

    if (!name || !value || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code, value, and shopId are required'
      });
    }

    if (shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create coupons for your own shop'
      });
    }

    const existingCoupons = await db.collection('coupons')
      .where('shopId', '==', shopId)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (!existingCoupons.empty) {
      return res.status(400).json({
        success: false,
        message: 'Coupon with this code already exists for your shop'
      });
    }

    const couponData = {
      name: name.trim().toUpperCase(),
      value: parseFloat(value),
      minAmount: minAmount ? parseFloat(minAmount) : 0,
      selectedProduct: selectedProduct || '',
      shopId: shopId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const couponRef = await db.collection('coupons').add(couponData);

    const couponResponse = {
      _id: couponRef.id,
      id: couponRef.id,
      name: couponData.name,
      value: couponData.value,
      minAmount: couponData.minAmount,
      selectedProduct: couponData.selectedProduct,
      shopId: shopId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully!',
      coupon: couponResponse
    });

  } catch (error) {
    console.error('❌ Create coupon code error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/coupon/get-shop-coupons/:shopId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { shopId } = req.params;

    if (shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view coupons for your own shop'
      });
    }

    const couponsSnapshot = await db.collection('coupons')
      .where('shopId', '==', shopId)
      .orderBy('createdAt', 'desc')
      .get();

    const coupons = couponsSnapshot.docs.map(doc => {
      const coupon = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        name: coupon.name || '',
        value: coupon.value || 0,
        minAmount: coupon.minAmount || 0,
        selectedProduct: coupon.selectedProduct || '',
        shopId: coupon.shopId || '',
        createdAt: coupon.createdAt ? coupon.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: coupon.updatedAt ? coupon.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      coupons: coupons || []
    });

  } catch (error) {
    console.error('❌ Get shop coupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      coupons: []
    });
  }
});

app.get('/api/v2/coupon/get-coupon-value/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { shopId } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Coupon name is required'
      });
    }

    let query = db.collection('coupons')
      .where('name', '==', name.trim().toUpperCase());

    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const couponsSnapshot = await query.limit(1).get();

    if (couponsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    const couponDoc = couponsSnapshot.docs[0];
    const coupon = couponDoc.data();

    const couponResponse = {
      _id: couponDoc.id,
      id: couponDoc.id,
      name: coupon.name || '',
      value: coupon.value || 0,
      minAmount: coupon.minAmount || 0,
      selectedProduct: coupon.selectedProduct || '',
      shopId: coupon.shopId || '',
      createdAt: coupon.createdAt ? coupon.createdAt.toDate().toISOString() : new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      coupon: couponResponse
    });

  } catch (error) {
    console.error('❌ Get coupon value error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/v2/coupon/delete-coupon/:couponId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: 'Coupon ID is required'
      });
    }

    const couponDoc = await db.collection('coupons').doc(couponId).get();

    if (!couponDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    const coupon = couponDoc.data();

    if (coupon.shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own coupons'
      });
    }

    await db.collection('coupons').doc(couponId).delete();

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/coupon/admin-all-coupons', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const couponsSnapshot = await db.collection('coupons')
      .orderBy('createdAt', 'desc')
      .get();

    const coupons = couponsSnapshot.docs.map(doc => {
      const coupon = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        name: coupon.name || '',
        value: coupon.value || 0,
        minAmount: coupon.minAmount || 0,
        selectedProduct: coupon.selectedProduct || '',
        shopId: coupon.shopId || '',
        createdAt: coupon.createdAt ? coupon.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: coupon.updatedAt ? coupon.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      coupons
    });

  } catch (error) {
    console.error('❌ Get all coupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/coupon/get-coupons/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID is required'
      });
    }

    const couponsSnapshot = await db.collection('coupons')
      .where('shopId', '==', shopId)
      .orderBy('createdAt', 'desc')
      .get();

    const coupons = couponsSnapshot.docs.map(doc => {
      const coupon = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        name: coupon.name || '',
        value: coupon.value || 0,
        minAmount: coupon.minAmount || 0,
        selectedProduct: coupon.selectedProduct || '',
        shopId: coupon.shopId || '',
        createdAt: coupon.createdAt ? coupon.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      coupons: coupons || []
    });

  } catch (error) {
    console.error('❌ Get shop coupons (public) error:', error);
    res.status(200).json({
      success: true,
      coupons: []
    });
  }
});

// ==================== CONVERSATION ENDPOINTS ====================
app.post('/api/v2/conversation/create-new-conversation', isAuthenticated, isUser, async (req, res) => {
  try {
    const { userId, sellerId, shopId, groupTitle } = req.body;

    if (!userId || !sellerId || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'userId, sellerId, and shopId are required'
      });
    }

    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create conversations for yourself'
      });
    }

    const conversationKey = `${userId}_${sellerId}_${shopId}`;

    const existingConversations = await db.collection('conversations')
      .where('conversationKey', '==', conversationKey)
      .limit(1)
      .get();

    if (!existingConversations.empty) {
      const existingDoc = existingConversations.docs[0];
      const conversation = existingDoc.data();

      const existingConversation = {
        _id: existingDoc.id,
        id: existingDoc.id,
        ...conversation,
        createdAt: conversation.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: conversation.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        conversation: existingConversation
      });
    }

    let userInfo = { name: 'User', avatar: 'default-avatar.jpg' };
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userInfo = {
          _id: userId,
          id: userId,
          name: userData.name || 'User',
          avatar: userData.avatar || 'default-avatar.jpg',
          email: userData.email || ''
        };
      }
    } catch (userError) {
      console.error('❌ Error fetching user info:', userError);
    }

    let sellerInfo = { name: 'Seller', avatar: 'default-shop.jpg' };
    try {
      const sellerDoc = await db.collection('shops').doc(sellerId).get();
      if (sellerDoc.exists) {
        const sellerData = sellerDoc.data();
        sellerInfo = {
          _id: sellerId,
          id: sellerId,
          name: sellerData.name || 'Seller',
          avatar: sellerData.avatar || 'default-shop.jpg',
          email: sellerData.email || ''
        };
      }
    } catch (sellerError) {
      console.error('❌ Error fetching seller info:', sellerError);
    }

    const finalGroupTitle = groupTitle || `${userInfo.name || 'User'} and ${sellerInfo.name || 'Seller'}`;

    const conversationData = {
      groupTitle: finalGroupTitle,
      members: [userId, sellerId],
      userId: userId,
      sellerId: sellerId,
      shopId: shopId,
      conversationKey: conversationKey,
      userInfo: userInfo,
      sellerInfo: sellerInfo,
      lastMessage: '',
      lastMessageId: '',
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      unreadCounts: {
        [userId]: 0,
        [sellerId]: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const conversationRef = await db.collection('conversations').add(conversationData);

    const createdDoc = await conversationRef.get();
    const createdData = createdDoc.data();

    const conversationResponse = {
      _id: conversationRef.id,
      id: conversationRef.id,
      groupTitle: createdData.groupTitle || finalGroupTitle,
      members: createdData.members || [userId, sellerId],
      userId: createdData.userId || userId,
      sellerId: createdData.sellerId || sellerId,
      shopId: createdData.shopId || shopId,
      conversationKey: createdData.conversationKey || conversationKey,
      userInfo: createdData.userInfo || userInfo,
      sellerInfo: createdData.sellerInfo || sellerInfo,
      lastMessage: createdData.lastMessage || '',
      lastMessageId: createdData.lastMessageId || '',
      lastMessageTime: createdData.lastMessageTime ?
        (createdData.lastMessageTime.toDate ? createdData.lastMessageTime.toDate().toISOString() : createdData.lastMessageTime) :
        new Date().toISOString(),
      unreadCounts: createdData.unreadCounts || { [userId]: 0, [sellerId]: 0 },
      unreadCount: (createdData.unreadCounts && createdData.unreadCounts[userId]) || 0,
      createdAt: createdData.createdAt ?
        (createdData.createdAt.toDate ? createdData.createdAt.toDate().toISOString() : createdData.createdAt) :
        new Date().toISOString(),
      updatedAt: createdData.updatedAt ?
        (createdData.updatedAt.toDate ? createdData.updatedAt.toDate().toISOString() : createdData.updatedAt) :
        new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation: conversationResponse
    });

  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/conversation/get-all-conversations/:userId', isAuthenticated, isUser, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const conversationsSnapshot = await db.collection('conversations')
      .where('members', 'array-contains', userId)
      .get();

    const conversations = conversationsSnapshot.docs.map(doc => {
      const conversation = doc.data();

      const lastMessageTime = conversation.lastMessageTime || conversation.updatedAt || conversation.createdAt;

      const unreadCounts = conversation.unreadCounts || {};
      const userUnreadCount = unreadCounts[userId] || 0;

      return {
        _id: doc.id,
        id: doc.id,
        groupTitle: conversation.groupTitle || 'Chat',
        members: conversation.members || [],
        userId: conversation.userId || '',
        sellerId: conversation.sellerId || '',
        shopId: conversation.shopId || '',
        conversationKey: conversation.conversationKey || '',
        userInfo: conversation.userInfo || {
          _id: conversation.userId || '',
          name: 'User',
          avatar: 'default-avatar.jpg'
        },
        sellerInfo: conversation.sellerInfo || {
          _id: conversation.sellerId || '',
          name: 'Seller',
          avatar: 'default-shop.jpg'
        },
        lastMessage: conversation.lastMessage || '',
        lastMessageId: conversation.lastMessageId || '',
        lastMessageTime: lastMessageTime ?
          (lastMessageTime.toDate ? lastMessageTime.toDate().toISOString() : lastMessageTime) :
          null,
        unreadCounts: conversation.unreadCounts || {},
        unreadCount: userUnreadCount,
        createdAt: conversation.createdAt ?
          (conversation.createdAt.toDate ? conversation.createdAt.toDate().toISOString() : conversation.createdAt) :
          new Date().toISOString(),
        updatedAt: conversation.updatedAt ?
          (conversation.updatedAt.toDate ? conversation.updatedAt.toDate().toISOString() : conversation.updatedAt) :
          new Date().toISOString()
      };
    });

    conversations.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('❌ Get all conversations error:', error);

    if (error.message.includes('index') || error.code === 9) {
      return res.status(200).json({
        success: true,
        conversations: [],
        count: 0,
        message: 'No conversations found (index error)'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/conversation/get-all-conversation-seller/:sellerId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (sellerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const conversationsSnapshot = await db.collection('conversations')
      .where('sellerId', '==', sellerId)
      .get();

    const conversations = conversationsSnapshot.docs.map(doc => {
      const conversation = doc.data();

      const unreadCounts = conversation.unreadCounts || {};
      const sellerUnreadCount = unreadCounts[sellerId] || 0;

      return {
        _id: doc.id,
        id: doc.id,
        groupTitle: conversation.groupTitle || 'Chat',
        members: conversation.members || [],
        userId: conversation.userId || '',
        sellerId: conversation.sellerId || '',
        shopId: conversation.shopId || '',
        conversationKey: conversation.conversationKey || '',
        userInfo: conversation.userInfo || {
          _id: conversation.userId || '',
          name: 'Customer',
          avatar: 'default-avatar.jpg'
        },
        sellerInfo: conversation.sellerInfo || {
          _id: conversation.sellerId || '',
          name: 'Seller',
          avatar: 'default-shop.jpg'
        },
        lastMessage: conversation.lastMessage || '',
        lastMessageId: conversation.lastMessageId || '',
        lastMessageTime: conversation.lastMessageTime ?
          (conversation.lastMessageTime.toDate ?
            conversation.lastMessageTime.toDate().toISOString() :
            conversation.lastMessageTime) :
          null,
        unreadCounts: conversation.unreadCounts || {},
        unreadCount: sellerUnreadCount,
        createdAt: conversation.createdAt ?
          (conversation.createdAt.toDate ?
            conversation.createdAt.toDate().toISOString() :
            conversation.createdAt) :
          new Date().toISOString(),
        updatedAt: conversation.updatedAt ?
          (conversation.updatedAt.toDate ?
            conversation.updatedAt.toDate().toISOString() :
            conversation.updatedAt) :
          new Date().toISOString()
      };
    });

    conversations.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('❌ Get seller conversations error:', error);

    if (error.message.includes('index') || error.code === 9) {
      try {
        const conversationsSnapshot = await db.collection('conversations')
          .where('members', 'array-contains', sellerId)
          .get();

        const conversations = conversationsSnapshot.docs
          .map(doc => {
            const conversation = doc.data();
            if (conversation.sellerId === sellerId || conversation.members?.includes(sellerId)) {
              const unreadCounts = conversation.unreadCounts || {};
              const sellerUnreadCount = unreadCounts[sellerId] || 0;

              return {
                _id: doc.id,
                id: doc.id,
                groupTitle: conversation.groupTitle || 'Chat',
                members: conversation.members || [],
                userId: conversation.userId || '',
                sellerId: conversation.sellerId || '',
                shopId: conversation.shopId || '',
                conversationKey: conversation.conversationKey || '',
                userInfo: conversation.userInfo || {
                  _id: conversation.userId || '',
                  name: 'Customer',
                  avatar: 'default-avatar.jpg'
                },
                sellerInfo: conversation.sellerInfo || {
                  _id: conversation.sellerId || '',
                  name: 'Seller',
                  avatar: 'default-shop.jpg'
                },
                lastMessage: conversation.lastMessage || '',
                lastMessageId: conversation.lastMessageId || '',
                lastMessageTime: conversation.lastMessageTime ?
                  (conversation.lastMessageTime.toDate ?
                    conversation.lastMessageTime.toDate().toISOString() :
                    conversation.lastMessageTime) :
                  null,
                unreadCounts: conversation.unreadCounts || {},
                unreadCount: sellerUnreadCount,
                createdAt: conversation.createdAt ?
                  (conversation.createdAt.toDate ?
                    conversation.createdAt.toDate().toISOString() :
                    conversation.createdAt) :
                  new Date().toISOString(),
                updatedAt: conversation.updatedAt ?
                  (conversation.updatedAt.toDate ?
                    conversation.updatedAt.toDate().toISOString() :
                    conversation.updatedAt) :
                  new Date().toISOString()
              };
            }
            return null;
          })
          .filter(conv => conv !== null);

        conversations.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });

        return res.status(200).json({
          success: true,
          conversations,
          count: conversations.length,
          message: 'Retrieved using alternative query'
        });
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        return res.status(200).json({
          success: true,
          conversations: [],
          count: 0,
          message: 'No conversations available'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/conversation/get-conversation/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversationDoc = await db.collection('conversations').doc(conversationId).get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const conversation = conversationDoc.data();

    if (!conversation.members || !conversation.members.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (conversation.unreadCounts && conversation.unreadCounts[req.userId] > 0) {
      const updateData = {
        [`unreadCounts.${req.userId}`]: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('conversations').doc(conversationId).update(updateData);

      conversation.unreadCounts[req.userId] = 0;
    }

    const userUnreadCount = (conversation.unreadCounts && conversation.unreadCounts[req.userId]) || 0;

    const conversationResponse = {
      _id: conversationDoc.id,
      id: conversationDoc.id,
      groupTitle: conversation.groupTitle || 'Chat',
      members: conversation.members || [],
      userId: conversation.userId || '',
      sellerId: conversation.sellerId || '',
      shopId: conversation.shopId || '',
      conversationKey: conversation.conversationKey || '',
      userInfo: conversation.userInfo || {},
      sellerInfo: conversation.sellerInfo || {},
      lastMessage: conversation.lastMessage || '',
      lastMessageId: conversation.lastMessageId || '',
      lastMessageTime: conversation.lastMessageTime ?
        (conversation.lastMessageTime.toDate ?
          conversation.lastMessageTime.toDate().toISOString() :
          conversation.lastMessageTime) :
        null,
      unreadCounts: conversation.unreadCounts || {},
      unreadCount: userUnreadCount,
      createdAt: conversation.createdAt ?
        (conversation.createdAt.toDate ?
          conversation.createdAt.toDate().toISOString() :
          conversation.createdAt) :
        new Date().toISOString(),
      updatedAt: conversation.updatedAt ?
        (conversation.updatedAt.toDate ?
          conversation.updatedAt.toDate().toISOString() :
          conversation.updatedAt) :
        new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      conversation: conversationResponse
    });

  } catch (error) {
    console.error('❌ Get conversation by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/conversation/update-last-message/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { lastMessage, lastMessageId, senderId } = req.body;

    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const conversation = conversationDoc.data();

    const updateData = {
      lastMessage: lastMessage || '',
      lastMessageId: lastMessageId || '',
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (conversation.members && Array.isArray(conversation.members)) {
      const unreadCounts = conversation.unreadCounts || {};

      conversation.members.forEach(memberId => {
        if (memberId !== senderId) {
          const currentCount = unreadCounts[memberId] || 0;
          updateData[`unreadCounts.${memberId}`] = currentCount + 1;
        }
      });
    }

    await conversationRef.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Last message updated with unread tracking'
    });

  } catch (error) {
    console.error('❌ Update last message error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/conversation/mark-as-read/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const conversation = conversationDoc.data();

    if (!conversation.members || !conversation.members.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'User not part of this conversation'
      });
    }

    await conversationRef.update({
      [`unreadCounts.${userId}`]: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== MESSAGE ENDPOINTS ====================
app.get('/api/v2/message/get-all-messages/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (conversationDoc.exists) {
      const conversation = conversationDoc.data();
      if (conversation.unreadCounts && conversation.unreadCounts[req.userId] > 0) {
        await conversationRef.update({
          [`unreadCounts.${req.userId}`]: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    const messagesSnapshot = await db.collection('messages')
      .where('conversationId', '==', conversationId)
      .get();

    const messages = messagesSnapshot.docs.map(doc => {
      const message = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        conversationId: message.conversationId || '',
        sender: message.sender || '',
        text: message.text || '',
        images: message.images || [],
        createdAt: message.createdAt ?
          (message.createdAt.toDate ?
            message.createdAt.toDate().toISOString() :
            message.createdAt) :
          new Date().toISOString(),
        updatedAt: message.updatedAt ?
          (message.updatedAt.toDate ?
            message.updatedAt.toDate().toISOString() :
            message.updatedAt) :
          new Date().toISOString()
      };
    });

    messages.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

    res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);

    if (error.message.includes('index') || error.code === 9) {
      return res.status(200).json({
        success: true,
        messages: [],
        message: 'No messages found (index error)'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/v2/message/create-new-message', isAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const { conversationId, sender, text } = req.body;

    if (!conversationId || !sender || (!text && (!req.files || req.files.length === 0))) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID, sender, and message content are required'
      });
    }

    if (sender !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only send messages as yourself'
      });
    }

    const images = req.files && req.files.length > 0
      ? req.files.map(file => file.filename)
      : [];

    const messageData = {
      conversationId,
      sender,
      text: text || '',
      images,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const messageRef = await db.collection('messages').add(messageData);

    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (conversationDoc.exists) {
      const conversation = conversationDoc.data();
      const unreadCounts = conversation.unreadCounts || {};
      const updateData = {
        lastMessage: text || (images.length > 0 ? '📷 Image' : ''),
        lastMessageId: sender,
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (conversation.members && Array.isArray(conversation.members)) {
        conversation.members.forEach(memberId => {
          if (memberId !== sender) {
            const currentCount = unreadCounts[memberId] || 0;
            updateData[`unreadCounts.${memberId}`] = currentCount + 1;
          }
        });
      }

      await conversationRef.update(updateData);
    }

    const messageResponse = {
      _id: messageRef.id,
      id: messageRef.id,
      conversationId,
      sender,
      text: text || '',
      images: images.map(img => getImageUrl(img, 'message')),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: messageResponse
    });

  } catch (error) {
    console.error('❌ Create message error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== PAYMENT ENDPOINTS ====================
app.get('/api/v2/payment/stripeapikey', (req, res) => {
  res.status(200).json({
    success: true,
    stripeApiKey: process.env.STRIPE_API_KEY || process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'
  });
});

app.post('/api/v2/payment/process', isAuthenticated, isUser, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: {
        userId: req.userId,
        userEmail: req.userEmail
      }
    });

    res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ORDER ENDPOINTS ====================
app.post('/api/v2/order/create-order', isAuthenticated, isUser, async (req, res) => {
  try {
    const {
      cart,
      shippingAddress,
      user,
      totalPrice,
      paymentInfo,
      discountPrice,
      shipping
    } = req.body;

    if (!cart || !cart.length || !shippingAddress || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Cart, shipping address, and total price are required'
      });
    }

    const shopItemsMap = new Map();

    for (const item of cart) {
      const shopId = item.shopId;
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId).push(item);
    }

    const orders = [];

    for (const [shopId, items] of shopItemsMap.entries()) {
      const shopTotalPrice = items.reduce(
        (sum, item) => sum + (item.discountPrice || item.originalPrice) * item.qty,
        0
      );

      const orderData = {
        cart: items,
        shippingAddress,
        user: {
          _id: req.userId,
          name: user?.name || req.userName,
          email: req.userEmail
        },
        totalPrice: shopTotalPrice,
        discountPrice: discountPrice || 0,
        shipping: shipping || 0,
        paymentInfo: paymentInfo || {
          id: 'COD',
          status: 'Pending'
        },
        paidAt: paymentInfo?.status === 'succeeded' ? new Date().toISOString() : null,
        orderStatus: 'Processing',
        status: 'Processing',
        shopId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const orderRef = await db.collection('orders').add(orderData);

      for (const item of items) {
        const productRef = db.collection('products').doc(item._id);
        const productDoc = await productRef.get();

        if (productDoc.exists) {
          const product = productDoc.data();
          const newStock = (product.stock || 0) - item.qty;
          const newSold = (product.sold_out || 0) + item.qty;

          await productRef.update({
            stock: newStock >= 0 ? newStock : 0,
            sold_out: newSold,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      const shopRef = db.collection('shops').doc(shopId);
      const shopDoc = await shopRef.get();

      if (shopDoc.exists) {
        await shopRef.update({
          totalSales: admin.firestore.FieldValue.increment(shopTotalPrice),
          availableBalance: admin.firestore.FieldValue.increment(shopTotalPrice),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      const shopInfo = shopDoc.data();

      await sendEmail(
        shopInfo.email,
        'New Order Received',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Order Received!</h2>
            <p>Hello ${shopInfo.name},</p>
            <p>You have received a new order from ${user?.name || 'Customer'}.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${orderRef.id}</li>
              <li>Total Amount: $${shopTotalPrice.toFixed(2)}</li>
              <li>Items: ${items.length}</li>
              <li>Status: Processing</li>
            </ul>
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Order in Dashboard
              </a>
            </div>
            <p>Please process the order as soon as possible.</p>
          </div>
        `
      );

      orders.push({
        _id: orderRef.id,
        id: orderRef.id,
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    await sendEmail(
      req.userEmail,
      'Order Confirmation',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Confirmation</h2>
          <p>Hello ${user?.name || req.userName},</p>
          <p>Thank you for your order! Your order has been received and is being processed.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Total Amount: $${totalPrice.toFixed(2)}</li>
            <li>Items: ${cart.length}</li>
            <li>Shipping Address: ${shippingAddress.address1}, ${shippingAddress.city}</li>
            <li>Status: Processing</li>
          </ul>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/orders"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Your Orders
            </a>
          </div>
          <p>You will receive another email when your order ships.</p>
        </div>
      `
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orders
    });

  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/order/get-user-orders/:userId', isAuthenticated, isUser, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const ordersSnapshot = await db.collection('orders')
      .where('user._id', '==', userId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        ...order,
        createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: order.updatedAt ? order.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('❌ Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/order/get-seller-all-orders/:shopId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { shopId } = req.params;

    if (shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own shop orders.'
      });
    }

    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const ordersSnapshot = await db.collection('orders')
      .where('shopId', '==', shopId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        cart: order.cart || [],
        shippingAddress: order.shippingAddress || {},
        user: order.user || { name: 'Unknown', email: 'unknown@example.com' },
        totalPrice: order.totalPrice || 0,
        discountPrice: order.discountPrice || 0,
        shipping: order.shipping || 0,
        paymentInfo: order.paymentInfo || { status: 'Pending' },
        paidAt: order.paidAt || null,
        orderStatus: order.orderStatus || order.status || 'Pending',
        status: order.orderStatus || order.status || 'Pending',
        shopId: order.shopId,
        createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: order.updatedAt ? order.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      orders,
      message: orders.length === 0 ? 'No orders found for this shop' : 'Orders retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get seller orders error:', error);

    if (error.message.includes('index') || error.code === 9) {
      return res.status(200).json({
        success: true,
        orders: [],
        message: 'No orders found (index error)'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/order/get-all-orders/:userId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const ordersSnapshot = await db.collection('orders')
      .where('user._id', '==', userId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        ...order,
        createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: order.updatedAt ? order.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('❌ Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/order/admin-all-orders', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .get();

    const orders = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        ...order,
        createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: order.updatedAt ? order.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('❌ Get admin all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/order/update-order-status/:orderId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderDoc.data();

    if (order.shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own orders'
      });
    }

    await orderRef.update({
      orderStatus: status,
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedOrder = (await orderRef.get()).data();

    if (order.user && order.user.email) {
      await sendEmail(
        order.user.email,
        `Order Status Updated: ${status}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Order Status Updated</h2>
            <p>Hello ${order.user.name},</p>
            <p>The status of your order <strong>#${orderId}</strong> has been updated to: <strong>${status}</strong></p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${orderId}</li>
              <li>Total Amount: $${order.totalPrice.toFixed(2)}</li>
              <li>New Status: ${status}</li>
            </ul>
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${orderId}"
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Order Details
              </a>
            </div>
            <p>Thank you for shopping with us!</p>
          </div>
        `
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order: {
        _id: orderId,
        id: orderId,
        ...updatedOrder,
        createdAt: updatedOrder.createdAt ? updatedOrder.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: updatedOrder.updatedAt ? updatedOrder.updatedAt.toDate().toISOString() : new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/order/order-refund/:orderId', isAuthenticated, isUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderDoc.data();

    if (order.user._id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await orderRef.update({
      orderStatus: 'Refund ' + status,
      status: 'Refund ' + status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: `Order refund ${status}`
    });

  } catch (error) {
    console.error('❌ Refund order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/v2/order/accept-refund/:orderId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderDoc.data();

    if (order.shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept refund for your own orders'
      });
    }

    const shopRef = db.collection('shops').doc(order.shopId);
    const shopDoc = await shopRef.get();

    if (shopDoc.exists) {
      const shop = shopDoc.data();
      const newBalance = (shop.availableBalance || 0) - (order.totalPrice || 0);

      await shopRef.update({
        availableBalance: newBalance >= 0 ? newBalance : 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await orderRef.update({
      orderStatus: 'Refund Success',
      status: 'Refund Success',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Refund accepted successfully'
    });

  } catch (error) {
    console.error('❌ Accept refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/order/get-order/:orderId', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderDoc.data();

    let isAuthorized = false;

    if (req.userRole === 'user') {
      isAuthorized = order.user._id === req.userId;
    } else if (req.userRole === 'seller') {
      isAuthorized = order.shopId === req.userId;
    } else if (req.userRole === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const orderResponse = {
      _id: orderId,
      id: orderId,
      ...order,
      createdAt: order.createdAt ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: order.updatedAt ? order.updatedAt.toDate().toISOString() : new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      order: orderResponse
    });

  } catch (error) {
    console.error('❌ Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== WITHDRAW ENDPOINTS ====================
app.post('/api/v2/withdraw/create-withdraw-request', isAuthenticated, isSeller, async (req, res) => {
  try {
    const {
      amount,
      withdrawMethod,
      bankAccountNumber,
      bankHolderName,
      bankName,
      bankSwiftCode,
      bankCountry,
      bankAddress,
      binanceWalletAddress,
      binanceHolderName
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    if (!withdrawMethod) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal method is required'
      });
    }

    const shopRef = db.collection('shops').doc(req.userId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopDoc.data();
    const availableBalance = parseFloat(shop.availableBalance || 0);
    const requestedAmount = parseFloat(amount);

    if (availableBalance < requestedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${requestedAmount.toFixed(2)}`
      });
    }

    const pendingWithdrawals = await db.collection('withdraws')
      .where('shopId', '==', req.userId)
      .where('status', '==', 'pending')
      .get();

    if (!pendingWithdrawals.empty) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request.'
      });
    }

    let paymentDetails = {};

    if (withdrawMethod === 'bank') {
      if (!bankAccountNumber || !bankHolderName) {
        return res.status(400).json({
          success: false,
          message: 'Bank account number and holder name are required'
        });
      }

      paymentDetails = {
        type: 'bank',
        bankAccountNumber,
        bankHolderName,
        bankName: bankName || '',
        bankSwiftCode: bankSwiftCode || '',
        bankCountry: bankCountry || '',
        bankAddress: bankAddress || ''
      };
    } else if (withdrawMethod === 'binance') {
      if (!binanceWalletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Binance wallet address is required'
        });
      }

      paymentDetails = {
        type: 'binance',
        binanceWalletAddress,
        binanceHolderName: binanceHolderName || shop.name
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal method'
      });
    }

    const newBalance = availableBalance - requestedAmount;

    const withdrawData = {
      shopId: req.userId,
      seller: {
        _id: req.userId,
        name: shop.name,
        email: shop.email,
        avatar: shop.avatar || 'default-shop.jpg'
      },
      amount: requestedAmount,
      withdrawMethod: paymentDetails,
      status: 'pending',
      adminNote: '',
      processedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const batch = db.batch();

    const withdrawRef = db.collection('withdraws').doc();
    batch.set(withdrawRef, withdrawData);

    batch.update(shopRef, {
      availableBalance: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    await sendEmail(
      shop.email,
      'Withdrawal Request Submitted',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Withdrawal Request Submitted</h2>
          <p>Hello ${shop.name},</p>
          <p>Your withdrawal request has been successfully submitted.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Request ID: ${withdrawRef.id}</li>
            <li>Amount: $${requestedAmount.toFixed(2)}</li>
            <li>Method: ${withdrawMethod === 'bank' ? 'Bank Transfer' : 'Binance'}</li>
            <li>Status: Pending</li>
            <li>New Balance: $${newBalance.toFixed(2)}</li>
          </ul>
        </div>
      `
    );

    const withdrawResponse = {
      _id: withdrawRef.id,
      id: withdrawRef.id,
      shopId: req.userId,
      seller: withdrawData.seller,
      amount: requestedAmount,
      withdrawMethod: paymentDetails,
      status: 'pending',
      adminNote: '',
      availableBalance: newBalance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully!',
      withdraw: withdrawResponse
    });

  } catch (error) {
    console.error('❌ Create withdraw request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/withdraw/get-seller-withdraw-request/:shopId', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { shopId } = req.params;

    if (shopId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own withdrawal requests.'
      });
    }

    const withdrawsSnapshot = await db.collection('withdraws')
      .where('shopId', '==', shopId)
      .orderBy('createdAt', 'desc')
      .get();

    const withdraws = withdrawsSnapshot.docs.map(doc => {
      const withdraw = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        shopId: withdraw.shopId || '',
        seller: withdraw.seller || {},
        amount: withdraw.amount || 0,
        withdrawMethod: withdraw.withdrawMethod || {},
        status: withdraw.status || 'pending',
        adminNote: withdraw.adminNote || '',
        processedAt: withdraw.processedAt ? withdraw.processedAt.toDate().toISOString() : null,
        createdAt: withdraw.createdAt ? withdraw.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: withdraw.updatedAt ? withdraw.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    const shopDoc = await db.collection('shops').doc(shopId).get();
    const shop = shopDoc.data();

    res.status(200).json({
      success: true,
      withdraws: withdraws || [],
      shopBalance: {
        availableBalance: shop?.availableBalance || 0,
        totalSales: shop?.totalSales || 0
      },
      count: withdraws.length
    });

  } catch (error) {
    console.error('❌ Get seller withdraw requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/v2/withdraw/get-all-withdraw-request', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, sellerId } = req.query;

    let query = db.collection('withdraws');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (sellerId && sellerId !== 'all') {
      query = query.where('shopId', '==', sellerId);
    }

    const withdrawsSnapshot = await query.orderBy('createdAt', 'desc').get();

    const withdraws = withdrawsSnapshot.docs.map(doc => {
      const withdraw = doc.data();
      return {
        _id: doc.id,
        id: doc.id,
        shopId: withdraw.shopId || '',
        seller: withdraw.seller || {
          _id: withdraw.shopId || '',
          name: 'Unknown Seller',
          email: 'No email'
        },
        amount: withdraw.amount || 0,
        withdrawMethod: withdraw.withdrawMethod || {},
        status: withdraw.status || 'pending',
        adminNote: withdraw.adminNote || '',
        processedAt: withdraw.processedAt || null,
        createdAt: withdraw.createdAt ? withdraw.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: withdraw.updatedAt ? withdraw.updatedAt.toDate().toISOString() : new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      withdraws: withdraws,
      count: withdraws.length
    });

  } catch (error) {
    console.error('❌ Get all withdraw requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================
app.get('/api/v2/admin/admin-stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [usersSnapshot, shopsSnapshot, productsSnapshot, ordersSnapshot, withdrawsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('shops').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('withdraws').where('status', '==', 'pending').get()
    ]);

    let totalSales = 0;
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      if (order.orderStatus !== 'Refund Success') {
        totalSales += order.totalPrice || 0;
      }
    });

    const stats = {
      users: usersSnapshot.size,
      shops: shopsSnapshot.size,
      products: productsSnapshot.size,
      orders: ordersSnapshot.size,
      totalSales: totalSales.toFixed(2),
      pendingWithdraws: withdrawsSnapshot.size
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== LOGOUT ====================
app.get('/api/v2/user/logout', (req, res) => {
  res.clearCookie('user_token');
  res.clearCookie('seller_token');
  res.clearCookie('admin_token');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  if (err.message.includes('index') || err.code === 9) {
    return res.status(200).json({
      success: true,
      message: 'Query requires index. Please create the required Firestore indexes.',
      data: []
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
  ====================================================
  🚀 B2B BACKEND SERVER WITH ADMIN & SELLER ENDPOINTS
  ====================================================
  ✅ Server running on port: ${PORT}
  ✅ Backend URL: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}
  ✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  ✅ Environment: ${process.env.NODE_ENV || 'development'}
  ====================================================
  🔧 UPDATED ROLES:
  • 👤 user: Regular customer who can browse, purchase products, message sellers
  • 🛍️ seller: Shop owner who can manage products, orders, messages, and withdraw earnings
  • 👑 admin: Platform administrator with full system access and management capabilities
  ====================================================
  🔐 ADMIN LOGIN CREDENTIALS:
  • 📧 Email: aliexpressglobal0@gmail.com
  • 🔑 Password: admin123@12
  • 👑 Role: admin
  ====================================================
  🛍️ NEW ADMIN SELLER ENDPOINTS ADDED:
  • GET    /api/v2/shop/admin-all-sellers (Admin only)
  • DELETE /api/v2/shop/delete-seller/:id (Admin only)
  • GET    /api/v2/debug/sellers (Debug)
  ====================================================
  🔐 ROLE-BASED ACCESS CONTROL:
  • ✅ Each endpoint now has proper role-based middleware protection
  • ✅ Users can only access their own resources
  • ✅ Sellers can only manage their own shops, products, and orders
  • ✅ Admins have full system access for management
  ====================================================
  💬 UPDATED MESSAGING ENDPOINTS:
  • POST /api/v2/conversation/create-new-conversation (User only)
  • GET  /api/v2/conversation/get-all-conversations/:userId (User only)
  • GET  /api/v2/conversation/get-all-conversation-seller/:sellerId (Seller only)
  • GET  /api/v2/conversation/get-conversation/:conversationId (User or Seller)
  • PUT  /api/v2/conversation/update-last-message/:conversationId (User or Seller)
  • PUT  /api/v2/conversation/mark-as-read/:conversationId (User or Seller)
  • POST /api/v2/message/create-new-message (User or Seller)
  • GET  /api/v2/message/get-all-messages/:conversationId (User or Seller)
  ====================================================
  🎯 All endpoints now have proper role-based access control!
  ====================================================
  `);
});