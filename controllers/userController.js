const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Getting all users');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('Get all users error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/users/pending
// @desc    Get all pending users
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
  try {
    console.log('Getting pending users');
    const users = await User.find({ isApproved: false }).select('-password').sort({ createdAt: -1 });
    console.log(`Found ${users.length} pending users`);
    res.json(users);
  } catch (err) {
    console.error('Get pending users error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT /api/users/:id/approve
// @desc    Approve a user
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    console.log(`Approving user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    user.isApproved = true;
    await user.save();
    
    console.log(`User ${user.name} approved successfully`);
    res.json({ msg: 'User approved', user });
  } catch (err) {
    console.error('Approve user error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT /api/users/:id/reject
// @desc    Reject a user (delete)
// @access  Private/Admin
exports.rejectUser = async (req, res) => {
  try {
    console.log(`Rejecting user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    console.log(`User ${user.name} rejected and deleted`);
    res.json({ msg: 'User rejected and deleted' });
  } catch (err) {
    console.error('Reject user error', err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    console.log(`Updating profile for user with ID: ${req.params.id}`);
    
    // Only allow users to update their own profile unless they are an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update this profile' });
    }
    
    const { name, email, phone } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if email is being changed and is already in use
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ msg: 'Email is already in use' });
      }
    }
    
    // Check if phone is being changed and is already in use
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ msg: 'Phone number is already in use' });
      }
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');
    
    console.log(`User ${user.name} profile updated successfully`);
    res.json({ msg: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Update user profile error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    console.log(`Getting user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user by ID error', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
}; 