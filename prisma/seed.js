// Seeds the database with one user of each role plus a sample internship.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // University (with account)
  const uniUser = await prisma.user.create({
    data: {
      name: 'State University', email: 'university@aies.dev', password, role: 'UNIVERSITY',
      university: { create: { name: 'State University', address: '1 Campus Rd', contact: 'admin@uni.edu' } },
    },
    include: { university: true },
  });

  // Company (with account + internship)
  const companyUser = await prisma.user.create({
    data: {
      name: 'TechCorp', email: 'company@aies.dev', password, role: 'COMPANY',
      company: { create: { name: 'TechCorp', industry: 'Software', location: 'Remote' } },
    },
    include: { company: true },
  });

  await prisma.internship.create({
    data: {
      companyId: companyUser.company.id,
      title: 'Backend Developer Intern',
      description: 'Build REST APIs with Node.js and Express.',
      requiredSkills: 'JavaScript, Node.js, SQL',
      duration: '3 months',
      location: 'Remote',
      positions: 2,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  // Student (linked to the university)
  await prisma.user.create({
    data: {
      name: 'Alex Student', email: 'student@aies.dev', password, role: 'STUDENT',
      student: { create: { universityId: uniUser.university.id, department: 'Computer Science', skills: 'JavaScript, React' } },
    },
  });

  // Supervisors + admin
  await prisma.user.createMany({
    data: [
      { name: 'Dr. Academic', email: 'academic@aies.dev', password, role: 'ACADEMIC_SUPERVISOR' },
      { name: 'Sam Mentor', email: 'mentor@aies.dev', password, role: 'COMPANY_SUPERVISOR' },
      { name: 'Root Admin', email: 'admin@aies.dev', password, role: 'ADMIN' },
    ],
  });

  console.log('✔ Seed complete. All accounts use password: password123');
  console.log('  student@aies.dev · company@aies.dev · university@aies.dev');
  console.log('  academic@aies.dev · mentor@aies.dev · admin@aies.dev');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
