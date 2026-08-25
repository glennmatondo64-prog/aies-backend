const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  apply, myApplications, applicantsForInternship, reviewApplication, assignSupervisors,
} = require('../controllers/application.controller');

// Student
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  [body('internshipId').isInt().withMessage('internshipId is required')],
  validate,
  apply
);
router.get('/mine', authenticate, authorize('STUDENT'), myApplications);

// Company
router.get('/internship/:id', authenticate, authorize('COMPANY'), applicantsForInternship);
router.patch(
  '/:id/status',
  authenticate,
  authorize('COMPANY'),
  [body('status').isIn(['ACCEPTED', 'REJECTED', 'COMPLETED', 'PENDING']).withMessage('Invalid status')],
  validate,
  reviewApplication
);

// Company or University assigns supervisors / dates
router.patch('/:id/assign', authenticate, authorize('COMPANY', 'UNIVERSITY', 'ADMIN'), assignSupervisors);

module.exports = router;
