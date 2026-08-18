const HttpError = require("../utils/httpError");

const notFound = (req, res, next) => {
  next(new HttpError(`Route not found: ${req.originalUrl}`, 404));
};

module.exports = notFound;
