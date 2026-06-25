const User = require('../models/User');
const { signToken, getExpiresIn } = require('../utils/jwt');
const formatUser = require('../utils/formatUser');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해 주세요.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: '로그인되었습니다.',
      user: formatUser(user),
      token,
      tokenType: 'Bearer',
      expiresIn: getExpiresIn(),
    });
  } catch (error) {
    if (error.message === 'JWT_SECRET is not defined in environment variables') {
      return res.status(500).json({
        success: false,
        message: '서버 인증 설정이 올바르지 않습니다.',
      });
    }

    return res.status(500).json({
      success: false,
      message: '로그인에 실패했습니다.',
    });
  }
};

module.exports = {
  login,
};
