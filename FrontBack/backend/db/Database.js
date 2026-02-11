// db/Database.js - UPDATED FOR FIREBASE
const { db, firestoreHelper } = require('../config/firebase-config');

const connectDatabase = async () => {
  console.log('🔄 Connecting to Firebase Firestore...');
  
  try {
    // Test connection by creating a test document
    const testRef = db.collection('_connection_tests').doc('startup');
    await testRef.set({
      message: 'Firebase connected successfully',
      timestamp: new Date().toISOString(),
      project: 'multi',
      server: 'B2B Backend'
    });
    
    console.log('✅ Firebase Firestore Connected Successfully!');
    console.log(`📂 Project: multi`);
    
    // Add event listeners for debugging
    db.collection('_connection_tests').onSnapshot((snapshot) => {
      console.log('📡 Firestore connection is active');
    }, (error) => {
      console.error('❌ Firestore connection error:', error.message);
    });
    
    return { db, firestoreHelper };
    
  } catch (error) {
    console.error(`❌ Firebase connection failed: ${error.message}`);
    
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify serviceAccountKey.json exists');
    console.log('3. Check if Firestore is enabled in Firebase Console');
    console.log('4. Verify the service account has Firestore permissions');
    
    // In development, use mock mode
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Development mode: Using mock data');
      return { db: null, firestoreHelper: null, mock: true };
    }
    
    // In production, exit
    console.log('❌ Production mode: Exiting due to Firebase connection failure');
    process.exit(1);
  }
};

module.exports = connectDatabase;