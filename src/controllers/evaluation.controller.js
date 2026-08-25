const { prisma } = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/evaluations  (supervisor evaluates a student)
const createEvaluation = asyncHandler(async (req, res) => {
  const { studentId, technicalScore, professionalScore, overallRating, comments } = req.body;

  const evaluation = await prisma.evaluation.create({
    data: {
      studentId: Number(studentId),
      supervisorId: req.user.id,
      technicalScore: Number(technicalScore),
      professionalScore: Number(professionalScore),
      overallRating: Number(overallRating),
      comments,
    },
  });
  res.status(201).json({ success: true, evaluation });
});

// GET /api/evaluations/student/:studentId
const evaluationsForStudent = asyncHandler(async (req, res) => {
  const studentId = Number(req.params.studentId);
  const evaluations = await prisma.evaluation.findMany({
    where: { studentId },
    include: { supervisor: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, count: evaluations.length, evaluations });
});

module.exports = { createEvaluation, evaluationsForStudent };
