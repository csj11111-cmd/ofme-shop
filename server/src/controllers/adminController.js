const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const formatOrder = require('../utils/formatOrder');

const getDashboard = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      userCount,
      productCount,
      orderCount,
      pendingCount,
      revenueAgg,
      todayAgg,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'paid', 'preparing'] } }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(12),
    ]);

    return res.json({
      stats: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        pendingOrders: pendingCount,
        revenue: revenueAgg[0]?.total ?? 0,
        todayOrders: todayAgg[0]?.count ?? 0,
        todayRevenue: todayAgg[0]?.revenue ?? 0,
      },
      recentOrders: recentOrders.map(formatOrder),
    });
  } catch {
    return res.status(500).json({ message: '대시보드 정보를 불러오지 못했습니다.' });
  }
};

module.exports = {
  getDashboard,
};
