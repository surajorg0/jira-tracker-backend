const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists with this email or phone' });
    }

    // Create new user
    user = new User({
      name,
      email,
      phone,
      password,
      role: role || 'user', // Default role is user
      isApproved: role === 'admin' // Only admin is auto-approved
    });

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY || '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name, email, phone, role: user.role, isApproved: user.isApproved } });
      }
    );
  } catch (err) {
    console.error('Register error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('Login attempt with data:', req.body);
    const { phone, password } = req.body;
    
    // Special case for admin login
    if (phone === '8180012573' && password === '12345') {
      console.log('Admin login detected - automatic approval');
      
      // Find or create admin user
      let admin = await User.findOne({ role: 'admin' });
      
      if (!admin) {
        console.log('Admin user not found in database, creating one');
        // Create admin user if not exist
        admin = new User({
          name: 'Admin',
          email: 'admin@jiratracker.com',
          phone: '8180012573',
          password: '12345', // This will be hashed by pre-save hook
          role: 'admin',
          isApproved: true
        });
        
        await admin.save();
        console.log('Admin user created');
      }
      
      // Generate token for admin
      const payload = {
        user: {
          id: admin.id,
          role: 'admin'
        }
      };
      
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your_custom_secure_jwt_secret_key_2024',
        { expiresIn: process.env.TOKEN_EXPIRY || '7d' },
        (err, token) => {
          if (err) {
            console.error('JWT sign error:', err);
            throw err;
          }
          console.log('Admin login successful');
          res.json({ 
            token, 
            user: { 
              _id: admin.id,
              name: admin.name, 
              email: admin.email, 
              phone: admin.phone, 
              role: 'admin', 
              isApproved: true,
              createdAt: admin.createdAt
            } 
          });
        }
      );
      return;
    }
    
    // Regular user login logic (only if not admin credentials)
    const user = await User.findOne({ phone });
    if (!user) {
      console.log('User not found with phone:', phone);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('User found:', {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved
    });

    // Check password
    console.log('Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is approved
    if (!user.isApproved) {
      console.log('User is not approved');
      return res.status(403).json({ msg: 'Your account is pending approval' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_custom_secure_jwt_secret_key_2024',
      { expiresIn: process.env.TOKEN_EXPIRY || '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT sign error:', err);
          throw err;
        }
        console.log('Login successful, sending response');
        res.json({ 
          token, 
          user: { 
            _id: user.id,
            name: user.name, 
            email: user.email, 
            phone: user.phone, 
            role: user.role, 
            isApproved: user.isApproved,
            createdAt: user.createdAt
          } 
        });
      }
    );
  } catch (err) {
    console.error('Login error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get current user error', err.message);
    res.status(500).send('Server error');
  }
}; 