const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { adminStats, studentStats } = require('../controllers/dashboard.controller');

router.get('/admin', authenticate, authorize('ADMIN'), adminStats);
router.get('/student', authenticate, authorize('STUDENT'), studentStats);

module.exports = router;
