const express = require("express");
const prisma = require("../config/db");

const router = express.Router();

// GET /api/locations -- cities + their localities, used to power search autocomplete
router.get("/", async (req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      include: { locations: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    res.json({
      results: cities.map((c) => ({
        id: c.id,
        name: c.name,
        state: c.state,
        isPopular: c.isPopular,
        localities: c.locations.map((l) => l.name),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
