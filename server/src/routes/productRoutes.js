const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireSeller } = require('../middleware/roleMiddleware');
const {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/mine', authMiddleware, requireSeller, getMyProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, requireSeller, createProduct);
router.put('/:id', authMiddleware, requireSeller, updateProduct);
router.delete('/:id', authMiddleware, requireSeller, deleteProduct);

module.exports = router;
