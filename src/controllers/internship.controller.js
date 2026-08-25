const { prisma } = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Helper: the Company row owned by the logged-in company user.
async function companyForUser(userId) {
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) throw ApiError.notFound('Company profile not found');
  return company;
}

// GET /api/internships?search=&location=&skill=
// Public browse + filter for students.
const listInternships = asyncHandler(async (req, res) => {
  const { search, location, skill } = req.query;

  const where = {
    AND: [
      search
        ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }
        : {},
      location ? { location: { contains: location, mode: 'insensitive' } } : {},
      skill ? { requiredSkills: { contains: skill, mode: 'insensitive' } } : {},
    ],
  };

  const internships = await prisma.internship.findMany({
    where,
    include: { company: { select: { name: true, industry: true, location: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, count: internships.length, internships });
});

// GET /api/internships/:id
const getInternship = asyncHandler(async (req, res) => {
  const internship = await prisma.internship.findUnique({
    where: { id: Number(req.params.id) },
    include: { company: { select: { name: true, industry: true, location: true } } },
  });
  if (!internship) throw ApiError.notFound('Internship not found');
  res.json({ success: true, internship });
});

// POST /api/internships  (company only)
const createInternship = asyncHandler(async (req, res) => {
  const company = await companyForUser(req.user.id);
  const { title, description, requiredSkills, duration, location, deadline, positions } = req.body;

  const internship = await prisma.internship.create({
    data: {
      companyId: company.id,
      title,
      description,
      requiredSkills,
      duration,
      location,
      deadline: deadline ? new Date(deadline) : null,
      positions: positions ? Number(positions) : 1,
    },
  });
  res.status(201).json({ success: true, internship });
});

// PUT /api/internships/:id  (owning company only)
const updateInternship = asyncHandler(async (req, res) => {
  const company = await companyForUser(req.user.id);
  const id = Number(req.params.id);

  const existing = await prisma.internship.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Internship not found');
  if (existing.companyId !== company.id) throw ApiError.forbidden('Not your internship');

  const { title, description, requiredSkills, duration, location, deadline, positions } = req.body;
  const internship = await prisma.internship.update({
    where: { id },
    data: {
      title, description, requiredSkills, duration, location,
      deadline: deadline ? new Date(deadline) : existing.deadline,
      positions: positions ? Number(positions) : existing.positions,
    },
  });
  res.json({ success: true, internship });
});

// DELETE /api/internships/:id  (owning company only)
const deleteInternship = asyncHandler(async (req, res) => {
  const company = await companyForUser(req.user.id);
  const id = Number(req.params.id);

  const existing = await prisma.internship.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Internship not found');
  if (existing.companyId !== company.id) throw ApiError.forbidden('Not your internship');

  await prisma.internship.delete({ where: { id } });
  res.json({ success: true, message: 'Internship deleted' });
});

module.exports = {
  listInternships, getInternship, createInternship, updateInternship, deleteInternship, companyForUser,
};
