const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://surajorg44:WM6neW6yd7U9oOEq@jira-tracker.9o5iykb.mongodb.net/?retryWrites=true&w=majority&appName=Jira-Tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('MongoDB connected for admin password fix');
    
    try {
      // Find admin user
      const admin = await User.findOne({ role: 'admin' });
      
      if (!admin) {
        console.log('Admin user not found');
        process.exit(1);
      }
      
      console.log('Found admin user:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone
      });
      
      // Generate new password hash
      const plainPassword = '12345';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Update admin password directly
      admin.password = hashedPassword;
      await admin.save({ validateBeforeSave: false });
      
      // Double-check the password
      const isMatch = await bcrypt.compare(plainPassword, admin.password);
      console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');
      
      console.log('Admin password updated successfully');
      console.log(`Use the following credentials to log in:`);
      console.log(`Phone: ${admin.phone}`);
      console.log(`Password: ${plainPassword}`);
      
      process.exit(0);
    } catch (error) {
      console.error('Error fixing admin password:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 