const express = require("express");
const prisma = require("../config/db");
const { requireAuth, requireUserType } = require("../middleware/auth");

const router = express.Router();

// GET /api/admin/users -- all users, excluding authentication secrets
router.get("/users", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        adminPhone: true,
        userType: true,
        profilePhotoUrl: true,
        isPhoneVerified: true,
        preferredLocation: true,
        budgetMin: true,
        budgetMax: true,
        propertyPreference: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { properties: true, favorites: true, enquiriesSent: true, visits: true, messages: true, conversationsStarted: true, conversationsReceived: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: users });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/phone -- admin-maintained owner contact number
router.put("/users/:id/phone", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { phone: phone || null },
      select: { id: true, name: true, email: true, phone: true, userType: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

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
