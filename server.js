require('dotenv').config();
const app = require('./src/app');
const { prisma } = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Fail fast if the database isn't reachable.
    await prisma.$connect();
    console.log('✔ Database connected');

    const server = app.listen(PORT, () => {
      console.log(`✔ AIES API running on http://localhost:${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('✘ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
