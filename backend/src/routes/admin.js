const express = require("express");
const prisma = require("../config/db");
const { requireAuth, requireUserType } = require("../middleware/auth");

const router = express.Router();

// GET /api/admin/properties/pending
router.get("/properties/pending", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { status: "PENDING" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        location: { include: { city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: properties });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/properties/all
router.get("/properties/all", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        location: { include: { city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: properties });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/properties/:id/approve
router.post("/properties/:id/approve", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const property = await prisma.property.update({ where: { id: req.params.id }, data: { status: "PUBLISHED" } });
    res.json({ property });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/properties/:id/reject
router.post("/properties/:id/reject", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const property = await prisma.property.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
    res.json({ property });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
