const ApiError = require('../utils/ApiError');

// 404 for any unmatched route.
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler. All errors funnel here.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Prisma known errors → friendlier messages
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `A record with that ${err.meta?.target?.join(', ') || 'value'} already exists`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = { notFound, errorHandler };
