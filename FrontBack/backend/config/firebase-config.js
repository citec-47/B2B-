const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('🔧 Loading Firebase configuration...');

// Load service account from backend root (where it's located)
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

console.log('🔍 Looking for service account at:', serviceAccountPath);

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ERROR: serviceAccountKey.json not found!');
  console.error('Expected location:', serviceAccountPath);
  
  // List files to help debug
  console.error('\n📂 Files in backend directory:');
  const files = fs.readdirSync(path.join(__dirname, '..'));
  files.forEach(file => {
    console.error(`   - ${file}`);
  });
  
  process.exit(1);
}

console.log('✅ Service account found');

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
let app;
try {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
  console.log('✅ Firebase Admin initialized successfully');
  console.log(`📁 Project: ${serviceAccount.project_id}`);
} catch (error) {
  // If already initialized (in development with nodemon), use existing app
  if (error.code === 'app/duplicate-app') {
    app = admin.app();
    console.log('✅ Using existing Firebase app');
  } else {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
}

// Get Firestore database instance
const db = admin.firestore();

// Configure Firestore settings
db.settings({ 
  ignoreUndefinedProperties: true
});

// Get Auth instance
const auth = admin.auth();

// Helper functions
const firestoreHelper = {
  // Convert document to include id
  docWithId: (doc) => {
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },
  
  // Convert query snapshot to array with ids
  docsWithIds: (snapshot) => {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Server timestamp
  timestamp: () => admin.firestore.FieldValue.serverTimestamp(),
  
  // Increment field
  increment: (value) => admin.firestore.FieldValue.increment(value),
  
  // Array operations
  arrayUnion: (...elements) => admin.firestore.FieldValue.arrayUnion(...elements),
  arrayRemove: (...elements) => admin.firestore.FieldValue.arrayRemove(...elements)
};

module.exports = {
  admin,
  db,
  auth,
  firestoreHelper,
  serviceAccount: serviceAccount,
  projectId: serviceAccount.project_id
};