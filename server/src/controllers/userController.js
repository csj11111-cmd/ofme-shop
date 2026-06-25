const User = require('../models/User');
const USER_TYPES = require('../constants/userTypes');
const formatUser = require('../utils/formatUser');
const handleUserError = require('../utils/handleUserError');
const sanitizeAddresses = require('../utils/sanitizeAddresses');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.json({
      count: users.length,
      users: users.map(formatUser),
    });
  } catch (error) {
    return handleUserError(error, res, 'Failed to fetch users');
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: formatUser(user) });
  } catch (error) {
    return handleUserError(error, res, 'Failed to fetch user');
  }
};

const createUser = async (req, res) => {
  try {
    const { email, name, password, userType, addresses } = req.body;

    if (!email || !name || !password || !userType) {
      return res.status(400).json({
        message: 'email, name, password, and userType are required',
      });
    }

    if (!USER_TYPES.includes(userType)) {
      return res.status(400).json({
        message: `userType must be one of: ${USER_TYPES.join(', ')}`,
      });
    }

    const user = await User.create({
      email,
      name,
      password,
      userType,
      addresses: sanitizeAddresses(addresses),
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: formatUser(user),
    });
  } catch (error) {
    return handleUserError(error, res, 'Failed to create user');
  }
};

const updateUser = async (req, res) => {
  try {
    const { email, name, password, userType, addresses } = req.body;
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (password !== undefined) {
      user.password = password;
    }

    if (userType !== undefined) {
      if (!USER_TYPES.includes(userType)) {
        return res.status(400).json({
          message: `userType must be one of: ${USER_TYPES.join(', ')}`,
        });
      }

      user.userType = userType;
    }

    if (addresses !== undefined) {
      user.addresses = sanitizeAddresses(addresses);
    }

    await user.save();

    return res.json({
      message: 'User updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    return handleUserError(error, res, 'Failed to update user');
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User deleted successfully',
      user: formatUser(user),
    });
  } catch (error) {
    return handleUserError(error, res, 'Failed to delete user');
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
