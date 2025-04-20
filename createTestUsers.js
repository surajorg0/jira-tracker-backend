const mongoose = require('mongoose');
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
    console.log('MongoDB connected for test users creation');
    
    try {
      // Create test team leads
      const teamLeads = [
        {
          name: 'Team Lead 1',
          email: 'teamlead1@example.com',
          phone: '1111111111',
          password: '12345',
          role: 'teamlead',
          isApproved: false
        },
        {
          name: 'Team Lead 2',
          email: 'teamlead2@example.com',
          phone: '2222222222',
          password: '12345',
          role: 'teamlead',
          isApproved: false
        }
      ];
      
      // Create test regular users
      const regularUsers = [
        {
          name: 'User 1',
          email: 'user1@example.com',
          phone: '3333333333',
          password: '12345',
          role: 'user',
          isApproved: false
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          phone: '4444444444',
          password: '12345',
          role: 'user',
          isApproved: false
        }
      ];
      
      // Insert all test users
      const allUsers = [...teamLeads, ...regularUsers];
      
      for (const userData of allUsers) {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: userData.email }, { phone: userData.phone }] });
        
        if (!existingUser) {
          const user = new User(userData);
          await user.save();
          console.log(`Created test user: ${userData.name} (${userData.role})`);
        } else {
          console.log(`User already exists: ${userData.email}`);
        }
      }
      
      console.log('Test users creation completed');
      
      // Log all users in the database
      const users = await User.find().select('-password');
      console.log('\nAll users in database:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.role}), Approved: ${user.isApproved ? 'Yes' : 'No'}`);
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error creating test users:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 