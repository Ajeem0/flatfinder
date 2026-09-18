const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/db");
const { signToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");
const { requireUserType } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const { OTP_RESEND_DELAY_MS, createPhoneOtp, hashPhoneOtp, sendPhoneOtp } = require("../utils/phoneOtp");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  isPhoneVerified: u.isPhoneVerified,
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

// POST /api/auth/google -- verify a Google Identity Services ID token
router.post("/google", async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: "Google login is not configured" });
    const { credential, userType } = req.body;
    if (typeof credential !== "string" || !credential) return res.status(400).json({ error: "Google credential is required" });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) return res.status(401).json({ error: "Google account could not be verified" });

    let user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (!user) {
      const safeUserType = ["OWNER", "AGENT"].includes(userType) ? userType : "TENANT";
      user = await prisma.user.create({
        data: {
          name: payload.name || payload.email.split("@")[0],
          email: payload.email.toLowerCase(),
          passwordHash: await bcrypt.hash(`${payload.sub}:${process.env.JWT_SECRET || "dev-secret-change-me"}`, 10),
          userType: safeUserType,
          profilePhotoUrl: payload.picture || null,
          isPhoneVerified: false,
        },
      });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

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
    const phoneField = req.user.userType === "ADMIN" ? "adminPhone" : "phone";
    const nextPhone = req.user.userType === "ADMIN" ? adminPhone : phone;
    const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
    const phoneChanged = typeof nextPhone === "string" && nextPhone.trim() !== (existing?.[phoneField] || "");
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        phone: req.user.userType === "ADMIN" ? undefined : phone,
        adminPhone: req.user.userType === "ADMIN" ? adminPhone : undefined,
        ...(phoneChanged ? { isPhoneVerified: false } : {}),
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

// POST /api/auth/phone/request -- save a number and send its verification code
router.post("/phone/request", requireAuth, async (req, res, next) => {
  try {
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    if (phone.length < 7) return res.status(400).json({ error: "Enter a valid phone number" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const phoneField = user.userType === "ADMIN" ? "adminPhone" : "phone";
    if (user[phoneField] === phone && user.isPhoneVerified) return res.json({ verified: true });
    if (user.phoneOtpSentAt && Date.now() - user.phoneOtpSentAt.getTime() < OTP_RESEND_DELAY_MS) {
      return res.status(429).json({ error: "Please wait a minute before requesting another code" });
    }

    const { code, hash, expiresAt } = createPhoneOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        [phoneField]: phone,
        isPhoneVerified: false,
        phoneOtpHash: hash,
        phoneOtpExpiresAt: expiresAt,
        phoneOtpSentAt: new Date(),
        phoneOtpAttempts: 0,
      },
    });
    try {
      await sendPhoneOtp(phone, code);
    } catch (error) {
      await prisma.user.update({ where: { id: user.id }, data: { phoneOtpHash: null, phoneOtpExpiresAt: null, phoneOtpSentAt: null } });
      return res.status(503).json({ error: error.message });
    }
    res.json({ verified: false, message: "Verification code sent" });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/phone/verify -- verify the submitted phone number
router.post("/phone/verify", requireAuth, async (req, res, next) => {
  try {
    const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.phoneOtpHash || !user.phoneOtpExpiresAt) return res.status(400).json({ error: "Request a verification code first" });
    if (user.phoneOtpExpiresAt.getTime() < Date.now()) return res.status(400).json({ error: "That code has expired. Request a new one" });
    if (user.phoneOtpAttempts >= 5) return res.status(429).json({ error: "Too many attempts. Request a new code" });

    if (hashPhoneOtp(code) !== user.phoneOtpHash) {
      await prisma.user.update({ where: { id: user.id }, data: { phoneOtpAttempts: { increment: 1 } } });
      return res.status(400).json({ error: "Invalid verification code" });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true, phoneOtpHash: null, phoneOtpExpiresAt: null, phoneOtpSentAt: null, phoneOtpAttempts: 0 },
    });
    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/admin/password -- admin changes their own password
router.put("/admin/password", requireAuth, requireUserType("ADMIN"), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
