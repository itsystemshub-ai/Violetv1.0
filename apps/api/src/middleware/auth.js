const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware (CommonJS)
 * Para uso en rutas JS heredadas
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const secret =
      process.env.JWT_SECRET ||
      "your-super-secret-key-min-32-characters-long-change-in-production";

    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      role: decoded.role,
      tenantId: decoded.tenantId,
      permissions: decoded.permissions || [],
      isSuperAdmin: decoded.isSuperAdmin || false,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid token",
    });
  }
};

/**
 * Authorization Middleware (CommonJS)
 */
const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasPermission = permissions.some(
      (permission) =>
        req.user.permissions.includes(permission) ||
        req.user.permissions.includes("*"),
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Insufficient permissions",
        required: permissions,
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
