const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user?.userType) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  if (!roles.includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: '접근 권한이 없습니다.',
    });
  }

  next();
};

const requireAdmin = requireRoles('admin');
const requireSeller = requireRoles('seller', 'admin');

module.exports = {
  requireRoles,
  requireAdmin,
  requireSeller,
};
