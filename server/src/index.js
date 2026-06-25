require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);

      if (!process.env.PORTONE_V2_API_SECRET?.trim()) {
        console.warn(
          '[PortOne] PORTONE_V2_API_SECRET이 비어 있습니다. V2 결제 검증·환불이 동작하지 않습니다.'
        );
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
