const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const USER_TYPES = require('../constants/userTypes');
const addressSchema = require('./Address');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    userType: {
      type: String,
      required: [true, 'User type is required'],
      enum: {
        values: USER_TYPES,
        message: '{VALUE} is not a valid user type',
      },
    },
    addresses: {
      type: [addressSchema],
      default: [],
      validate: {
        validator: (value) => value.length <= 3,
        message: 'Maximum 3 addresses allowed',
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
