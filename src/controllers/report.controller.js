const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { studentForUser } = require('./student.controller');

// POST /api/reports  (student submits a weekly report)
const submitReport = asyncHandler(async (req, res) => {
  const student = await studentForUser(req.user.id);
  const { weekNumber, activities, challenges, skillsLearned } = req.body;

  const report = await prisma.report.create({
    data: {
      studentId: student.id,
      weekNumber: Number(weekNumber),
      activities,
      challenges,
      skillsLearned,
    },
  });
  res.status(201).json({ success: true, report });
});

// GET /api/reports/mine  (student: my reports)
const myReports = asyncHandler(async (req, res) => {
  const student = await studentForUser(req.user.id);
  const reports = await prisma.report.findMany({
    where: { studentId: student.id },
    orderBy: { weekNumber: 'asc' },
  });
  res.json({ success: true, count: reports.length, reports });
});

// GET /api/reports/student/:studentId  (supervisor: a student's reports)
const reportsForStudent = asyncHandler(async (req, res) => {
  const studentId = Number(req.params.studentId);
  const reports = await prisma.report.findMany({
    where: { studentId },
    orderBy: { weekNumber: 'asc' },
  });
  res.json({ success: true, count: reports.length, reports });
});

// PATCH /api/reports/:id/review  (supervisor comments + approves/rejects)
const reviewReport = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { feedback, status } = req.body; // status: REVIEWED | APPROVED | REJECTED

  const report = await prisma.report.update({
    where: { id },
    data: { feedback: feedback ?? undefined, status: status ?? 'REVIEWED' },
  });
  res.json({ success: true, report });
});

module.exports = { submitReport, myReports, reportsForStudent, reviewReport };
