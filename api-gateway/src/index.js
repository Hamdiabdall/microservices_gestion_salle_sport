const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import route handlers
const sessionRoutes = require('./routes/session.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// JWT verification middleware for protected routes
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// API Documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Gym Management System API',
    version: '1.0',
    services: [
      { name: 'User Service', endpoints: ['/api/users', '/api/auth'] },
      { name: 'Session Service', endpoints: ['/api/sessions', '/api/reservations'] },
      { name: 'Payment Service', endpoints: ['/api/subscriptions', '/api/payments'] },
      { name: 'Notification Service', endpoints: ['/api/notifications'] }
    ]
  });
});

// Setup proxies for different services

// User Service Proxy (REST)
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3000',
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  changeOrigin: true
}));

app.use('/api/auth', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3000',
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  changeOrigin: true
}));

// Session Service Routes (gRPC)
// These routes use a custom handler to translate REST to gRPC
app.use('/api/sessions', sessionRoutes);
app.use('/api/reservations', verifyToken, sessionRoutes);

// Payment Service Routes (GraphQL)
// These routes use a custom handler to manage GraphQL queries
app.use('/api/subscriptions', paymentRoutes);
app.use('/api/payments', verifyToken, paymentRoutes);

// Notification Service (direct pass-through)
app.use('/api/notifications', verifyToken, createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5000',
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  changeOrigin: true
}));

// GraphQL endpoint passthrough
app.use('/graphql', createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4000',
  changeOrigin: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app; // For testing
