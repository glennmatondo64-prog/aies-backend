const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listInternships, getInternship, createInternship, updateInternship, deleteInternship,
} = require('../controllers/internship.controller');

// Public browse
router.get('/', listInternships);
router.get('/:id', getInternship);

// Company-only management
router.post(
  '/',
  authenticate,
  authorize('COMPANY'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validate,
  createInternship
);
router.put('/:id', authenticate, authorize('COMPANY'), updateInternship);
router.delete('/:id', authenticate, authorize('COMPANY'), deleteInternship);

module.exports = router;
