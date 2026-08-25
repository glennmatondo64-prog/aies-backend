const { prisma } = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard/admin  (admin overview stats)
const adminStats = asyncHandler(async (req, res) => {
  const [users, companies, universities, internships, applications] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.university.count(),
    prisma.internship.count(),
    prisma.application.count(),
  ]);

  const byStatus = await prisma.application.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  res.json({
    success: true,
    stats: {
      totalUsers: users,
      companies,
      universities,
      internships,
      applications,
      applicationsByStatus: byStatus.reduce((acc, r) => {
        acc[r.status] = r._count.status;
        return acc;
      }, {}),
    },
  });
});

// GET /api/dashboard/student  (student's own summary)
const studentStats = asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
  if (!student) return res.json({ success: true, stats: {} });

  const [applications, reports, evaluations] = await Promise.all([
    prisma.application.count({ where: { studentId: student.id } }),
    prisma.report.count({ where: { studentId: student.id } }),
    prisma.evaluation.count({ where: { studentId: student.id } }),
  ]);

  res.json({ success: true, stats: { applications, reports, evaluations } });
});

module.exports = { adminStats, studentStats };
