
  const dotenv = require('dotenv');
  dotenv.config();
  console.log("Twilio Number:", process.env.TWILIO_PHONE_NUMBER);

  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const path = require('path');

  // Import routes
  const authRoutes = require('./routes/auth');
  const auctionRoutes = require('./routes/auction');
  const contactRoutes = require('./routes/contact');
  const adminAuctionRoutes = require('./routes/adminAuction');
  const adminUserRoutes = require('./routes/adminUser');
  const adminAuthRoutes = require('./routes/adminAuth');
  const paymentRoutes = require('./routes/payment');
  const adminPaymentRoutes = require('./routes/adminPayment');

  const adminHandleAuctionsRoutes = require('./routes/adminHandleAuctions');
  
  // Import auction scheduler
  const { startAuctionScheduler, stopAuctionScheduler } = require('./utils/auctionScheduler');
  
  // Diagnostic logging for route types
  function logRouteType(name, route) {
    console.log(`${name} type:`, typeof route, Array.isArray(route) ? 'Array' : (route && route.stack ? 'Router' : 'Object'));
  }
  logRouteType('authRoutes', authRoutes);
  logRouteType('auctionRoutes', auctionRoutes);
  logRouteType('contactRoutes', contactRoutes);
  logRouteType('adminAuctionRoutes', adminAuctionRoutes);
  logRouteType('adminUserRoutes', adminUserRoutes);
  logRouteType('adminAuthRoutes', adminAuthRoutes);

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Database connection
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auctions', auctionRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/payments', paymentRoutes);
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin', adminAuctionRoutes); // Mount admin auction routes
  app.use('/api/admin/payments', adminPaymentRoutes);
  app.use('/api/admin/handle-auctions', adminHandleAuctionsRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);

  // Test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      message: 'Something went wrong!', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  const PORT = process.env.PORT || 5001;

  let auctionSchedulerInterval;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Connected to MongoDB Atlas');
    
    // Start the auction scheduler
    auctionSchedulerInterval = startAuctionScheduler();
  });

  // Graceful shutdown
  /*
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Graceful shutdown...');
    stopAuctionScheduler(auctionSchedulerInterval);
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Graceful shutdown...');
    stopAuctionScheduler(auctionSchedulerInterval);
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  */
