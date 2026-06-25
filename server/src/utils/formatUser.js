const formatUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  phone: user.phone || '',
  userType: user.userType,
  addresses: user.addresses,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = formatUser;
