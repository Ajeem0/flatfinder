const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/db");
const { signToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
  }
  next();
}

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  adminPhone: u.adminPhone,
  userType: u.userType,
  profilePhotoUrl: u.profilePhotoUrl,
  preferredLocation: u.preferredLocation,
  budgetMin: u.budgetMin,
  budgetMax: u.budgetMax,
});

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("userType").optional().isIn(["TENANT", "OWNER", "AGENT"]).withMessage("Invalid user type"),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { name, email, phone, password, userType } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: "An account with this email already exists" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, phone, passwordHash, userType: userType || "TENANT" },
      });

      const token = signToken(user);
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").notEmpty().withMessage("Email or phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone: email }] },
      });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken(user);
      res.json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/me
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, phone, adminPhone, profilePhotoUrl, preferredLocation, budgetMin, budgetMax, propertyPreference } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        phone: req.user.userType === "ADMIN" ? undefined : phone,
        adminPhone: req.user.userType === "ADMIN" ? adminPhone : undefined,
        profilePhotoUrl,
        preferredLocation,
        budgetMin,
        budgetMax,
        propertyPreference,
      },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
