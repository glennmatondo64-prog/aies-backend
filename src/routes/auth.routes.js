const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { register, login, me } = require('../controllers/auth.controller');

const ROLES = ['STUDENT', 'COMPANY', 'UNIVERSITY', 'ACADEMIC_SUPERVISOR', 'COMPANY_SUPERVISOR', 'ADMIN'];

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(ROLES).withMessage('Invalid role'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', authenticate, me);

module.exports = router;
