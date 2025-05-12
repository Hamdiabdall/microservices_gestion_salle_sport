const SubscriptionPlan = require('./models/SubscriptionPlan');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');
const { v4: uuidv4 } = require('uuid');

// JWT verification helper (simplified for demo)
const verifyToken = (auth) => {
  if (!auth) {
    throw new Error('Authentication required');
  }
  // In a real app, we'd verify the JWT and extract userId and role
  return {
    userId: 'mockUserId',
    role: 'admin'
  };
};

// Check if user is admin
const isAdmin = (auth) => {
  const user = verifyToken(auth);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
};

// Helper to send payment event to Kafka
const sendPaymentEvent = async (producer, event) => {
  try {
    await producer.send({
      topic: 'payment-events',
      messages: [
        { value: JSON.stringify(event) }
      ],
    });
    console.log('Payment event sent to Kafka');
  } catch (error) {
    console.error('Error sending payment event to Kafka:', error);
  }
};

const resolvers = {
  Query: {
    // Subscription Plans
    subscriptionPlans: async () => {
      return await SubscriptionPlan.find({ isActive: true });
    },
    subscriptionPlan: async (_, { id }) => {
      return await SubscriptionPlan.findById(id);
    },

    // User Subscriptions
    userSubscriptions: async (_, { userId }, { auth }) => {
      // Verify user is requesting their own data or is an admin
      const user = verifyToken(auth);
      if (user.role !== 'admin' && user.userId !== userId) {
        throw new Error('Not authorized to access this data');
      }
      return await Subscription.find({ userId });
    },
    subscription: async (_, { id }, { auth }) => {
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Verify user is requesting their own data or is an admin
      const user = verifyToken(auth);
      if (user.role !== 'admin' && user.userId !== subscription.userId) {
        throw new Error('Not authorized to access this data');
      }
      return subscription;
    },

    // Payments
    paymentsBySubscription: async (_, { subscriptionId }, { auth }) => {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Verify user is requesting their own data or is an admin
      const user = verifyToken(auth);
      if (user.role !== 'admin' && user.userId !== subscription.userId) {
        throw new Error('Not authorized to access this data');
      }
      
      return await Payment.find({ subscriptionId });
    },
    payment: async (_, { id }, { auth }) => {
      const payment = await Payment.findById(id);
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      const subscription = await Subscription.findById(payment.subscriptionId);
      
      // Verify user is requesting their own data or is an admin
      const user = verifyToken(auth);
      if (user.role !== 'admin' && user.userId !== subscription.userId) {
        throw new Error('Not authorized to access this data');
      }
      
      return payment;
    }
  },
  
  Mutation: {
    // Subscription Plans (Admin operations)
    createSubscriptionPlan: async (_, { input }, { auth }) => {
      // Verify user is admin
      isAdmin(auth);
      
      const subscriptionPlan = new SubscriptionPlan(input);
      return await subscriptionPlan.save();
    },
    updateSubscriptionPlan: async (_, { id, input }, { auth }) => {
      // Verify user is admin
      isAdmin(auth);
      
      return await SubscriptionPlan.findByIdAndUpdate(
        id,
        input,
        { new: true }
      );
    },
    deleteSubscriptionPlan: async (_, { id }, { auth }) => {
      // Verify user is admin
      isAdmin(auth);
      
      await SubscriptionPlan.findByIdAndDelete(id);
      return { success: true, message: 'Subscription plan deleted successfully' };
    },

    // User Subscriptions
    createSubscription: async (_, { input }, { auth, producer }) => {
      // Verify user
      const user = verifyToken(auth);
      
      // Only allow creating subscription for self or admin for others
      if (user.role !== 'admin' && user.userId !== input.userId) {
        throw new Error('Not authorized to create subscription for another user');
      }
      
      // Get subscription plan details
      const plan = await SubscriptionPlan.findById(input.planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }
      
      // Calculate end date based on plan duration
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // Create payment record first
      const payment = new Payment({
        amount: plan.price,
        paymentMethod: input.paymentMethod,
        status: 'successful', // In a real app, this would be determined by payment processor
        transactionId: uuidv4() // Mock transaction ID
      });
      
      // Create subscription
      const subscription = new Subscription({
        userId: input.userId,
        subscriptionPlanId: input.planId,
        startDate,
        endDate,
        status: 'active'
      });
      
      // Save both records
      const savedSubscription = await subscription.save();
      
      // Link payment to subscription
      payment.subscriptionId = savedSubscription._id;
      const savedPayment = await payment.save();
      
      // Update subscription with payment ID
      savedSubscription.paymentId = savedPayment._id;
      await savedSubscription.save();
      
      // Send event to Kafka
      await sendPaymentEvent(producer, {
        event: 'subscription_created',
        userId: input.userId,
        subscriptionId: savedSubscription._id.toString(),
        planName: plan.name,
        endDate: endDate.toISOString(),
        timestamp: new Date().toISOString()
      });
      
      return savedSubscription;
    },
    cancelSubscription: async (_, { id }, { auth, producer }) => {
      // Verify user
      const user = verifyToken(auth);
      
      // Get subscription
      const subscription = await Subscription.findById(id);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Only allow canceling own subscription or admin for others
      if (user.role !== 'admin' && user.userId !== subscription.userId) {
        throw new Error('Not authorized to cancel this subscription');
      }
      
      // Update subscription status
      subscription.status = 'cancelled';
      const updatedSubscription = await subscription.save();
      
      // Send event to Kafka
      await sendPaymentEvent(producer, {
        event: 'subscription_cancelled',
        userId: subscription.userId,
        subscriptionId: subscription._id.toString(),
        timestamp: new Date().toISOString()
      });
      
      return updatedSubscription;
    },

    // Payments
    processPayment: async (_, { input }, { auth, producer }) => {
      // Verify user
      const user = verifyToken(auth);
      
      // Get subscription
      const subscription = await Subscription.findById(input.subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Only allow payments for own subscription or admin for others
      if (user.role !== 'admin' && user.userId !== subscription.userId) {
        throw new Error('Not authorized to process payment for this subscription');
      }
      
      // Create and save payment
      const payment = new Payment({
        subscriptionId: input.subscriptionId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        status: 'successful', // In a real app, this would be determined by payment processor
        transactionId: uuidv4() // Mock transaction ID
      });
      
      const savedPayment = await payment.save();
      
      // Extend subscription end date if it's a renewal payment
      const plan = await SubscriptionPlan.findById(subscription.subscriptionPlanId);
      if (plan && subscription.status === 'active') {
        const newEndDate = new Date(subscription.endDate);
        newEndDate.setDate(newEndDate.getDate() + plan.duration);
        
        subscription.endDate = newEndDate;
        await subscription.save();
      }
      
      // Send event to Kafka
      await sendPaymentEvent(producer, {
        event: 'payment_processed',
        userId: subscription.userId,
        subscriptionId: subscription._id.toString(),
        amount: input.amount,
        timestamp: new Date().toISOString()
      });
      
      return savedPayment;
    }
  },
  
  // Field resolvers
  Subscription: {
    subscriptionPlan: async (parent) => {
      return await SubscriptionPlan.findById(parent.subscriptionPlanId);
    },
    payments: async (parent) => {
      return await Payment.find({ subscriptionId: parent._id });
    }
  }
};

module.exports = { resolvers };
