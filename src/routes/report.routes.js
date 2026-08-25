const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  submitReport, myReports, reportsForStudent, reviewReport,
} = require('../controllers/report.controller');

const SUPERVISORS = ['ACADEMIC_SUPERVISOR', 'COMPANY_SUPERVISOR', 'ADMIN'];

// Student
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  [
    body('weekNumber').isInt({ min: 1 }).withMessage('weekNumber must be a positive integer'),
    body('activities').trim().notEmpty().withMessage('activities is required'),
  ],
  validate,
  submitReport
);
router.get('/mine', authenticate, authorize('STUDENT'), myReports);

// Supervisors
router.get('/student/:studentId', authenticate, authorize(...SUPERVISORS), reportsForStudent);
router.patch('/:id/review', authenticate, authorize(...SUPERVISORS), reviewReport);

module.exports = router;
