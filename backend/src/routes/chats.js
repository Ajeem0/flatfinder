const express = require("express");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const userSelect = { id: true, name: true, profilePhotoUrl: true };

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

function conversationInclude() {
  return {
    listing: { select: { id: true, slug: true, title: true, monthlyRent: true } },
    starter: { select: userSelect },
    recipient: { select: userSelect },
    messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
  };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ starterId: req.user.id }, { recipientId: req.user.id }] },
      include: conversationInclude(),
      orderBy: { updatedAt: "desc" },
    });
    res.json({ results: conversations });
  } catch (err) { next(err); }
});

router.post(
  "/",
  requireAuth,
  [body("propertyId").trim().notEmpty().withMessage("propertyId is required")],
  validate,
  async (req, res, next) => {
    try {
      const listing = await prisma.property.findUnique({ where: { id: req.body.propertyId } });
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      if (listing.ownerId === req.user.id) return res.status(400).json({ error: "You cannot chat with yourself" });
      const blocked = await prisma.blockedUser.findUnique({ where: { blockerId_blockedId: { blockerId: listing.ownerId, blockedId: req.user.id } } });
      if (blocked) return res.status(403).json({ error: "This user is unavailable" });
      const conversation = await prisma.conversation.upsert({
        where: { propertyId_starterId_recipientId: { propertyId: listing.id, starterId: req.user.id, recipientId: listing.ownerId } },
        create: { propertyId: listing.id, starterId: req.user.id, recipientId: listing.ownerId },
        update: {},
        include: conversationInclude(),
      });
      res.status(201).json({ conversation });
    } catch (err) { next(err); }
  }
);

router.get("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conversation || ![conversation.starterId, conversation.recipientId].includes(req.user.id)) return res.status(404).json({ error: "Conversation not found" });
    const messages = await prisma.message.findMany({ where: { conversationId: conversation.id, deletedAt: null }, include: { sender: { select: userSelect } }, orderBy: { createdAt: "asc" }, take: 100 });
    await prisma.message.updateMany({ where: { conversationId: conversation.id, senderId: { not: req.user.id }, status: { not: "READ" } }, data: { status: "READ" } });
    res.json({ results: messages });
  } catch (err) { next(err); }
});

router.post(
  "/:id/messages",
  requireAuth,
  [body("body").trim().notEmpty().withMessage("Message cannot be empty"), body("body").isLength({ max: 2000 }).withMessage("Message is too long")],
  validate,
  async (req, res, next) => {
    try {
      const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
      if (!conversation || ![conversation.starterId, conversation.recipientId].includes(req.user.id)) return res.status(404).json({ error: "Conversation not found" });
      const otherUserId = conversation.starterId === req.user.id ? conversation.recipientId : conversation.starterId;
      const blocked = await prisma.blockedUser.findUnique({ where: { blockerId_blockedId: { blockerId: otherUserId, blockedId: req.user.id } } });
      if (blocked) return res.status(403).json({ error: "This user is unavailable" });
      const message = await prisma.message.create({ data: { conversationId: conversation.id, senderId: req.user.id, body: req.body.body.trim(), attachmentUrl: req.body.attachmentUrl || null }, include: { sender: { select: userSelect } } });
      res.status(201).json({ message });
    } catch (err) { next(err); }
  }
);

router.delete("/:conversationId/messages/:messageId", requireAuth, async (req, res, next) => {
  try {
    const message = await prisma.message.findFirst({ where: { id: req.params.messageId, conversationId: req.params.conversationId, senderId: req.user.id } });
    if (!message) return res.status(404).json({ error: "Message not found" });
    await prisma.message.update({ where: { id: message.id }, data: { deletedAt: new Date(), body: "Message deleted" } });
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post("/:id/block", requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conversation || ![conversation.starterId, conversation.recipientId].includes(req.user.id)) return res.status(404).json({ error: "Conversation not found" });
    const blockedId = conversation.starterId === req.user.id ? conversation.recipientId : conversation.starterId;
    await prisma.blockedUser.upsert({ where: { blockerId_blockedId: { blockerId: req.user.id, blockedId } }, create: { blockerId: req.user.id, blockedId }, update: {} });
    res.json({ blocked: true });
  } catch (err) { next(err); }
});

module.exports = router;
