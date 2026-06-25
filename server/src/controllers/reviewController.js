const Order = require('../models/Order');
const Review = require('../models/Review');

const makeReviewKey = ({ orderId, productId, color, size }) =>
  `${orderId}:${productId}:${color}:${size}`;

const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({
      count: reviews.length,
      reviews: reviews.map((review) => ({
        id: review._id.toString(),
        orderId: review.order.toString(),
        productId: review.productId,
        color: review.color,
        size: review.size,
        rating: review.rating,
        content: review.content,
        key: makeReviewKey({
          orderId: review.order.toString(),
          productId: review.productId,
          color: review.color,
          size: review.size,
        }),
        createdAt: review.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({ message: '리뷰 목록을 불러오지 못했습니다.' });
  }
};

const createReview = async (req, res) => {
  try {
    const { orderId, productId, color, size, rating, content } = req.body;

    if (!orderId || !productId || !color || !size) {
      return res.status(400).json({ message: '리뷰 대상 상품 정보가 필요합니다.' });
    }

    const score = Number(rating);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: '별점은 1점~5점 사이여야 합니다.' });
    }

    const reviewContent = String(content || '').trim();
    if (reviewContent.length < 5) {
      return res.status(400).json({ message: '리뷰 내용을 5자 이상 입력해 주세요.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '리뷰 작성 권한이 없습니다.' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: '배송완료 주문만 리뷰를 작성할 수 있습니다.' });
    }

    const item = order.items.find(
      (candidate) =>
        candidate.productId === String(productId) &&
        candidate.color === String(color) &&
        candidate.size === String(size)
    );

    if (!item) {
      return res.status(400).json({ message: '해당 주문 상품을 찾을 수 없습니다.' });
    }

    const existingReview = await Review.findOne({
      user: req.user.id,
      order: order._id,
      productId: String(productId),
      color: String(color),
      size: String(size),
    });

    if (existingReview) {
      return res.status(400).json({ message: '이미 작성한 리뷰입니다.' });
    }

    const review = await Review.create({
      user: req.user.id,
      order: order._id,
      productId: String(productId),
      color: String(color),
      size: String(size),
      rating: score,
      content: reviewContent,
    });

    return res.status(201).json({
      message: '리뷰가 등록되었습니다.',
      review: {
        id: review._id.toString(),
        orderId: order._id.toString(),
        productId: review.productId,
        color: review.color,
        size: review.size,
        rating: review.rating,
        content: review.content,
        key: makeReviewKey({
          orderId: order._id.toString(),
          productId: review.productId,
          color: review.color,
          size: review.size,
        }),
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 작성한 리뷰입니다.' });
    }
    return res.status(500).json({ message: '리뷰 등록에 실패했습니다.' });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: String(req.params.productId) })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    return res.json({
      count: reviews.length,
      reviews: reviews.map((review) => ({
        id: review._id.toString(),
        userName: review.user?.name || '고객',
        productId: review.productId,
        color: review.color,
        size: review.size,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({ message: '상품 리뷰를 불러오지 못했습니다.' });
  }
};

module.exports = {
  getMyReviews,
  createReview,
  getProductReviews,
};
