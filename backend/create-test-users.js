// create-test-users.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestUsers() {
  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating test users...');
    
    // Create admin user
    const adminUser = await db.collection('users').add({
      name: 'System Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      avatar: 'default-avatar.jpg',
      role: 'admin',
      isActive: true,
      phoneNumber: '1234567890',
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create regular user
    const regularUser = await db.collection('users').add({
      name: 'John Doe',
      email: 'user@test.com',
      password: hashedPassword,
      avatar: 'default-avatar.jpg',
      role: 'user',
      isActive: true,
      phoneNumber: '0987654321',
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create seller
    const seller = await db.collection('shops').add({
      name: 'Test Shop',
      email: 'seller@test.com',
      password: hashedPassword,
      address: '123 Main Street, City',
      phoneNumber: '555-123-4567',
      zipCode: '12345',
      avatar: 'default-shop.jpg',
      role: 'seller',
      isActive: true,
      availableBalance: 1000,
      lockedBalance: 0,
      totalSales: 5000,
      ratings: 4.5,
      description: 'A test shop for demonstration',
      category: 'Electronics',
      totalProducts: 0,
      withdrawMethod: null,
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`
    ✅ TEST USERS CREATED SUCCESSFULLY
    ====================================
    Admin User:
    • Email: admin@test.com
    • Password: admin123
    • ID: ${adminUser.id}
    
    Regular User:
    • Email: user@test.com
    • Password: admin123
    • ID: ${regularUser.id}
    
    Seller/Shop:
    • Email: seller@test.com
    • Password: admin123
    • ID: ${seller.id}
    ====================================
    `);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();