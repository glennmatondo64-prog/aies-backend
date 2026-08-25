const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const PUBLIC_USER = { id: true, name: true, email: true, role: true, phone: true, status: true, createdAt: true };

// POST /api/auth/register
// Creates a User and the matching profile row for its role.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, profile = {} } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('Email is already registered');

  const hashed = await bcrypt.hash(password, 10);

  // Create the user + role-specific profile in one transaction.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, password: hashed, role, phone },
    });

    switch (role) {
      case 'STUDENT':
        await tx.student.create({
          data: {
            userId: created.id,
            universityId: profile.universityId || null,
            department: profile.department || null,
            skills: profile.skills || null,
          },
        });
        break;
      case 'COMPANY':
        await tx.company.create({
          data: {
            userId: created.id,
            name: profile.companyName || name,
            industry: profile.industry || null,
            location: profile.location || null,
          },
        });
        break;
      case 'UNIVERSITY':
        await tx.university.create({
          data: {
            userId: created.id,
            name: profile.universityName || name,
            address: profile.address || null,
            contact: profile.contact || null,
          },
        });
        break;
      // Supervisors and Admin need only the User row.
      default:
        break;
    }
    return created;
  });

  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized('Invalid email or password');

  if (user.status === 'SUSPENDED') throw ApiError.forbidden('Account suspended');

  const token = signToken({ id: user.id, role: user.role });
  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me  (requires auth)
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      ...PUBLIC_USER,
      student: true,
      company: true,
      university: true,
    },
  });
  res.json({ success: true, user });
});

module.exports = { register, login, me };
