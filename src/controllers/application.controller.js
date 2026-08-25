const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { studentForUser } = require('./student.controller');
const { companyForUser } = require('./internship.controller');

// POST /api/applications  (student applies)  body: { internshipId }
const apply = asyncHandler(async (req, res) => {
  const student = await studentForUser(req.user.id);
  const internshipId = Number(req.body.internshipId);

  const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
  if (!internship) throw ApiError.notFound('Internship not found');

  const existing = await prisma.application.findUnique({
    where: { studentId_internshipId: { studentId: student.id, internshipId } },
  });
  if (existing) throw ApiError.conflict('You have already applied to this internship');

  const application = await prisma.application.create({
    data: { studentId: student.id, internshipId },
  });
  res.status(201).json({ success: true, application });
});

// GET /api/applications/mine  (student: my applications)
const myApplications = asyncHandler(async (req, res) => {
  const student = await studentForUser(req.user.id);
  const applications = await prisma.application.findMany({
    where: { studentId: student.id },
    include: { internship: { include: { company: { select: { name: true } } } } },
    orderBy: { appliedAt: 'desc' },
  });
  res.json({ success: true, count: applications.length, applications });
});

// GET /api/applications/internship/:id  (company: applicants for one internship)
const applicantsForInternship = asyncHandler(async (req, res) => {
  const company = await companyForUser(req.user.id);
  const internshipId = Number(req.params.id);

  const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
  if (!internship) throw ApiError.notFound('Internship not found');
  if (internship.companyId !== company.id) throw ApiError.forbidden('Not your internship');

  const applications = await prisma.application.findMany({
    where: { internshipId },
    include: { student: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { appliedAt: 'asc' },
  });
  res.json({ success: true, count: applications.length, applications });
});

// PATCH /api/applications/:id/status  (company reviews)  body: { status }
const reviewApplication = asyncHandler(async (req, res) => {
  const company = await companyForUser(req.user.id);
  const id = Number(req.params.id);
  const { status } = req.body; // ACCEPTED | REJECTED | COMPLETED

  const application = await prisma.application.findUnique({
    where: { id },
    include: { internship: true },
  });
  if (!application) throw ApiError.notFound('Application not found');
  if (application.internship.companyId !== company.id) throw ApiError.forbidden('Not your applicant');

  const updated = await prisma.application.update({
    where: { id },
    data: { status },
  });
  res.json({ success: true, application: updated });
});

// PATCH /api/applications/:id/assign  (company/university assigns supervisors + dates)
const assignSupervisors = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { academicSupervisorId, companySupervisorId, startDate, endDate } = req.body;

  const updated = await prisma.application.update({
    where: { id },
    data: {
      academicSupervisorId: academicSupervisorId ?? undefined,
      companySupervisorId: companySupervisorId ?? undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });
  res.json({ success: true, application: updated });
});

module.exports = { apply, myApplications, applicantsForInternship, reviewApplication, assignSupervisors };
