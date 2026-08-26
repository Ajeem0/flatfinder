const express = require("express");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

// POST /api/enquiries -- tenant contacts an owner about a property
router.post(
  "/",
  requireAuth,
  [body("propertyId").notEmpty().withMessage("propertyId is required")],
  handleValidation,
  async (req, res, next) => {
    try {
      const { propertyId, message } = req.body;
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) return res.status(404).json({ error: "Property not found" });

      const enquiry = await prisma.enquiry.create({
        data: { propertyId, userId: req.user.id, message },
      });

      res.status(201).json({ enquiry });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/enquiries -- tenant view: enquiries I've sent
// GET /api/enquiries?asOwner=true -- owner view: enquiries received on my listings
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const asOwner = req.query.asOwner === "true";

    const enquiries = await prisma.enquiry.findMany({
      where: asOwner ? { property: { ownerId: req.user.id } } : { userId: req.user.id },
      include: {
        property: { select: { id: true, title: true, slug: true, monthlyRent: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ results: enquiries });
  } catch (err) {
    next(err);
  }
});

// PUT /api/enquiries/:id -- owner updates status (responded/closed)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: req.params.id },
      include: { property: true },
    });
    if (!enquiry) return res.status(404).json({ error: "Enquiry not found" });
    if (enquiry.property.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Only the property owner can update this enquiry" });
    }

    const { status } = req.body;
    const updated = await prisma.enquiry.update({ where: { id: enquiry.id }, data: { status } });
    res.json({ enquiry: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
