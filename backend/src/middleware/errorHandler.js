function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    const field = err.meta?.target?.join(", ") || "field";
    return res.status(409).json({ error: `${field} already in use` });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
