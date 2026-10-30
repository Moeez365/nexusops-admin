import logger from "../utils/logger.js";

/**
 * Middleware to catch 404 routes that don't match any registered endpoint
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Endpoint not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error-handling middleware for Express
 */
export const errorHandler = (err, req, res, next) => {
  // If response headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine appropriate HTTP status code
  let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message || "An unexpected server error occurred";

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid resource identifier: ${err.value}`;
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // MongoDB duplicate key error code
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for ${duplicatedField}. Must be unique.`;
  }

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

