const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createEvaluation, evaluationsForStudent } = require('../controllers/evaluation.controller');

const SUPERVISORS = ['ACADEMIC_SUPERVISOR', 'COMPANY_SUPERVISOR', 'ADMIN'];

router.post(
  '/',
  authenticate,
  authorize(...SUPERVISORS),
  [
    body('studentId').isInt().withMessage('studentId is required'),
    body('technicalScore').isInt({ min: 1, max: 5 }).withMessage('technicalScore 1-5'),
    body('professionalScore').isInt({ min: 1, max: 5 }).withMessage('professionalScore 1-5'),
    body('overallRating').isInt({ min: 1, max: 5 }).withMessage('overallRating 1-5'),
  ],
  validate,
  createEvaluation
);

// A student can view their own; supervisors/admin can view any.
router.get('/student/:studentId', authenticate, evaluationsForStudent);

module.exports = router;
