const jwt = require('jsonwebtoken');

const getExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      userType: user.userType,
    },
    secret,
    {
      expiresIn: getExpiresIn(),
    }
  );
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
  getExpiresIn,
};
