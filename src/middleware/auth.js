const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { prisma } = require('../config/prisma');

// Verifies the Bearer token and attaches the user to req.user.
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing authentication token');

    const decoded = verifyToken(token); // { id, role }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status === 'SUSPENDED') throw ApiError.forbidden('Account suspended');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    next(err);
  }
}

// Role gate. Usage: authorize('ADMIN'), authorize('COMPANY', 'ADMIN')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
