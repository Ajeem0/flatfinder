const express = require("express");
const prisma = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/favorites
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            location: { include: { city: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      results: favorites.map((f) => ({
        favoriteId: f.id,
        propertyId: f.property.id,
        slug: f.property.slug,
        title: f.property.title,
        image: f.property.images[0]?.url || null,
        monthlyRent: f.property.monthlyRent,
        bhk: f.property.bhk,
        city: f.property.location?.city?.name || null,
        locationName: f.property.location?.name || null,
        status: f.property.status,
        savedAt: f.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
