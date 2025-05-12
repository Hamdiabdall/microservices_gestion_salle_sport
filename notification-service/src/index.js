const express = require('express');
const { Kafka } = require('kafkajs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://root:password@mongodb:27017/notification-service?authSource=admin';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure mail transport (for demo purposes we'll just log instead of sending real emails)
const transporter = {
  sendMail: async (mailOptions) => {
    console.log('EMAIL WOULD BE SENT:', mailOptions);
    return true;
  }
};

// In a production environment, you would use something like:
/*
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
*/

// Initialize Kafka consumer
const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

// Event handlers for different notification types
const notificationHandlers = {
  session_reserved: async (event) => {
    try {
      console.log(`Processing session_reserved event for user ${event.userId}`);
      
      // In a real app, we would fetch user details from user-service to get their email
      const userEmail = `user-${event.userId}@example.com`;
      
      // Send confirmation email
      await transporter.sendMail({
        from: '"Gym Management" <noreply@gymmanagement.com>',
        to: userEmail,
        subject: 'Session Reservation Confirmation',
        text: `Your reservation for session ${event.sessionTitle} on ${event.sessionDate} has been confirmed.`,
        html: `<p>Your reservation for session <strong>${event.sessionTitle}</strong> on <strong>${event.sessionDate}</strong> has been confirmed.</p>`
      });
      
      // Save notification in database
      await saveNotification({
        userId: event.userId,
        type: 'session_reserved',
        title: 'Session Reservation Confirmed',
        message: `Your reservation for ${event.sessionTitle} has been confirmed.`,
        data: event,
        read: false
      });
      
      console.log(`Notification sent for session reservation to ${userEmail}`);
    } catch (error) {
      console.error('Error processing session_reserved event:', error);
    }
  },
  
  session_cancelled: async (event) => {
    try {
      console.log(`Processing session_cancelled event for user ${event.userId}`);
      
      // In a real app, we would fetch user details from user-service to get their email
      const userEmail = `user-${event.userId}@example.com`;
      
      // Send cancellation email
      await transporter.sendMail({
        from: '"Gym Management" <noreply@gymmanagement.com>',
        to: userEmail,
        subject: 'Session Cancellation Notice',
        text: `The session ${event.sessionTitle} on ${event.sessionDate} has been cancelled.`,
        html: `<p>The session <strong>${event.sessionTitle}</strong> on <strong>${event.sessionDate}</strong> has been cancelled.</p>`
      });
      
      // Save notification in database
      await saveNotification({
        userId: event.userId,
        type: 'session_cancelled',
        title: 'Session Cancelled',
        message: `The session ${event.sessionTitle} has been cancelled.`,
        data: event,
        read: false
      });
      
      console.log(`Notification sent for session cancellation to ${userEmail}`);
    } catch (error) {
      console.error('Error processing session_cancelled event:', error);
    }
  },
  
  payment_processed: async (event) => {
    try {
      console.log(`Processing payment_processed event for user ${event.userId}`);
      
      // In a real app, we would fetch user details from user-service to get their email
      const userEmail = `user-${event.userId}@example.com`;
      
      // Send payment confirmation email
      await transporter.sendMail({
        from: '"Gym Management" <noreply@gymmanagement.com>',
        to: userEmail,
        subject: 'Payment Confirmation',
        text: `Your payment of $${event.amount} has been processed successfully.`,
        html: `<p>Your payment of <strong>$${event.amount}</strong> has been processed successfully.</p>`
      });
      
      // Save notification in database
      await saveNotification({
        userId: event.userId,
        type: 'payment_processed',
        title: 'Payment Processed',
        message: `Your payment of $${event.amount} has been processed successfully.`,
        data: event,
        read: false
      });
      
      console.log(`Notification sent for payment confirmation to ${userEmail}`);
    } catch (error) {
      console.error('Error processing payment_processed event:', error);
    }
  },
  
  subscription_created: async (event) => {
    try {
      console.log(`Processing subscription_created event for user ${event.userId}`);
      
      // In a real app, we would fetch user details from user-service to get their email
      const userEmail = `user-${event.userId}@example.com`;
      
      // Send subscription confirmation email
      await transporter.sendMail({
        from: '"Gym Management" <noreply@gymmanagement.com>',
        to: userEmail,
        subject: 'Subscription Confirmation',
        text: `Your subscription to ${event.planName} has been activated. It will expire on ${event.endDate}.`,
        html: `<p>Your subscription to <strong>${event.planName}</strong> has been activated. It will expire on <strong>${event.endDate}</strong>.</p>`
      });
      
      // Save notification in database
      await saveNotification({
        userId: event.userId,
        type: 'subscription_created',
        title: 'Subscription Activated',
        message: `Your subscription to ${event.planName} has been activated.`,
        data: event,
        read: false
      });
      
      console.log(`Notification sent for subscription confirmation to ${userEmail}`);
    } catch (error) {
      console.error('Error processing subscription_created event:', error);
    }
  },
  
  subscription_expiring: async (event) => {
    try {
      console.log(`Processing subscription_expiring event for user ${event.userId}`);
      
      // In a real app, we would fetch user details from user-service to get their email
      const userEmail = `user-${event.userId}@example.com`;
      
      // Send expiration reminder email
      await transporter.sendMail({
        from: '"Gym Management" <noreply@gymmanagement.com>',
        to: userEmail,
        subject: 'Subscription Expiring Soon',
        text: `Your subscription to ${event.planName} will expire on ${event.endDate}. Please renew to continue enjoying our services.`,
        html: `<p>Your subscription to <strong>${event.planName}</strong> will expire on <strong>${event.endDate}</strong>. Please renew to continue enjoying our services.</p>`
      });
      
      // Save notification in database
      await saveNotification({
        userId: event.userId,
        type: 'subscription_expiring',
        title: 'Subscription Expiring Soon',
        message: `Your subscription to ${event.planName} will expire on ${event.endDate}.`,
        data: event,
        read: false
      });
      
      console.log(`Notification sent for subscription expiration reminder to ${userEmail}`);
    } catch (error) {
      console.error('Error processing subscription_expiring event:', error);
    }
  }
};

// Notification model (simplified)
const notificationSchema = new mongoose.Schema({
  userId: String,
  type: String,
  title: String,
  message: String,
  data: Object,
  read: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Helper function to save notification to database
async function saveNotification(notificationData) {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
}

// Connect Kafka consumer
async function startConsumer() {
  try {
    await consumer.connect();
    console.log('Connected to Kafka');
    
    // Subscribe to topics
    await consumer.subscribe({ topics: ['session-events', 'payment-events'], fromBeginning: true });
    
    // Setup message consumption
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log(`Received event: ${eventData.event} from topic: ${topic}`);
          
          // Process event based on its type
          if (notificationHandlers[eventData.event]) {
            await notificationHandlers[eventData.event](eventData);
          } else {
            console.log(`No handler for event type: ${eventData.event}`);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error starting Kafka consumer:', error);
  }
}

// API endpoints

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'notification-service' });
});

// Get notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    // In a real app, we would verify the JWT token and ensure the user can only see their own notifications
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    // In a real app, we would verify the JWT token and ensure the user can only update their own notifications
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/user/:userId/read-all', async (req, res) => {
  try {
    // In a real app, we would verify the JWT token and ensure the user can only update their own notifications
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the Express server and Kafka consumer
async function startServer() {
  try {
    // Start Kafka consumer
    await startConsumer();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await consumer.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

startServer();
