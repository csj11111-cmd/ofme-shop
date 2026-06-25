const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { getDashboard } = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get('/dashboard', getDashboard);

module.exports = router;
