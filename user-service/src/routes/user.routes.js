const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', auth, authorize('admin'), userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin or Self
router.get('/:id', auth, userController.getUserById);

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    authorize('admin'),
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role must be admin, member, or coach').isIn(['admin', 'member', 'coach'])
  ],
  userController.createUser
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin or Self
router.put(
  '/:id',
  [
    auth,
    check('firstName', 'First name must not be empty if provided').optional().not().isEmpty(),
    check('lastName', 'Last name must not be empty if provided').optional().not().isEmpty(),
    check('membershipStatus', 'Membership status must be valid').optional().isIn(['active', 'expired', 'pending', 'cancelled'])
  ],
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

// @route   PATCH /api/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.patch(
  '/:id/role',
  [
    auth,
    authorize('admin'),
    check('role', 'Role must be admin, member, or coach').isIn(['admin', 'member', 'coach'])
  ],
  userController.updateUserRole
);

module.exports = router;
