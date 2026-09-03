const express = require("express");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/db");
const { requireAuth, optionalAuth, requireUserType } = require("../middleware/auth");
const { uniqueSlug } = require("../utils/slug");
const { parseSmartQuery } = require("../utils/smartSearch");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
  }
  next();
}

const propertyInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  amenities: { include: { amenity: true } },
  owner: { select: { id: true, name: true, userType: true, profilePhotoUrl: true, isPhoneVerified: true, phone: true } },
  location: { include: { city: true } },
};

const propertyListInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  owner: { select: { id: true, name: true, userType: true, profilePhotoUrl: true, isPhoneVerified: true } },
  location: { include: { city: true } },
};

function serializeProperty(p, favoritedIds = new Set()) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    propertyType: p.propertyType,
    bhk: p.bhk,
    areaSqft: p.areaSqft,
    floor: p.floor,
    totalFloors: p.totalFloors,
    furnishing: p.furnishing,
    propertyAgeYears: p.propertyAgeYears,
    monthlyRent: p.monthlyRent,
    securityDeposit: p.securityDeposit,
    maintenance: p.maintenance,
    brokerage: p.brokerage,
    noBrokerage: p.noBrokerage,
    bachelorFriendly: p.bachelorFriendly,
    familyFriendly: p.familyFriendly,
    petFriendly: p.petFriendly,
    availableFrom: p.availableFrom,
    status: p.status,
    viewCount: p.viewCount,
    address: p.address,
    pincode: p.pincode,
    latitude: null,
    longitude: null,
    city: p.location?.city?.name || null,
    locationName: p.location?.name || null,
    videoUrl: p.videoUrl || null,
    images: p.images.map((i) => i.url),
    amenities: (p.amenities || []).map((a) => a.amenity.name),
    owner: p.owner
      ? {
          id: p.owner.id,
          name: p.owner.name,
          userType: p.owner.userType,
          profilePhotoUrl: p.owner.profilePhotoUrl,
          isPhoneVerified: p.owner.isPhoneVerified,
          // Phone is hidden until a tenant sends an enquiry (see /enquiries) -
          // simple "hide phone until contact requested" trust feature.
        }
      : null,
    isFavorited: favoritedIds.has(p.id),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    listingType: p.listingType,
    roomType: p.roomType,
    existingFlatmates: p.existingFlatmates,
    preferredGender: p.preferredGender,
    preferredAgeRange: p.preferredAgeRange,
    occupation: p.occupation,
    foodPreference: p.foodPreference,
    smokingPreference: p.smokingPreference,
    drinkingPreference: p.drinkingPreference,
    petsPreference: p.petsPreference,
    contactPreference: p.contactPreference,
  };
}

// GET /api/properties  -- search + filter + pagination
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const {
      q, // smart free-text query
      city,
      minRent,
      maxRent,
      propertyType,
      bhk, // comma separated, e.g. "1,2,3" where "4" means 4+
      furnishing, // comma separated
      bachelorFriendly,
      familyFriendly,
      petFriendly,
      noBrokerage,
      parking,
      lift,
      security,
      ac,
      wifi,
      attachedBathroom,
      availableFrom,
      ownerListed,
      roomType,
      preferredGender,
      foodPreference,
      occupation,
      sort = "relevance",
      view, // grid | list (ignored server-side, echoed back for convenience)
      page = "1",
      pageSize = "12",
    } = req.query;

    const where = { status: "PUBLISHED" };
    const smart = q ? parseSmartQuery(q) : {};

    if (q && !smart.locationText && !smart.maxRent && !smart.bhk) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { roomType: { contains: q, mode: "insensitive" } },
        { occupation: { contains: q, mode: "insensitive" } },
      ];
    }

    if (city || smart.locationText) {
      const cityName = city || smart.locationText;
      where.location = { is: { city: { is: { name: { contains: cityName, mode: "insensitive" } } } } };
    }

    const effectiveMinRent = minRent ? parseInt(minRent, 10) : undefined;
    const effectiveMaxRent = maxRent ? parseInt(maxRent, 10) : smart.maxRent;
    if (effectiveMinRent || effectiveMaxRent) {
      where.monthlyRent = {};
      if (effectiveMinRent) where.monthlyRent.gte = effectiveMinRent;
      if (effectiveMaxRent) where.monthlyRent.lte = effectiveMaxRent;
    }

    const effectivePropertyType = propertyType || smart.propertyType;
    if (effectivePropertyType) where.propertyType = effectivePropertyType;

    if (bhk) {
      const values = bhk.split(",").map((v) => parseInt(v, 10)).filter(Boolean);
      if (values.includes(4)) {
        where.bhk = { gte: 4 };
      } else if (values.length) {
        where.bhk = { in: values };
      }
    } else if (smart.bhk) {
      where.bhk = smart.bhk;
    }

    const effectiveFurnishing = furnishing || smart.furnishing;
    if (effectiveFurnishing) {
      const values = String(effectiveFurnishing).split(",");
      where.furnishing = values.length > 1 ? { in: values } : values[0];
    }

    if (bachelorFriendly === "true") where.bachelorFriendly = true;
    if (familyFriendly === "true") where.familyFriendly = true;
    if (petFriendly === "true" || smart.petFriendly) where.petFriendly = true;
    if (noBrokerage === "true" || smart.noBrokerage) where.noBrokerage = true;
    if (availableFrom) where.availableFrom = { lte: new Date(availableFrom) };
    if (ownerListed === "true") where.owner = { is: { userType: "OWNER" } };
    if (roomType) where.roomType = roomType;
    if (preferredGender) where.preferredGender = preferredGender;
    if (foodPreference) where.foodPreference = foodPreference;
    if (occupation) where.occupation = occupation;

    const amenityFilters = { parking, lift, security, ac, wifi, attachedBathroom }; // eslint-disable-line
    const amenityNameMap = {
      parking: "Parking",
      lift: "Lift",
      security: "Security",
      ac: "AC",
      wifi: "Wi-Fi",
      attachedBathroom: "Attached Bathroom",
    };
    const requestedAmenities = Object.entries({ parking, lift, security, ac, wifi, attachedBathroom })
      .filter(([, v]) => v === "true")
      .map(([k]) => amenityNameMap[k]);
    if (requestedAmenities.length) {
      where.AND = requestedAmenities.map((name) => ({
        amenities: { some: { amenity: { is: { name } } } },
      }));
    }

    const orderBy =
      sort === "price_asc"
        ? { monthlyRent: "asc" }
        : sort === "price_desc"
        ? { monthlyRent: "desc" }
        : sort === "newest"
        ? { createdAt: "desc" }
        : { createdAt: "desc" }; // "relevance" falls back to newest-first for this MVP

    const take = Math.min(parseInt(pageSize, 10) || 12, 50);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({ where, include: propertyListInclude, orderBy, take, skip }),
    ]);

    let favoritedIds = new Set();
    if (req.user) {
      const favs = await prisma.favorite.findMany({
        where: { userId: req.user.id, propertyId: { in: properties.map((p) => p.id) } },
        select: { propertyId: true },
      });
      favoritedIds = new Set(favs.map((f) => f.propertyId));
    }

    res.json({
      results: properties.map((p) => serializeProperty(p, favoritedIds)),
      pagination: { page: Number(page), pageSize: take, total, totalPages: Math.ceil(total / take) },
      parsedQuery: q ? smart : undefined,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/properties  -- create (owner/agent only)
router.post(
  "/",
  requireAuth,
  requireUserType("OWNER", "AGENT", "ADMIN"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("propertyType").notEmpty().withMessage("Property type is required"),
    body("monthlyRent").isInt({ min: 0 }).withMessage("Monthly rent must be a positive number"),
    body("cityName").trim().notEmpty().withMessage("City is required"),
    body("locationName").trim().notEmpty().withMessage("Locality/area is required"),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const {
        title, description, propertyType, bhk, areaSqft, floor, totalFloors,
        furnishing, propertyAgeYears, monthlyRent, securityDeposit, maintenance,
        brokerage, noBrokerage, bachelorFriendly, familyFriendly, petFriendly,
        availableFrom, address, pincode, latitude, longitude,
        cityName, locationName, videoUrl, images = [], amenities = [],
        listingType, roomType, existingFlatmates, preferredGender, preferredAgeRange,
        occupation, foodPreference, smokingPreference, drinkingPreference, petsPreference, contactPreference,
      } = req.body;

      const city = await prisma.city.upsert({
        where: { name: cityName },
        update: {},
        create: { name: cityName },
      });
      const location = await prisma.location.upsert({
        where: { name_cityId: { name: locationName, cityId: city.id } },
        update: {},
        create: { name: locationName, cityId: city.id, latitude, longitude },
      });

      const slug = await uniqueSlug(prisma, `${bhk ? bhk + "-bhk-" : ""}${title}-${locationName}`);

      const amenityRecords = await Promise.all(
        amenities.map((name) =>
          prisma.amenity.upsert({ where: { name }, update: {}, create: { name } })
        )
      );

      const property = await prisma.property.create({
        data: {
          slug,
          title,
          description,
          propertyType,
          bhk,
          areaSqft,
          floor,
          totalFloors,
          furnishing: furnishing || "UNFURNISHED",
          propertyAgeYears,
          monthlyRent,
          securityDeposit: securityDeposit || 0,
          maintenance: maintenance || 0,
          brokerage: brokerage || 0,
          noBrokerage: Boolean(noBrokerage),
          bachelorFriendly: bachelorFriendly !== false,
          familyFriendly: familyFriendly !== false,
          petFriendly: Boolean(petFriendly),
          availableFrom: availableFrom ? new Date(availableFrom) : null,
          address,
          pincode,
          latitude,
          longitude,
          videoUrl: videoUrl || null,
          listingType: listingType || null,
          roomType: roomType || null,
          existingFlatmates: existingFlatmates == null ? null : Number(existingFlatmates),
          preferredGender: preferredGender || null,
          preferredAgeRange: preferredAgeRange || null,
          occupation: occupation || null,
          foodPreference: foodPreference || null,
          smokingPreference: smokingPreference || null,
          drinkingPreference: drinkingPreference || null,
          petsPreference: petsPreference || null,
          contactPreference: contactPreference || null,
          ownerId: req.user.id,
          locationId: location.id,
          // New listings need admin approval before they go live (see spec section 18).
          status: "PENDING",
          images: { create: images.map((url, i) => ({ url, sortOrder: i })) },
          amenities: { create: amenityRecords.map((a) => ({ amenityId: a.id })) },
        },
        include: propertyInclude,
      });

      res.status(201).json({ property: serializeProperty(property) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/properties/mine -- return all properties owned by the authenticated user
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: properties.map((p) => serializeProperty(p)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:idOrSlug
router.get("/:idOrSlug", optionalAuth, async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const property = await prisma.property.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: propertyInclude,
    });
    if (!property) return res.status(404).json({ error: "Property not found" });

    // fire-and-forget view count increment
    prisma.property.update({ where: { id: property.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    let favoritedIds = new Set();
    let showPhone = false;
    if (req.user) {
      const fav = await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId: req.user.id, propertyId: property.id } },
      });
      if (fav) favoritedIds.add(property.id);

      // Reveal the owner's phone number only once this user has sent an enquiry
      // or is the owner themself -- keeps numbers hidden from casual browsers.
      if (req.user.id === property.ownerId) {
        showPhone = true;
      } else {
        const enquiry = await prisma.enquiry.findFirst({
          where: { propertyId: property.id, userId: req.user.id },
        });
        showPhone = Boolean(enquiry);
      }
    }

    const serialized = serializeProperty(property, favoritedIds);
    serialized.owner.phone = showPhone ? property.owner.phone : null;
    res.json({ property: serialized });
  } catch (err) {
    next(err);
  }
});

// PUT /api/properties/:id -- owner-only edit
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Property not found" });
    if (existing.ownerId !== req.user.id && req.user.userType !== "ADMIN") {
      return res.status(403).json({ error: "You can only edit your own listings" });
    }

    const {
      title, description, bhk, areaSqft, floor, totalFloors, furnishing,
      propertyAgeYears, monthlyRent, securityDeposit, maintenance, brokerage,
      noBrokerage, bachelorFriendly, familyFriendly, petFriendly, availableFrom,
      address, pincode, latitude, longitude, videoUrl, images, amenities, cityName, locationName, status, ownerId,
      listingType, roomType, existingFlatmates, preferredGender, preferredAgeRange, occupation, foodPreference,
      smokingPreference, drinkingPreference, petsPreference, contactPreference,
    } = req.body;

    const data = {
      title, description, bhk, areaSqft, floor, totalFloors, furnishing,
      propertyAgeYears, monthlyRent, securityDeposit, maintenance, brokerage,
      noBrokerage, bachelorFriendly, familyFriendly, petFriendly, address, pincode,
      listingType, roomType, existingFlatmates, preferredGender, preferredAgeRange, occupation, foodPreference,
      smokingPreference, drinkingPreference, petsPreference, contactPreference,
    };
    if (availableFrom) data.availableFrom = new Date(availableFrom);
    if (videoUrl !== undefined) data.videoUrl = videoUrl || null;
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    if (ownerId && req.user.userType === "ADMIN") data.owner = { connect: { id: ownerId } };

    if (cityName && locationName) {
      const city = await prisma.city.upsert({
        where: { name: cityName },
        update: {},
        create: { name: cityName },
      });
      const location = await prisma.location.upsert({
        where: { name_cityId: { name: locationName, cityId: city.id } },
        update: { latitude, longitude },
        create: { name: locationName, cityId: city.id, latitude, longitude },
      });
      data.location = { connect: { id: location.id } };
    }
    // Owners can only pull a listing or mark it rented; admins can set any review status.
    if (status && (req.user.userType === "ADMIN" || ["ARCHIVED", "RENTED"].includes(status))) {
      data.status = status;
    }

    if (Array.isArray(images)) {
      await prisma.propertyImage.deleteMany({ where: { propertyId: existing.id } });
      data.images = { create: images.map((url, i) => ({ url, sortOrder: i })) };
    }

    if (Array.isArray(amenities)) {
      const amenityRecords = await Promise.all(
        amenities.map((name) => prisma.amenity.upsert({ where: { name }, update: {}, create: { name } }))
      );
      await prisma.propertyAmenity.deleteMany({ where: { propertyId: existing.id } });
      data.amenities = { create: amenityRecords.map((amenity) => ({ amenityId: amenity.id })) };
    }

    const property = await prisma.property.update({
      where: { id: existing.id },
      data,
      include: propertyInclude,
    });
    res.json({ property: serializeProperty(property) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/properties/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Property not found" });
    if (existing.ownerId !== req.user.id && req.user.userType !== "ADMIN") {
      return res.status(403).json({ error: "You can only delete your own listings" });
    }
    await prisma.property.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/properties/:id/favorite -- toggle
router.post("/:id/favorite", requireAuth, async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user.id, propertyId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId: req.user.id, propertyId } });
    res.json({ favorited: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// GET /api/properties/mine -- return all properties owned by the authenticated user
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ results: properties });
  } catch (err) {
    next(err);
  }
});
