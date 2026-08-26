/* eslint-disable no-await-in-loop */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { uniqueSlug } = require("../src/utils/slug");

const prisma = new PrismaClient();

const AMENITIES = [
  "Parking", "Lift", "Wi-Fi", "AC", "Power Backup", "Security",
  "Gym", "Swimming Pool", "Balcony", "Water Supply", "Attached Bathroom",
];

const CITIES = [
  { name: "Jaipur", state: "Rajasthan", isPopular: true, localities: ["Vaishali Nagar", "Malviya Nagar", "C-Scheme", "Mansarovar"] },
  { name: "Delhi", state: "Delhi", isPopular: true, localities: ["Dwarka", "Saket", "Karol Bagh", "Rohini"] },
  { name: "Mumbai", state: "Maharashtra", isPopular: true, localities: ["Andheri West", "Powai", "Bandra East", "Malad"] },
  { name: "Bangalore", state: "Karnataka", isPopular: true, localities: ["Koramangala", "HSR Layout", "Whitefield", "Indiranagar"] },
  { name: "Pune", state: "Maharashtra", isPopular: true, localities: ["Baner", "Kothrud", "Viman Nagar", "Hinjewadi"] },
  { name: "Hyderabad", state: "Telangana", isPopular: true, localities: ["Gachibowli", "Madhapur", "Kondapur", "Banjara Hills"] },
  { name: "Gurgaon", state: "Haryana", isPopular: true, localities: ["Sector 56", "DLF Phase 3", "Sohna Road", "Sector 29"] },
];

// [city, locality, title, type, bhk, rent, deposit, area, furnishing, amenities[]]
const PROPERTIES = [
  ["Jaipur", "Vaishali Nagar", "Modern 2 BHK Apartment", "APARTMENT", 2, 18000, 36000, 1200, "SEMI_FURNISHED", ["Parking", "Lift", "Security", "Water Supply"]],
  ["Jaipur", "Malviya Nagar", "Cozy 1 BHK near JECRC University", "APARTMENT", 1, 9500, 19000, 550, "FURNISHED", ["Wi-Fi", "AC", "Attached Bathroom"]],
  ["Jaipur", "C-Scheme", "Spacious 3 BHK with Balcony", "APARTMENT", 3, 32000, 60000, 1750, "SEMI_FURNISHED", ["Parking", "Lift", "Balcony", "Power Backup"]],
  ["Jaipur", "Mansarovar", "Boys PG with Food Included", "PG", null, 7500, 5000, 150, "FURNISHED", ["Wi-Fi", "AC", "Water Supply"]],
  ["Delhi", "Dwarka", "3 BHK Independent Floor", "INDEPENDENT_HOUSE", 3, 42000, 84000, 1800, "UNFURNISHED", ["Parking", "Power Backup", "Security"]],
  ["Delhi", "Saket", "Premium 2 BHK Near Metro", "APARTMENT", 2, 38000, 76000, 1150, "FURNISHED", ["Lift", "Gym", "Security", "AC"]],
  ["Delhi", "Karol Bagh", "Compact 1 BHK for Bachelors", "APARTMENT", 1, 15000, 30000, 480, "SEMI_FURNISHED", ["Wi-Fi", "Water Supply"]],
  ["Delhi", "Rohini", "Family 3 BHK with Parking", "APARTMENT", 3, 27000, 54000, 1400, "SEMI_FURNISHED", ["Parking", "Lift", "Security"]],
  ["Mumbai", "Andheri West", "Sea-facing 2 BHK", "APARTMENT", 2, 65000, 130000, 950, "FURNISHED", ["Lift", "Gym", "Swimming Pool", "Security"]],
  ["Mumbai", "Powai", "Studio Apartment near Tech Park", "APARTMENT", 1, 32000, 64000, 400, "FURNISHED", ["Wi-Fi", "AC", "Lift"]],
  ["Mumbai", "Bandra East", "Girls PG Co-living", "PG", null, 16000, 10000, 180, "FURNISHED", ["Wi-Fi", "AC", "Security", "Water Supply"]],
  ["Mumbai", "Malad", "3 BHK Family Apartment", "APARTMENT", 3, 48000, 96000, 1350, "SEMI_FURNISHED", ["Parking", "Lift", "Power Backup"]],
  ["Bangalore", "Koramangala", "Modern 2 BHK for Working Professionals", "APARTMENT", 2, 34000, 68000, 1100, "FURNISHED", ["Wi-Fi", "AC", "Gym", "Lift"]],
  ["Bangalore", "HSR Layout", "1 BHK Flatmate Friendly", "FLATMATE", 1, 14000, 14000, 500, "SEMI_FURNISHED", ["Wi-Fi", "Parking"]],
  ["Bangalore", "Whitefield", "Villa with Private Garden", "VILLA", 4, 75000, 150000, 2800, "FURNISHED", ["Parking", "Swimming Pool", "Security", "Power Backup"]],
  ["Bangalore", "Indiranagar", "Premium 3 BHK Duplex", "APARTMENT", 3, 55000, 110000, 1650, "FURNISHED", ["Lift", "Gym", "AC", "Balcony"]],
  ["Pune", "Baner", "2 BHK Near IT Park", "APARTMENT", 2, 24000, 48000, 1050, "SEMI_FURNISHED", ["Parking", "Lift", "Wi-Fi"]],
  ["Pune", "Kothrud", "Single Sharing PG", "PG", null, 8500, 5000, 130, "FURNISHED", ["Wi-Fi", "Water Supply"]],
  ["Pune", "Hinjewadi", "3 BHK Township Apartment", "APARTMENT", 3, 29000, 58000, 1500, "SEMI_FURNISHED", ["Parking", "Lift", "Gym", "Swimming Pool"]],
  ["Hyderabad", "Gachibowli", "2 BHK Near Financial District", "APARTMENT", 2, 26000, 52000, 1150, "FURNISHED", ["Lift", "AC", "Security", "Parking"]],
  ["Hyderabad", "Madhapur", "Independent 1 BHK", "APARTMENT", 1, 13500, 27000, 600, "SEMI_FURNISHED", ["Wi-Fi", "Water Supply"]],
  ["Gurgaon", "Sector 56", "Luxury 3 BHK High-Rise", "APARTMENT", 3, 52000, 104000, 1700, "FURNISHED", ["Lift", "Gym", "Swimming Pool", "Security"]],
  ["Gurgaon", "DLF Phase 3", "2 BHK Near Cyber Hub", "APARTMENT", 2, 40000, 80000, 1100, "FURNISHED", ["Lift", "AC", "Parking", "Power Backup"]],
];

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858",
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@flatfinder.in" },
    update: {},
    create: { name: "FlatFinder Admin", email: "admin@flatfinder.in", passwordHash, userType: "ADMIN", isPhoneVerified: true },
  });

  const owners = [];
  for (let i = 1; i <= 5; i++) {
    const owner = await prisma.user.upsert({
      where: { email: `owner${i}@flatfinder.in` },
      update: {},
      create: {
        name: `Owner ${i}`,
        email: `owner${i}@flatfinder.in`,
        phone: `98765${String(10000 + i)}`,
        passwordHash,
        userType: i % 4 === 0 ? "AGENT" : "OWNER",
        isPhoneVerified: true,
      },
    });
    owners.push(owner);
  }

  const tenant = await prisma.user.upsert({
    where: { email: "tenant@flatfinder.in" },
    update: {},
    create: {
      name: "Ajeem (Demo Tenant)",
      email: "tenant@flatfinder.in",
      phone: "9876500000",
      passwordHash,
      userType: "TENANT",
      preferredLocation: "Jaipur",
      budgetMin: 8000,
      budgetMax: 25000,
    },
  });

  const amenityRecords = {};
  for (const name of AMENITIES) {
    amenityRecords[name] = await prisma.amenity.upsert({ where: { name }, update: {}, create: { name } });
  }

  const cityRecords = {};
  const locationRecords = {};
  for (const c of CITIES) {
    const city = await prisma.city.upsert({
      where: { name: c.name },
      update: { isPopular: c.isPopular, state: c.state },
      create: { name: c.name, state: c.state, isPopular: c.isPopular },
    });
    cityRecords[c.name] = city;
    for (const loc of c.localities) {
      const location = await prisma.location.upsert({
        where: { name_cityId: { name: loc, cityId: city.id } },
        update: {},
        create: { name: loc, cityId: city.id },
      });
      locationRecords[`${c.name}::${loc}`] = location;
    }
  }

  let created = 0;
  for (let i = 0; i < PROPERTIES.length; i++) {
    const [city, locality, title, type, bhk, rent, deposit, area, furnishing, amenityNames] = PROPERTIES[i];
    const location = locationRecords[`${city}::${locality}`];
    const owner = owners[i % owners.length];
    const slug = await uniqueSlug(prisma, `${bhk ? bhk + "-bhk-" : ""}${title}-${locality}`);

    const exists = await prisma.property.findFirst({ where: { title, locationId: location.id } });
    if (exists) continue;

    await prisma.property.create({
      data: {
        slug,
        title,
        description: `${title} located in ${locality}, ${city}. Well-connected to schools, markets and public transport, ideal for ${type === "PG" ? "students and working professionals" : "families and working professionals"}.`,
        propertyType: type,
        bhk,
        areaSqft: area,
        floor: Math.ceil(Math.random() * 8),
        totalFloors: 10,
        furnishing,
        propertyAgeYears: Math.ceil(Math.random() * 10),
        monthlyRent: rent,
        securityDeposit: deposit,
        maintenance: Math.round(rent * 0.05),
        brokerage: 0,
        noBrokerage: true,
        bachelorFriendly: type === "PG" || type === "FLATMATE" || Math.random() > 0.3,
        familyFriendly: type !== "PG",
        petFriendly: Math.random() > 0.6,
        availableFrom: new Date(Date.now() + Math.floor(Math.random() * 30) * 86400000),
        status: "PUBLISHED",
        address: `${locality}, ${city}`,
        ownerId: owner.id,
        locationId: location.id,
        images: {
          create: [0, 1, 2].map((n) => ({ url: `${IMAGE_POOL[(i + n) % IMAGE_POOL.length]}?auto=format&fit=crop&w=1200&q=80`, sortOrder: n })),
        },
        amenities: { create: amenityNames.map((name) => ({ amenityId: amenityRecords[name].id })) },
      },
    });
    created += 1;
  }

  console.log(`Seed complete. ${created} properties created.`);
  console.log("Demo logins (password for all: password123):");
  console.log(`  Admin:  ${admin.email}`);
  console.log(`  Tenant: ${tenant.email}`);
  owners.forEach((o) => console.log(`  ${o.userType === "AGENT" ? "Agent" : "Owner"}:  ${o.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
