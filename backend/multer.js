const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Path to uploads folder
const uploadDir = path.join(__dirname, "./uploads");



// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir); // Save files to the ensured folder
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Preserve original extension
    const filename = path.basename(file.originalname, ext); // Remove extension from original name
    cb(null, filename + "-" + uniqueSuffix + ext); // e.g., "avatar-123456789.png"
  },
});

exports.upload = multer({ storage: storage });
