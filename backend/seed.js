const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Import models (all lowercase file names)
const User = require("./models/user");
const Shop = require("./models/shop");
const Product = require("./models/product");
const Event = require("./models/event");
const Order = require("./models/order");
const Withdraw = require("./models/withdraw");
const Conversation = require("./models/conversation");
const Messages = require("./models/messages");
const CoupounCode = require("./models/coupounCode");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connected");

    // Clear existing data
    await User.deleteMany();
    await Shop.deleteMany();
    await Product.deleteMany();
    await Event.deleteMany();
    await Order.deleteMany();
    await Withdraw.deleteMany();
    await Conversation.deleteMany();
    await Messages.deleteMany();
    await CoupounCode.deleteMany();

    // Users
    const users = await User.insertMany([
      {
        name: "Maurice",
        email: "maurice@example.com",
        password: "123456",
        avatar: "https://i.pravatar.cc/150?img=1"
      },
      {
        name: "Alice",
        email: "alice@example.com",
        password: "123456",
        avatar: "https://i.pravatar.cc/150?img=2"
      }
    ]);

    // Shops
    const shops = await Shop.insertMany([
      {
        name: "Apple Store",
        email: "apple@example.com",
        password: "123456",
        avatar: "https://i.pravatar.cc/150?img=3",
        address: "123 Apple St",
        phoneNumber: 1234567890,
        zipCode: 10001
      },
      {
        name: "Amazon Store",
        email: "amazon@example.com",
        password: "123456",
        avatar: "https://i.pravatar.cc/150?img=4",
        address: "456 Amazon Rd",
        phoneNumber: 9876543210,
        zipCode: 10002
      }
    ]);

    // Products
    const products = await Product.insertMany([
      {
        name: "MacBook Pro M2",
        description: "High performance laptop",
        category: "Computers and Laptops",
        discountPrice: 1099,
        stock: 10,
        images: ["https://www.istorebangladesh.com/images/thumbs/0000286_macbook-pro-m1_550.png"],
        shopId: shops[0]._id,
        shop: shops[0]
      },
      {
        name: "iPhone 14 Pro Max",
        description: "Latest iPhone model",
        category: "Mobile and Tablets",
        discountPrice: 999,
        stock: 15,
        images: ["https://m.media-amazon.com/images/I/31Vle5fVdaL.jpg"],
        shopId: shops[1]._id,
        shop: shops[1]
      }
    ]);

    // Events
    const events = await Event.insertMany([
      {
        name: "Black Friday Sale",
        description: "Huge discounts on all products",
        category: "All",
        start_Date: new Date(),
        Finish_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        discountPrice: 50,
        stock: 100,
        images: ["https://cdn.pixabay.com/photo/2017/01/31/18/46/sale-2029723_960_720.png"],
        shopId: shops[0]._id,
        shop: shops[0]
      }
    ]);

    // Orders
    const orders = await Order.insertMany([
      {
        cart: [products[0]],
        shippingAddress: { country: "USA", city: "NY", address1: "123 Street" },
        user: users[0],
        totalPrice: products[0].discountPrice,
        paymentInfo: { id: "12345", status: "Paid", type: "Card" }
      }
    ]);

    // Withdraws
    const withdraws = await Withdraw.insertMany([
      {
        seller: shops[0],
        amount: 200,
        status: "Processing"
      }
    ]);

    // Conversations
    const conversations = await Conversation.insertMany([
      {
        groupTitle: "Support Chat",
        members: [users[0]._id, users[1]._id],
        lastMessage: "Hello!",
        lastMessageId: "1"
      }
    ]);

    // Messages
    const messages = await Messages.insertMany([
      {
        conversationId: conversations[0]._id,
        text: "Hello!",
        sender: users[0]._id,
        images: ""
      },
      {
        conversationId: conversations[0]._id,
        text: "Hi there!",
        sender: users[1]._id,
        images: ""
      }
    ]);

    // CoupounCodes
    const coupons = await CoupounCode.insertMany([
      {
        name: "BLACKFRIDAY",
        value: 20,
        minAmount: 50,
        shopId: shops[0]._id,
        selectedProduct: products[0]._id
      }
    ]);

    console.log("Data seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedDatabase();
