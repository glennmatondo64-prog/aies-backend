const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Helper: get the Student row that belongs to the logged-in user.
async function studentForUser(userId) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw ApiError.notFound('Student profile not found');
  return student;
}

// GET /api/students/me
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user.id },
    include: { university: true, user: { select: { name: true, email: true, phone: true } } },
  });
  if (!student) throw ApiError.notFound('Student profile not found');
  res.json({ success: true, student });
});

// PUT /api/students/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const student = await studentForUser(req.user.id);
  const { department, skills, cv, portfolio, universityId } = req.body;

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      department: department ?? student.department,
      skills: skills ?? student.skills,
      cv: cv ?? student.cv,
      portfolio: portfolio ?? student.portfolio,
      universityId: universityId ?? student.universityId,
    },
  });
  res.json({ success: true, student: updated });
});

// GET /api/students  (university/admin: list students)
const listStudents = asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    include: { user: { select: { name: true, email: true } }, university: true },
    orderBy: { id: 'asc' },
  });
  res.json({ success: true, count: students.length, students });
});

module.exports = { getMyProfile, updateMyProfile, listStudents, studentForUser };
