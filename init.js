const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import User model
const User = require('./models/User');

// Create upload directory if it doesn't exist
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://surajorg44:WM6neW6yd7U9oOEq@jira-tracker.9o5iykb.mongodb.net/?retryWrites=true&w=majority&appName=Jira-Tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('MongoDB connected for initialization');
    
    try {
      // Create admin if not exists
      await User.createAdminIfNotExists();
      
      console.log('Initialization completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Initialization error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 