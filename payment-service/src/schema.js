const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # Subscription Plans
  type SubscriptionPlan {
    id: ID!
    name: String!
    description: String!
    price: Float!
    duration: Int! # Duration in days
    features: [String!]
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input SubscriptionPlanInput {
    name: String!
    description: String!
    price: Float!
    duration: Int!
    features: [String!]
    isActive: Boolean!
  }

  # User Subscriptions
  type Subscription {
    id: ID!
    userId: ID!
    subscriptionPlanId: ID!
    subscriptionPlan: SubscriptionPlan
    startDate: String!
    endDate: String!
    status: String! # active, expired, cancelled
    paymentId: ID
    createdAt: String!
    updatedAt: String!
    payments: [Payment!]!
  }

  input SubscriptionInput {
    userId: ID!
    planId: ID!
    paymentMethod: String!
  }

  # Payments
  type Payment {
    id: ID!
    subscriptionId: ID!
    amount: Float!
    paymentDate: String!
    paymentMethod: String! # credit_card, paypal, bank_transfer
    status: String! # successful, failed, pending, refunded
    transactionId: String
    createdAt: String!
    updatedAt: String!
  }

  input PaymentInput {
    subscriptionId: ID!
    amount: Float!
    paymentMethod: String!
  }

  # Response types
  type DeleteResponse {
    success: Boolean!
    message: String
  }

  # Queries
  type Query {
    # Subscription Plans
    subscriptionPlans: [SubscriptionPlan!]!
    subscriptionPlan(id: ID!): SubscriptionPlan

    # User Subscriptions
    userSubscriptions(userId: ID!): [Subscription!]!
    subscription(id: ID!): Subscription

    # Payments
    paymentsBySubscription(subscriptionId: ID!): [Payment!]!
    payment(id: ID!): Payment
  }

  # Mutations
  type Mutation {
    # Subscription Plans (Admin operations)
    createSubscriptionPlan(input: SubscriptionPlanInput!): SubscriptionPlan!
    updateSubscriptionPlan(id: ID!, input: SubscriptionPlanInput!): SubscriptionPlan!
    deleteSubscriptionPlan(id: ID!): DeleteResponse!

    # User Subscriptions
    createSubscription(input: SubscriptionInput!): Subscription!
    cancelSubscription(id: ID!): Subscription!

    # Payments
    processPayment(input: PaymentInput!): Payment!
  }
`;

module.exports = { typeDefs };
