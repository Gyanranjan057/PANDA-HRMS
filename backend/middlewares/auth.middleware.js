
import jwt from 'jsonwebtoken'

// Verify JWT from HttpOnly cookie or Bearer token
const requireAuth = (req, res, next) => {
  try {
    const cookieToken = req.cookies?.access_token;

    const authHeader = req.headers.authorization || "";

    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = decoded.user || decoded;

    if (!user || typeof user !== "object") {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    req.user = user

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Session expired. Please login again."
          : "Invalid authentication token",
    });
  }
};

// Check ADMIN / HR permission
const requireRole = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map(role => role.toLowerCase())

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    if (
      typeof req.user.role !== 'string' ||
      !normalizedRoles.includes(req.user.role.toLowerCase())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed for your role",
      });
    }

    next();
  };
};

export {
  requireAuth,
  requireRole,
};
