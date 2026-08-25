const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyProfile, updateMyProfile, listStudents } = require('../controllers/student.controller');

router.get('/me', authenticate, authorize('STUDENT'), getMyProfile);
router.put('/me', authenticate, authorize('STUDENT'), updateMyProfile);
router.get('/', authenticate, authorize('UNIVERSITY', 'ADMIN'), listStudents);

module.exports = router;
