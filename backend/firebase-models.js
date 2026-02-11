// backend/firebase-models.js
const { db } = require('./config/firebase-config');
const { timestamp, increment } = require('./config/firebase-helpers');

// User Model for Firestore
const User = {
  collection: 'users',
  
  create: async (userData) => {
    try {
      const userRef = await db.collection('users').add({
        ...userData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        role: userData.role || 'user',
        isActive: true,
        addresses: userData.addresses || []
      });
      return { id: userRef.id, ...userData };
    } catch (error) {
      throw error;
    }
  },

  findByEmail: async (email) => {
    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      await db.collection('users').doc(id).update({
        ...updateData,
        updatedAt: timestamp()
      });
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
};

// Shop Model for Firestore
const Shop = {
  collection: 'shops',
  
  create: async (shopData) => {
    try {
      const shopRef = await db.collection('shops').add({
        ...shopData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        role: 'seller',
        isActive: true,
        availableBalance: shopData.availableBalance || 0,
        lockedBalance: shopData.lockedBalance || 0,
        totalSales: shopData.totalSales || 0,
        ratings: shopData.ratings || 0,
        totalProducts: shopData.totalProducts || 0,
        transactions: shopData.transactions || []
      });
      return { id: shopRef.id, ...shopData };
    } catch (error) {
      throw error;
    }
  },

  findByEmail: async (email) => {
    try {
      const snapshot = await db.collection('shops')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const doc = await db.collection('shops').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      await db.collection('shops').doc(id).update({
        ...updateData,
        updatedAt: timestamp()
      });
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  },

  incrementProductCount: async (id) => {
    try {
      await db.collection('shops').doc(id).update({
        totalProducts: increment(1),
        updatedAt: timestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  getAll: async (limit = 50) => {
    try {
      const snapshot = await db.collection('shops')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  }
};

// Product Model for Firestore
const Product = {
  collection: 'products',
  
  create: async (productData) => {
    try {
      const productRef = await db.collection('products').add({
        ...productData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        ratings: productData.ratings || 0,
        sold_out: productData.sold_out || 0,
        reviews: productData.reviews || [],
        isImported: productData.isImported || false,
        externalSource: productData.externalSource || 'MANUAL'
      });
      return { id: productRef.id, ...productData };
    } catch (error) {
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const doc = await db.collection('products').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  },

  findByShopId: async (shopId) => {
    try {
      const snapshot = await db.collection('products')
        .where('shopId', '==', shopId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  getAll: async (limit = 50) => {
    try {
      const snapshot = await db.collection('products')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      await db.collection('products').doc(id).update({
        ...updateData,
        updatedAt: timestamp()
      });
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await db.collection('products').doc(id).delete();
      return true;
    } catch (error) {
      throw error;
    }
  },

  count: async () => {
    try {
      const snapshot = await db.collection('products').get();
      return snapshot.size;
    } catch (error) {
      throw error;
    }
  }
};

// Event Model for Firestore
const Event = {
  collection: 'events',
  
  create: async (eventData) => {
    try {
      const eventRef = await db.collection('events').add({
        ...eventData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        status: eventData.status || 'Running',
        ratings: 0,
        sold_out: 0,
        reviews: []
      });
      return { id: eventRef.id, ...eventData };
    } catch (error) {
      throw error;
    }
  },

  getAll: async (limit = 50) => {
    try {
      const snapshot = await db.collection('events')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  findByShopId: async (shopId) => {
    try {
      const snapshot = await db.collection('events')
        .where('shopId', '==', shopId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  count: async () => {
    try {
      const snapshot = await db.collection('events').get();
      return snapshot.size;
    } catch (error) {
      throw error;
    }
  }
};

// Order Model for Firestore
const Order = {
  collection: 'orders',
  
  create: async (orderData) => {
    try {
      const orderRef = await db.collection('orders').add({
        ...orderData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        status: orderData.status || 'Processing'
      });
      return { id: orderRef.id, ...orderData };
    } catch (error) {
      throw error;
    }
  },

  findByUserId: async (userId) => {
    try {
      const snapshot = await db.collection('orders')
        .where('user.id', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  findByShopId: async (shopId) => {
    try {
      const snapshot = await db.collection('orders')
        .where('cart', 'array-contains', { shopId })
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  getAll: async () => {
    try {
      const snapshot = await db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  count: async () => {
    try {
      const snapshot = await db.collection('orders').get();
      return snapshot.size;
    } catch (error) {
      throw error;
    }
  }
};

// Conversation Model for Firestore
const Conversation = {
  collection: 'conversations',
  
  create: async (conversationData) => {
    try {
      const conversationRef = await db.collection('conversations').add({
        ...conversationData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        lastMessage: conversationData.lastMessage || '',
        lastMessageId: conversationData.lastMessageId || ''
      });
      return { id: conversationRef.id, ...conversationData };
    } catch (error) {
      throw error;
    }
  },

  findByMember: async (memberId) => {
    try {
      const snapshot = await db.collection('conversations')
        .where('members', 'array-contains', memberId)
        .orderBy('updatedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      await db.collection('conversations').doc(id).update({
        ...updateData,
        updatedAt: timestamp()
      });
    } catch (error) {
      throw error;
    }
  }
};

// Message Model for Firestore
const Message = {
  collection: 'messages',
  
  create: async (messageData) => {
    try {
      const messageRef = await db.collection('messages').add({
        ...messageData,
        createdAt: timestamp()
      });
      return { id: messageRef.id, ...messageData };
    } catch (error) {
      throw error;
    }
  },

  findByConversationId: async (conversationId) => {
    try {
      const snapshot = await db.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  }
};

// CoupounCode Model for Firestore
const CoupounCode = {
  collection: 'coupounCodes',
  
  create: async (coupounData) => {
    try {
      const coupounRef = await db.collection('coupounCodes').add({
        ...coupounData,
        createdAt: timestamp()
      });
      return { id: coupounRef.id, ...coupounData };
    } catch (error) {
      throw error;
    }
  },

  findByShopId: async (shopId) => {
    try {
      const snapshot = await db.collection('coupounCodes')
        .where('shopId', '==', shopId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  findByName: async (name) => {
    try {
      const snapshot = await db.collection('coupounCodes')
        .where('name', '==', name)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }
};

// Withdraw Model for Firestore
const Withdraw = {
  collection: 'withdraws',
  
  create: async (withdrawData) => {
    try {
      const withdrawRef = await db.collection('withdraws').add({
        ...withdrawData,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        status: withdrawData.status || 'pending',
        processedAt: withdrawData.processedAt || null
      });
      return { id: withdrawRef.id, ...withdrawData };
    } catch (error) {
      throw error;
    }
  },

  findBySellerId: async (sellerId) => {
    try {
      const snapshot = await db.collection('withdraws')
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  getAll: async () => {
    try {
      const snapshot = await db.collection('withdraws')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      await db.collection('withdraws').doc(id).update({
        ...updateData,
        updatedAt: timestamp()
      });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = {
  User,
  Shop,
  Product,
  Event,
  Order,
  Conversation,
  Message,
  CoupounCode,
  Withdraw
};