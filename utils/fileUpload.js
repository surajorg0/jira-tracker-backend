const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const profilePicsDir = path.join(uploadDir, 'profile-pictures');

// Create directories if they don't exist
[uploadDir, profilePicsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Set up storage for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, profilePicsDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename using userId and timestamp
    const userId = req.user._id;
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const filename = `user_${userId}_${timestamp}${fileExt}`;
    cb(null, filename);
  }
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  // Accept only image files
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File upload only supports image files (jpeg, jpg, png, gif)'));
  }
};

// Initialize upload for profile pictures
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
  fileFilter: imageFileFilter
}).single('profilePicture');

// Function to delete an old profile picture
const deleteProfilePicture = (filename) => {
  if (!filename || filename === 'default-avatar.png') {
    return;
  }

  const filePath = path.join(profilePicsDir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`Error deleting file: ${filePath}`, err);
      } else {
        logger.info(`Successfully deleted file: ${filePath}`);
      }
    });
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  profilePicturesPath: profilePicsDir
}; 