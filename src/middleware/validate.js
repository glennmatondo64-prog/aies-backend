const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator rules; collects any errors into one 400.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const msg = errors
    .array()
    .map((e) => `${e.path}: ${e.msg}`)
    .join('; ');
  next(ApiError.badRequest(msg));
}

module.exports = { validate };
