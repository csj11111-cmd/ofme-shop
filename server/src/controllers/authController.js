const User = require('../models/User');
const REGISTER_USER_TYPES = require('../constants/userTypes').REGISTER_USER_TYPES;
const { signToken, getExpiresIn } = require('../utils/jwt');
const formatUser = require('../utils/formatUser');
const sanitizeAddresses = require('../utils/sanitizeAddresses');

const register = async (req, res) => {
  try {
    const { email, name, password, userType, addresses, privacyAgreed } = req.body;

    if (!email || !name || !password || !userType) {
      return res.status(400).json({
        message: '이메일, 이름, 비밀번호, 회원 유형은 필수입니다.',
      });
    }

    if (!privacyAgreed) {
      return res.status(400).json({
        message: '개인정보 수집 및 이용에 동의해 주세요.',
      });
    }

    if (!REGISTER_USER_TYPES.includes(userType)) {
      return res.status(400).json({
        message: `회원 유형은 ${REGISTER_USER_TYPES.join(', ')} 중 하나여야 합니다.`,
      });
    }

    const user = await User.create({
      email,
      name,
      password,
      userType,
      addresses: sanitizeAddresses(addresses),
    });

    const token = signToken(user);

    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: formatUser(user),
      token,
      expiresIn: getExpiresIn(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');

      return res.status(400).json({ message });
    }

    if (error.message === 'JWT_SECRET is not defined in environment variables') {
      return res.status(500).json({ message: '서버 인증 설정이 올바르지 않습니다.' });
    }

    return res.status(500).json({ message: '회원가입에 실패했습니다.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    return res.json({
      success: true,
      user: formatUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: '사용자 정보를 불러오지 못했습니다.',
    });
  }
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    const { email, name, phone, addresses } = req.body;

    if (email !== undefined) {
      user.email = String(email).trim();
    }

    if (name !== undefined) {
      user.name = String(name).trim();
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (addresses !== undefined) {
      user.addresses = sanitizeAddresses(addresses);
    }

    await user.save();

    return res.json({
      success: true,
      message: '내 정보가 수정되었습니다.',
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: '내 정보 수정에 실패했습니다.' });
  }
};

module.exports = {
  register,
  getMe,
  updateMe,
};
