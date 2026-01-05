// db/Database.js - FIXED VERSION
const mongoose = require("mongoose");

const connectDatabase = async () => {
  console.log("🔄 Connecting to database...");
  
  const connectionURL = process.env.DB_URL || "mongodb://localhost:27017/ecommerce";
  
  // Mask password for logging
  const maskedURL = connectionURL.replace(/:[^:@]*@/, ':****@');
  console.log(`🔗 Attempting to connect to: ${maskedURL}`);
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // 15 seconds
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: "majority"
  };

  try {
    const data = await mongoose.connect(connectionURL, options);
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📂 Host: ${data.connection.host}`);
    console.log(`📊 Database: ${data.connection.name}`);
    
    // Add event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconnected');
    });
    
    return data;
    
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    
    // Provide helpful troubleshooting tips
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n🔍 Troubleshooting Tips:');
      console.log('1. Check your internet connection');
      console.log('2. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('3. Verify your username and password in the connection string');
      console.log('4. Make sure the database cluster is active in MongoDB Atlas');
    }
    
    // In development, return null to allow mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Development mode: Using mock data instead');
      return null;
    }
    
    // In production, exit
    console.log('❌ Production mode: Exiting due to database connection failure');
    process.exit(1);
  }
};

module.exports = connectDatabase;