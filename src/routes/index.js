const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/students', require('./student.routes'));
router.use('/internships', require('./internship.routes'));
router.use('/applications', require('./application.routes'));
router.use('/reports', require('./report.routes'));
router.use('/evaluations', require('./evaluation.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
