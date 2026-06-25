const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  getOrphanPayments,
  refundOrphanPayment,
  cancelOrder,
  updateOrderStatus,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/mine', authMiddleware, getMyOrders);
router.get('/orphans', authMiddleware, getOrphanPayments);
router.post('/refund-orphan', authMiddleware, refundOrphanPayment);
router.get('/', authMiddleware, requireAdmin, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.patch('/:id/cancel', authMiddleware, cancelOrder);
router.patch('/:id/status', authMiddleware, requireAdmin, updateOrderStatus);

module.exports = router;
