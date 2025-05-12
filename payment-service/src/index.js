const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { Kafka } = require('kafkajs');
require('dotenv').config();

// Initialize Kafka producer
const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['kafka:9092']
});

const producer = kafka.producer();

async function startServer() {
  // Connect to Kafka
  await producer.connect();
  console.log('Connected to Kafka');

  // Initialize Express
  const app = express();
  const PORT = process.env.PORT || 4000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Connect to MongoDB
  const mongoURI = process.env.MONGO_URI || 'mongodb://root:password@mongodb:27017/payment-service?authSource=admin';
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      // Add auth info from headers if available
      auth: req.headers.authorization ? req.headers.authorization : null,
      // Add Kafka producer to context
      producer
    }),
    playground: true,
    introspection: true
  });

  // Start Apollo Server
  await server.start();
  server.applyMiddleware({ app });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'payment-service' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Payment service running at http://localhost:${PORT}${server.graphqlPath}`);
  });

  // Handle process termination
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await producer.disconnect();
    process.exit(0);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
