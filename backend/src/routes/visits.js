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

// POST /api/visits -- tenant requests a visit
router.post(
  "/",
  requireAuth,
  [
    body("propertyId").notEmpty().withMessage("propertyId is required"),
    body("scheduledDate").isISO8601().withMessage("scheduledDate must be a valid date"),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { propertyId, scheduledDate } = req.body;
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) return res.status(404).json({ error: "Property not found" });

      const visit = await prisma.visit.create({
        data: { propertyId, userId: req.user.id, scheduledDate: new Date(scheduledDate) },
      });
      res.status(201).json({ visit });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/visits -- tenant's own visits, or ?asOwner=true for visits on my listings
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const asOwner = req.query.asOwner === "true";
    const visits = await prisma.visit.findMany({
      where: asOwner ? { property: { ownerId: req.user.id } } : { userId: req.user.id },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });
    res.json({ results: visits });
  } catch (err) {
    next(err);
  }
});

// PUT /api/visits/:id -- owner confirms/cancels, either side can mark completed
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id }, include: { property: true } });
    if (!visit) return res.status(404).json({ error: "Visit not found" });
    if (visit.property.ownerId !== req.user.id && visit.userId !== req.user.id) {
      return res.status(403).json({ error: "You are not part of this visit" });
    }
    const { status, scheduledDate } = req.body;
    const data = {};
    if (status) data.status = status;
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);

    const updated = await prisma.visit.update({ where: { id: visit.id }, data });
    res.json({ visit: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
