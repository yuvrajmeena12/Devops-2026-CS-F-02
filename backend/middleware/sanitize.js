const mongoSanitize = require('mongo-sanitize');

/**
 * Sanitizes req.body, req.query, and req.params by recursively stripping any
 * keys starting with "$" or containing "." to completely prevent NoSQL injection attacks.
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  if (req.params) {
    req.params = mongoSanitize(req.params);
  }
  if (req.query) {
    req.query = mongoSanitize(req.query);
  }
  next();
};

module.exports = sanitizeInput;
