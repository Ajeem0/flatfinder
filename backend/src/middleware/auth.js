const { verifyToken } = require("../utils/jwt");

// Requires a valid Bearer token. Attaches { id, userType, email } to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, userType: payload.userType, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Attaches req.user if a valid token is present, but never rejects the request.
// Useful for routes like GET /properties/:id where logged-out users can still browse.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, userType: payload.userType, email: payload.email };
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

function requireUserType(...types) {
  return (req, res, next) => {
    if (!req.user || !types.includes(req.user.userType)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireUserType };
