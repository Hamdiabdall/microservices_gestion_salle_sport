const express = require('express');
const axios = require('axios');

const router = express.Router();

// Payment service URL
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4000/graphql';

// Helper function to forward GraphQL requests
const forwardGraphQLRequest = async (query, variables, req, res) => {
  try {
    // Forward any authorization headers
    const headers = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Make request to GraphQL server
    const response = await axios.post(
      PAYMENT_SERVICE_URL,
      {
        query,
        variables
      },
      { headers }
    );

    // Check for GraphQL errors
    if (response.data.errors) {
      const errorMessage = response.data.errors[0].message || 'GraphQL error';
      return res.status(400).json({ message: errorMessage, errors: response.data.errors });
    }

    // Return GraphQL data
    return res.json(response.data.data);
  } catch (error) {
    console.error('Error forwarding GraphQL request:', error.message);
    
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        message: 'Error from payment service',
        error: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(503).json({ message: 'Payment service unavailable' });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
};

// SUBSCRIPTION ENDPOINTS

// GET /api/subscriptions - Get all subscription plans
router.get('/', async (req, res) => {
  const query = `
    query {
      subscriptionPlans {
        id
        name
        description
        price
        duration
        features
        isActive
      }
    }
  `;

  await forwardGraphQLRequest(query, {}, req, res);
});

// GET /api/subscriptions/:id - Get subscription plan by ID
router.get('/:id', async (req, res) => {
  const query = `
    query($id: ID!) {
      subscriptionPlan(id: $id) {
        id
        name
        description
        price
        duration
        features
        isActive
      }
    }
  `;

  const variables = { id: req.params.id };

  await forwardGraphQLRequest(query, variables, req, res);
});

// POST /api/subscriptions - Create new subscription plan (admin only)
router.post('/', async (req, res) => {
  const { name, description, price, duration, features, isActive } = req.body;

  const query = `
    mutation($input: SubscriptionPlanInput!) {
      createSubscriptionPlan(input: $input) {
        id
        name
        description
        price
        duration
        features
        isActive
      }
    }
  `;

  const variables = {
    input: {
      name,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      features,
      isActive
    }
  };

  await forwardGraphQLRequest(query, variables, req, res);
});

// PUT /api/subscriptions/:id - Update subscription plan
router.put('/:id', async (req, res) => {
  const { name, description, price, duration, features, isActive } = req.body;

  const query = `
    mutation($id: ID!, $input: SubscriptionPlanInput!) {
      updateSubscriptionPlan(id: $id, input: $input) {
        id
        name
        description
        price
        duration
        features
        isActive
      }
    }
  `;

  const variables = {
    id: req.params.id,
    input: {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      features,
      isActive
    }
  };

  await forwardGraphQLRequest(query, variables, req, res);
});

// DELETE /api/subscriptions/:id - Delete subscription plan
router.delete('/:id', async (req, res) => {
  const query = `
    mutation($id: ID!) {
      deleteSubscriptionPlan(id: $id) {
        success
        message
      }
    }
  `;

  const variables = { id: req.params.id };

  await forwardGraphQLRequest(query, variables, req, res);
});

// PAYMENT ENDPOINTS

// POST /api/payments/subscribe - Subscribe to a plan
router.post('/subscribe', async (req, res) => {
  const { userId, planId, paymentMethod } = req.body;

  // Use the user ID from JWT if not provided
  const userIdToUse = userId || req.user.userId;

  const query = `
    mutation($input: SubscriptionInput!) {
      createSubscription(input: $input) {
        id
        userId
        subscriptionPlanId
        startDate
        endDate
        status
        paymentId
      }
    }
  `;

  const variables = {
    input: {
      userId: userIdToUse,
      planId,
      paymentMethod
    }
  };

  await forwardGraphQLRequest(query, variables, req, res);
});

// GET /api/payments/user/:userId - Get user subscriptions
router.get('/user/:userId', async (req, res) => {
  // Check if the user is requesting their own data or is an admin
  if (req.user.userId !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  const query = `
    query($userId: ID!) {
      userSubscriptions(userId: $userId) {
        id
        userId
        subscriptionPlan {
          id
          name
          description
          price
          duration
        }
        startDate
        endDate
        status
        paymentId
      }
    }
  `;

  const variables = { userId: req.params.userId };

  await forwardGraphQLRequest(query, variables, req, res);
});

// GET /api/payments/subscription/:id - Get subscription details
router.get('/subscription/:id', async (req, res) => {
  const query = `
    query($id: ID!) {
      subscription(id: $id) {
        id
        userId
        subscriptionPlan {
          id
          name
          description
          price
          duration
        }
        startDate
        endDate
        status
        paymentId
        payments {
          id
          amount
          paymentDate
          paymentMethod
          status
        }
      }
    }
  `;

  const variables = { id: req.params.id };

  await forwardGraphQLRequest(query, variables, req, res);
});

// POST /api/payments/process - Process a payment
router.post('/process', async (req, res) => {
  const { subscriptionId, amount, paymentMethod } = req.body;

  const query = `
    mutation($input: PaymentInput!) {
      processPayment(input: $input) {
        id
        subscriptionId
        amount
        paymentDate
        paymentMethod
        status
        transactionId
      }
    }
  `;

  const variables = {
    input: {
      subscriptionId,
      amount: parseFloat(amount),
      paymentMethod
    }
  };

  await forwardGraphQLRequest(query, variables, req, res);
});

module.exports = router;
