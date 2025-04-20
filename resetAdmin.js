const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jira_tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('MongoDB connected for admin reset');
    
    try {
      // Remove existing admin user
      const result = await User.deleteOne({ role: 'admin' });
      console.log(`Deleted admin user: ${result.deletedCount} user removed`);
      
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('12345', salt);
      
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@jiratracker.com',
        phone: '8180012573',
        role: 'admin',
        password: hashedPassword,
        isApproved: true
      });
      
      console.log('New admin user created:');
      console.log({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        isApproved: admin.isApproved
      });
      
      console.log('Admin reset completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Admin reset error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 