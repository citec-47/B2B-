const express = require("express");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/sendMail");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Create user
router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (req.file) {
        const filePath = `uploads/${req.file.filename}`;
        fs.unlink(filePath, (err) => {
          if (err) console.log(err);
        });
      }
      return next(new ErrorHandler("User already exists", 400));
    }

    const fileUrl = req.file ? req.file.filename : null;

    const userData = { name, email, password, avatar: fileUrl };

    const activationToken = createActivationToken(userData);
    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    try {
      await sendMail({
        email,
        subject: "Activate your account",
        message: `Hello ${name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `Please check your email: ${email} to activate your account!`,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
});

// Create activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
};

// Activate user account
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
      if (!newUser) return next(new ErrorHandler("Invalid token", 400));

      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });
      if (user) return next(new ErrorHandler("User already exists", 400));

      user = await User.create({ name, email, avatar, password });
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return next(new ErrorHandler("Please provide all fields", 400));

      const user = await User.findOne({ email }).select("+password");
      if (!user) return next(new ErrorHandler("User doesn't exist", 400));

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) return next(new ErrorHandler("Incorrect credentials", 400));

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return next(new ErrorHandler("User doesn't exist", 400));

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Logout user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });
      res.status(201).json({ success: true, message: "Logout successful!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;
      const user = await User.findOne({ email }).select("+password");

      if (!user) return next(new ErrorHandler("User not found", 400));

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) return next(new ErrorHandler("Incorrect information", 400));

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();
      res.status(201).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (user.avatar) fs.unlinkSync(`uploads/${user.avatar}`);

      const fileUrl = req.file.filename;
      user.avatar = fileUrl;
      await user.save();

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      const sameType = user.addresses.find((a) => a.addressType === req.body.addressType);

      if (sameType) return next(new ErrorHandler(`${req.body.addressType} address already exists`));

      const existsAddress = user.addresses.find((a) => a._id === req.body._id);
      if (existsAddress) Object.assign(existsAddress, req.body);
      else user.addresses.push(req.body);

      await user.save();
      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Delete address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      await User.updateOne({ _id: userId }, { $pull: { addresses: { _id: addressId } } });

      const user = await User.findById(userId);
      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");
      const isOldPasswordValid = await user.comparePassword(req.body.oldPassword);

      if (!isOldPasswordValid) return next(new ErrorHandler("Old password is incorrect!", 400));
      if (req.body.newPassword !== req.body.confirmPassword)
        return next(new ErrorHandler("Passwords do not match!", 400));

      user.password = req.body.newPassword;
      await user.save();

      res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get user by ID
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      res.status(201).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Admin - all users
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.status(201).json({ success: true, users });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Admin - delete user
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return next(new ErrorHandler("User not found", 400));

      await User.findByIdAndDelete(req.params.id);
      res.status(201).json({ success: true, message: "User deleted successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
