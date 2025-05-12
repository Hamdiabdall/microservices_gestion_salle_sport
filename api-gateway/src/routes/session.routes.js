const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const router = express.Router();

// Load the protobuf definition
const PROTO_PATH = path.resolve(__dirname, '../../protos/session.proto');

// Load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Load the proto package 
const sessionProto = grpc.loadPackageDefinition(packageDefinition).session;

// Create gRPC client
const sessionClient = new sessionProto.SessionService(
  process.env.SESSION_SERVICE_URL || 'session-service:50051',
  grpc.credentials.createInsecure()
);

// Middleware to handle gRPC client errors
const handleGrpcError = (err, res) => {
  console.error('gRPC error:', err);
  
  if (err.code === grpc.status.NOT_FOUND) {
    return res.status(404).json({ message: 'Resource not found' });
  }
  
  if (err.code === grpc.status.ALREADY_EXISTS) {
    return res.status(409).json({ message: 'Resource already exists' });
  }
  
  if (err.code === grpc.status.PERMISSION_DENIED) {
    return res.status(403).json({ message: 'Permission denied' });
  }
  
  return res.status(500).json({ message: 'Internal server error', error: err.message });
};

// SESSIONS ENDPOINTS

// GET /api/sessions - List all sessions
router.get('/', (req, res) => {
  const { date, session_type, coach_id, include_past } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  sessionClient.ListSessions({
    date,
    session_type,
    coach_id,
    include_past: include_past === 'true',
    page,
    limit
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', (req, res) => {
  sessionClient.GetSession({ session_id: req.params.id }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// POST /api/sessions - Create a new session
router.post('/', (req, res) => {
  const { title, description, coach_id, capacity, start_time, end_time, location, session_type, difficulty_level } = req.body;
  
  sessionClient.CreateSession({
    title,
    description,
    coach_id,
    capacity: parseInt(capacity),
    start_time,
    end_time,
    location,
    session_type,
    difficulty_level
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.status(201).json(response);
  });
});

// PUT /api/sessions/:id - Update a session
router.put('/:id', (req, res) => {
  const { title, description, coach_id, capacity, start_time, end_time, location, session_type, difficulty_level, is_cancelled } = req.body;
  
  sessionClient.UpdateSession({
    session_id: req.params.id,
    title,
    description,
    coach_id,
    capacity: capacity ? parseInt(capacity) : undefined,
    start_time,
    end_time,
    location,
    session_type,
    difficulty_level,
    is_cancelled
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// DELETE /api/sessions/:id - Delete a session
router.delete('/:id', (req, res) => {
  sessionClient.DeleteSession({ session_id: req.params.id }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// RESERVATIONS ENDPOINTS

// POST /api/reservations - Create reservation
router.post('/', (req, res) => {
  const { session_id, user_id } = req.body;
  
  // If user_id is not provided, use the one from the JWT token
  const userId = user_id || req.user.userId;
  
  sessionClient.CreateReservation({
    session_id,
    user_id: userId
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.status(201).json(response);
  });
});

// GET /api/reservations/:id - Get reservation by ID
router.get('/:id', (req, res) => {
  sessionClient.GetReservation({ reservation_id: req.params.id }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// DELETE /api/reservations/:id - Cancel reservation
router.delete('/:id', (req, res) => {
  sessionClient.CancelReservation({
    reservation_id: req.params.id,
    user_id: req.user.userId  // From JWT token
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// GET /api/reservations/user/:userId - Get user reservations
router.get('/user/:userId', (req, res) => {
  // Only allow users to get their own reservations or admins to get any user's reservations
  if (req.user.userId !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Permission denied' });
  }
  
  const { status, include_past } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  sessionClient.ListUserReservations({
    user_id: req.params.userId,
    status,
    include_past: include_past === 'true',
    page,
    limit
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

// GET /api/reservations/session/:sessionId - Get session reservations
router.get('/session/:sessionId', (req, res) => {
  const { status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  sessionClient.ListSessionReservations({
    session_id: req.params.sessionId,
    status,
    page,
    limit
  }, (err, response) => {
    if (err) return handleGrpcError(err, res);
    res.json(response);
  });
});

module.exports = router;
