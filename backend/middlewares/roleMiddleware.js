module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized: Missing identity" });
    }

    const hasRole = allowedRoles.includes(req.user.role) || allowedRoles.includes('ALL');
    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: Access Denied for this role" });
    }

    next();
  };
};
