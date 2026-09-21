const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "madhura_super_secret_key_2026";

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Token Required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or Expired Token" });
    }
    req.user = user;
    next();
  });
};
