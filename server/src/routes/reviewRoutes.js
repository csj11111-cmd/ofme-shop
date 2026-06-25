const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createReview, getMyReviews, getProductReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/mine', authMiddleware, getMyReviews);
router.get('/product/:productId', getProductReviews);
router.post('/', authMiddleware, createReview);

module.exports = router;
