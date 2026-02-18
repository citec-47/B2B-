// firebase-migrator.js - COMPLETE MIGRATION HELPER
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

class FirebaseMigrator {
  constructor(serviceAccountPath, mongodbUri) {
    this.serviceAccountPath = serviceAccountPath;
    this.mongodbUri = mongodbUri;
    this.db = null;
    this.mongooseModels = {};
  }

  // Initialize Firebase
  async initFirebase() {
    try {
      const serviceAccount = require(this.serviceAccountPath);
      
      // Check if Firebase is already initialized
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        console.log('✅ Firebase initialized');
      } catch (error) {
        if (error.code === 'app/duplicate-app') {
          console.log('✅ Using existing Firebase app');
        } else {
          throw error;
        }
      }
      
      this.db = admin.firestore();
      this.db.settings({ ignoreUndefinedProperties: true });
      
      console.log(`📁 Connected to Firebase project: ${serviceAccount.project_id}`);
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      return false;
    }
  }

  // Initialize MongoDB
  async initMongoDB() {
    try {
      await mongoose.connect(this.mongodbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      
      console.log('✅ MongoDB connected');
      
      // Define MongoDB models based on your schema
      this.defineMongoModels();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      return false;
    }
  }

  // Define MongoDB models
  defineMongoModels() {
    // User Schema
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

    // Shop Schema
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

    // Product Schema
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

    // Order Schema (if exists)
    const OrderSchema = new mongoose.Schema({
      userId: String,
      products: Array,
      totalAmount: Number,
      status: String,
      shippingAddress: Object,
      paymentMethod: String,
      createdAt: Date,
      updatedAt: Date
    });

    this.mongooseModels = {
      User: mongoose.models.User || mongoose.model('User', UserSchema),
      Shop: mongoose.models.Shop || mongoose.model('Shop', ShopSchema),
      Product: mongoose.models.Product || mongoose.model('Product', ProductSchema),
      Order: mongoose.models.Order || mongoose.model('Order', OrderSchema)
    };
  }

  // Convert MongoDB document to Firestore format
  convertToFirestore(doc, collectionName) {
    if (!doc) return null;
    
    const data = doc.toObject ? doc.toObject() : doc;
    const { _id, __v, ...rest } = data;
    
    // Convert dates to ISO strings
    Object.keys(rest).forEach(key => {
      if (rest[key] instanceof Date) {
        rest[key] = rest[key].toISOString();
      }
    });
    
    // Add metadata
    rest._migrated = true;
    rest._migratedAt = new Date().toISOString();
    rest._sourceId = _id ? _id.toString() : null;
    
    return {
      id: _id ? _id.toString() : null,
      data: rest
    };
  }

  // Migrate collection
  async migrateCollection(mongoCollection, firestoreCollection, query = {}, limit = null) {
    console.log(`\n📦 Migrating ${mongoCollection} to ${firestoreCollection}...`);
    
    try {
      const Model = this.mongooseModels[mongoCollection];
      if (!Model) {
        console.error(`❌ MongoDB model ${mongoCollection} not found`);
        return { success: false, count: 0 };
      }

      let mongoQuery = Model.find(query);
      if (limit) {
        mongoQuery = mongoQuery.limit(limit);
      }

      const documents = await mongoQuery.exec();
      console.log(`📊 Found ${documents.length} documents in ${mongoCollection}`);

      let successCount = 0;
      let errorCount = 0;

      for (const doc of documents) {
        try {
          const converted = this.convertToFirestore(doc, mongoCollection);
          
          if (converted.id) {
            // Use the MongoDB _id as Firestore document ID
            await this.db.collection(firestoreCollection)
              .doc(converted.id)
              .set(converted.data, { merge: true });
          } else {
            // Generate new ID
            await this.db.collection(firestoreCollection)
              .add(converted.data);
          }
          
          successCount++;
          
          if (successCount % 10 === 0) {
            console.log(`   Processed ${successCount}/${documents.length}...`);
          }
        } catch (error) {
          errorCount++;
          console.error(`   Error migrating document: ${error.message}`);
        }
      }

      console.log(`✅ ${mongoCollection} migration complete:`);
      console.log(`   Success: ${successCount}, Failed: ${errorCount}`);
      
      return {
        success: true,
        count: successCount,
        errors: errorCount
      };
    } catch (error) {
      console.error(`❌ Migration failed for ${mongoCollection}:`, error.message);
      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }

  // Migrate all collections
  async migrateAll(limit = null) {
    console.log('🚀 Starting complete migration from MongoDB to Firebase...\n');
    
    // Initialize connections
    const firebaseReady = await this.initFirebase();
    const mongoReady = await this.initMongoDB();
    
    if (!firebaseReady || !mongoReady) {
      console.error('❌ Failed to initialize connections');
      return false;
    }
    
    const collections = [
      { mongo: 'User', firestore: 'users' },
      { mongo: 'Shop', firestore: 'shops' },
      { mongo: 'Product', firestore: 'products' },
      { mongo: 'Order', firestore: 'orders' }
    ];
    
    const results = {};
    
    for (const collection of collections) {
      const result = await this.migrateCollection(
        collection.mongo,
        collection.firestore,
        {},
        limit
      );
      results[collection.mongo] = result;
    }
    
    // Summary
    console.log('\n🎉 MIGRATION SUMMARY');
    console.log('===================');
    
    let totalMigrated = 0;
    let totalErrors = 0;
    
    Object.keys(results).forEach(key => {
      const result = results[key];
      console.log(`${key}: ${result.count} documents migrated`);
      if (result.errors) {
        console.log(`   Errors: ${result.errors}`);
        totalErrors += result.errors;
      }
      totalMigrated += result.count;
    });
    
    console.log(`\n📊 TOTAL: ${totalMigrated} documents migrated`);
    console.log(`❌ Errors: ${totalErrors}`);
    
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
    
    return true;
  }

  // Create Firestore indexes for common queries
  async createIndexes() {
    console.log('\n🔍 Creating Firestore indexes...');
    
    const indexes = [
      { collection: 'users', field: 'email', type: 'asc' },
      { collection: 'users', field: 'role', type: 'asc' },
      { collection: 'shops', field: 'email', type: 'asc' },
      { collection: 'products', field: 'category', type: 'asc' },
      { collection: 'products', field: 'createdAt', type: 'desc' },
      { collection: 'products', field: 'shopId', type: 'asc' },
      { collection: 'orders', field: 'userId', type: 'asc' },
      { collection: 'orders', field: 'status', type: 'asc' }
    ];
    
    // Note: Firestore indexes are created automatically when needed
    // This is just for documentation
    console.log('✅ Index recommendations created');
    console.log('📋 Add these to your firestore.indexes.json:');
    
    indexes.forEach(index => {
      console.log(`   • ${index.collection}.${index.field} (${index.type})`);
    });
    
    return true;
  }

  // Verify migration
  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    const collections = ['users', 'shops', 'products', 'orders'];
    
    for (const collection of collections) {
      try {
        const snapshot = await this.db.collection(collection)
          .where('_migrated', '==', true)
          .limit(5)
          .get();
        
        console.log(`${collection}: ${snapshot.size} migrated documents found`);
        
        if (snapshot.size > 0) {
          const doc = snapshot.docs[0];
          console.log(`   Sample: ${doc.id} - ${doc.data().name || doc.data().email || 'No name'}`);
        }
      } catch (error) {
        console.error(`   Error verifying ${collection}: ${error.message}`);
      }
    }
    
    console.log('✅ Verification complete');
    return true;
  }

  // Clean up migrated data (remove migration metadata)
  async cleanupMigrationMetadata() {
    console.log('\n🧹 Cleaning up migration metadata...');
    
    const collections = ['users', 'shops', 'products', 'orders'];
    let cleaned = 0;
    
    for (const collection of collections) {
      try {
        const snapshot = await this.db.collection(collection)
          .where('_migrated', '==', true)
          .get();
        
        const batch = this.db.batch();
        let batchCount = 0;
        
        snapshot.docs.forEach(doc => {
          const update = {
            _migrated: admin.firestore.FieldValue.delete(),
            _migratedAt: admin.firestore.FieldValue.delete(),
            _sourceId: admin.firestore.FieldValue.delete()
          };
          
          batch.update(doc.ref, update);
          batchCount++;
          cleaned++;
          
          // Firestore batches limited to 500 operations
          if (batchCount >= 500) {
            batch.commit();
            batchCount = 0;
          }
        });
        
        if (batchCount > 0) {
          await batch.commit();
        }
        
        console.log(`   ${collection}: ${snapshot.size} documents cleaned`);
      } catch (error) {
        console.error(`   Error cleaning ${collection}: ${error.message}`);
      }
    }
    
    console.log(`✅ Total cleaned: ${cleaned} documents`);
    return cleaned;
  }
}

// Utility functions for code conversion
const FirebaseUtils = {
  // Convert MongoDB query to Firestore query
  convertQuery: (mongoQuery) => {
    const firestoreQuery = {};
    
    Object.keys(mongoQuery).forEach(key => {
      if (key === '_id') {
        firestoreQuery.id = mongoQuery[key];
      } else if (typeof mongoQuery[key] === 'object') {
        // Handle MongoDB operators
        if (mongoQuery[key].$eq) {
          firestoreQuery[key] = mongoQuery[key].$eq;
        } else if (mongoQuery[key].$gt) {
          firestoreQuery[key] = admin.firestore.FieldValue.greaterThan(mongoQuery[key].$gt);
        } else if (mongoQuery[key].$lt) {
          firestoreQuery[key] = admin.firestore.FieldValue.lessThan(mongoQuery[key].$lt);
        } else if (mongoQuery[key].$in) {
          firestoreQuery[key] = admin.firestore.FieldValue.arrayContainsAny(mongoQuery[key].$in);
        }
      } else {
        firestoreQuery[key] = mongoQuery[key];
      }
    });
    
    return firestoreQuery;
  },

  // Convert MongoDB update to Firestore update
  convertUpdate: (mongoUpdate) => {
    const firestoreUpdate = {};
    
    Object.keys(mongoUpdate).forEach(key => {
      if (key === '$set') {
        Object.keys(mongoUpdate.$set).forEach(field => {
          firestoreUpdate[field] = mongoUpdate.$set[field];
        });
      } else if (key === '$inc') {
        Object.keys(mongoUpdate.$inc).forEach(field => {
          firestoreUpdate[field] = admin.firestore.FieldValue.increment(mongoUpdate.$inc[field]);
        });
      } else if (key === '$push') {
        Object.keys(mongoUpdate.$push).forEach(field => {
          firestoreUpdate[field] = admin.firestore.FieldValue.arrayUnion(mongoUpdate.$push[field]);
        });
      } else if (key === '$pull') {
        Object.keys(mongoUpdate.$pull).forEach(field => {
          firestoreUpdate[field] = admin.firestore.FieldValue.arrayRemove(mongoUpdate.$pull[field]);
        });
      }
    });
    
    return firestoreUpdate;
  },

  // Code conversion examples
  codeExamples: {
    // MongoDB: User.find({ email: 'test@example.com' })
    // Firestore: db.collection('users').where('email', '==', 'test@example.com').get()
    
    // MongoDB: User.findById('123')
    // Firestore: db.collection('users').doc('123').get()
    
    // MongoDB: User.create({ name: 'John', email: 'john@example.com' })
    // Firestore: db.collection('users').add({ name: 'John', email: 'john@example.com' })
    
    // MongoDB: User.updateOne({ _id: '123' }, { $set: { name: 'Jane' } })
    // Firestore: db.collection('users').doc('123').update({ name: 'Jane' })
    
    // MongoDB: User.deleteOne({ _id: '123' })
    // Firestore: db.collection('users').doc('123').delete()
  }
};

// Export for use in other files
module.exports = {
  FirebaseMigrator,
  FirebaseUtils
};

// CLI interface for running migration
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const migrator = new FirebaseMigrator(
    path.join(__dirname, '..', 'serviceAccountKey.json'),
    process.env.MONGODB_URI || 'mongodb://localhost:27017/multi'
  );
  
  async function run() {
    switch (command) {
      case 'migrate':
        await migrator.migrateAll(args[1] ? parseInt(args[1]) : null);
        break;
      case 'verify':
        await migrator.initFirebase();
        await migrator.verifyMigration();
        break;
      case 'cleanup':
        await migrator.initFirebase();
        await migrator.cleanupMigrationMetadata();
        break;
      case 'indexes':
        await migrator.createIndexes();
        break;
      default:
        console.log(`
Usage: node firebase-migrator.js [command]

Commands:
  migrate [limit]    Migrate all data from MongoDB to Firebase
  verify            Verify migration results
  cleanup           Clean up migration metadata
  indexes           Create recommended indexes

Examples:
  node firebase-migrator.js migrate      # Migrate all data
  node firebase-migrator.js migrate 100  # Migrate first 100 documents per collection
  node firebase-migrator.js verify       # Verify migration
        `);
    }
    
    process.exit(0);
  }
  
  run().catch(console.error);
}