// debug-mongo.js
require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== MONGODB CONNECTION DEBUG ===\n');

// Show what's in .env
console.log('1. Checking .env file:');
console.log('   MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  const masked = process.env.MONGODB_URI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  console.log('   URI (masked):', masked);
  console.log('   URI length:', process.env.MONGODB_URI.length);
  console.log('   Contains @:', process.env.MONGODB_URI.includes('@'));
  console.log('   Contains cluster0.4yeqhpp:', process.env.MONGODB_URI.includes('cluster0.4yeqhpp'));
}

// Try multiple connection methods
console.log('\n2. Testing connection methods:');

const testConnections = [
  // Method 1: Direct from .env
  { name: 'From .env', uri: process.env.MONGODB_URI },
  
  // Method 2: Simple format
  { name: 'Simple format', uri: 'mongodb+srv://mern_user:MernStack2024!@cluster0.4yeqhpp.mongodb.net/ecommerce' },
  
  // Method 3: Without database name
  { name: 'Without db name', uri: 'mongodb+srv://mern_user:MernStack2024!@cluster0.4yeqhpp.mongodb.net/' },
  
  // Method 4: With options
  { name: 'With options', uri: 'mongodb+srv://mern_user:MernStack2024!@cluster0.4yeqhpp.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0' }
];

async function testConnection(name, uri) {
  if (!uri) {
    console.log(`   ❌ ${name}: No URI provided`);
    return;
  }
  
  console.log(`\n   🔍 Testing: ${name}`);
  console.log('   URI:', uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@'));
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log(`   ✅ ${name}: CONNECTED!`);
    console.log('   Database:', mongoose.connection.db.databaseName);
    console.log('   Host:', mongoose.connection.host);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`   ❌ ${name}: FAILED - ${error.message}`);
    
    if (error.message.includes('bad auth')) {
      console.log('      🔑 Authentication failed - wrong username/password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('      🌐 Connection refused - check network/IP whitelist');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('      🔍 DNS not found - check cluster name');
    }
    
    return false;
  }
}

async function runAllTests() {
  let connected = false;
  
  for (const test of testConnections) {
    const result = await testConnection(test.name, test.uri);
    if (result) {
      connected = true;
      console.log('\n🎉 SUCCESS! Use this connection string:');
      console.log(test.uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@'));
      break;
    }
  }
  
  if (!connected) {
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Go to MongoDB Atlas → Database Access');
    console.log('   - Verify user exists (ecommerce_app or mern_user)');
    console.log('   - Click EDIT → Update Password');
    console.log('   - Set password to: MernStack2024!');
    console.log('');
    console.log('2. Go to MongoDB Atlas → Network Access');
    console.log('   - Click "Add IP Address"');
    console.log('   - Click "Allow Access From Anywhere" (0.0.0.0/0)');
    console.log('   - Click "Confirm" (wait 3 minutes)');
    console.log('');
    console.log('3. Check if cluster is active:');
    console.log('   - Go to Database → Clusters');
    console.log('   - Cluster should be GREEN (not paused)');
    console.log('   - Free clusters auto-pause after 30 days inactivity');
  }
}

runAllTests();