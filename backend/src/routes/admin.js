const express = require("express");
const prisma = require("../config/db");
const { requireAuth, requireUserType } = require("../middleware/auth");

const router = express.Router();

const adminPropertyListSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  location: {
    select: {
      name: true,
      city: { select: { name: true } },
    },
  },
};

function formatAdminProperty(property) {
  return {
    ...property,
    city: property.location?.city?.name || null,
    locationName: property.location?.name || null,
    location: undefined,
  };
}

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

// POST /api/admin/users/:id/verify -- verify an owner with a saved phone number
router.post("/users/:id/verify", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "User not found" });
    if (existing.userType !== "OWNER") return res.status(400).json({ error: "Only owners can be verified" });
    if (!existing.phone) return res.status(400).json({ error: "Add a phone number before verifying this owner" });

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { isPhoneVerified: true },
      select: { id: true, isPhoneVerified: true },
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
      select: adminPropertyListSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: properties.map(formatAdminProperty) });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/properties/all
router.get("/properties/all", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      select: adminPropertyListSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: properties.map(formatAdminProperty) });
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
