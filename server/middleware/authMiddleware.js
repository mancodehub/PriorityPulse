const jwt = require("jsonwebtoken");
const User = require("../models/User");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError("Authentication token is required", 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-__v");

    if (!user) {
      throw new HttpError("Authenticated user no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Invalid or expired authentication token", 401);
  }
});

module.exports = authMiddleware;
