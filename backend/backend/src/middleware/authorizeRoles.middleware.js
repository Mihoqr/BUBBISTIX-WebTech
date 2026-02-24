// Middleware to allow access only if user's role is included in allowedRoles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    // Ensure authenticated user and role exist
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    // Check if user's role is permitted
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action"
      });
    }

    // Continue
    next();
  };
};

export default authorizeRoles;