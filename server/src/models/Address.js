const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    alias: {
      type: String,
      trim: true,
    },
    postcode: {
      type: String,
      trim: true,
    },
    baseAddress: {
      type: String,
      trim: true,
    },
    detailAddress: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

module.exports = addressSchema;
