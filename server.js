const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const bugRoutes = require('./routes/bugs');
const fileRoutes = require('./routes/files');
const taskRoutes = require('./routes/tasks');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:8100', 'http://localhost:8101', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept', 'Access-Control-Allow-Origin', 'x-user-id'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  credentials: true
}));

// Option for preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  if (req.method !== 'GET') {
    console.log('Request Body:', req.body);
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/profile-pictures', express.static(path.join(__dirname, 'uploads/profile-pictures')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jira_tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('MongoDB connected');
    
    // Import User model
    const User = require('./models/User');
    
    // Create admin user if not exists
    try {
      await User.createAdminIfNotExists();
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tasks', taskRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Jira-like API is running');
});

// Create default uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const profilePicsDir = path.join(uploadsDir, 'profile-pictures');

// Ensure uploads directories exist
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory');
  }
  if (!fs.existsSync(profilePicsDir)) {
    fs.mkdirSync(profilePicsDir);
    console.log('Created profile pictures directory');
  }
} catch (error) {
  console.error('Error creating upload directories:', error);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 