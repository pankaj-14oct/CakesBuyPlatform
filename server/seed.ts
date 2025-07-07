import { db } from "./db";
import { users, categories, cakes, addons, orders, deliveryAreas, promoCodes, reviews } from "@shared/schema";
import { hashPassword } from "./auth";

const seedData = {
  categories: [
    { name: "Birthday Cakes", slug: "birthday-cakes", description: "Delicious birthday cakes for all ages", icon: "🎂", isActive: true },
    { name: "Wedding Cakes", slug: "wedding-cakes", description: "Elegant wedding cakes for your special day", icon: "💒", isActive: true },
    { name: "Anniversary Cakes", slug: "anniversary-cakes", description: "Celebrate milestones with beautiful cakes", icon: "💕", isActive: true },
    { name: "Theme Cakes", slug: "theme-cakes", description: "Custom themed cakes for special occasions", icon: "🎨", isActive: true },
    { name: "Eggless Cakes", slug: "eggless-cakes", description: "Delicious eggless options for everyone", icon: "🥚", isActive: true },
    { name: "Photo Cakes", slug: "photo-cakes", description: "Personalized cakes with edible photos", icon: "📸", isActive: true },
  ],

  cakes: [
    {
      name: "Chocolate Fantasy Cake",
      slug: "chocolate-fantasy-cake",
      description: "Rich chocolate cake with layers of chocolate ganache and fresh berries",
      categoryId: 1,
      basePrice: "899",
      images: ["/api/placeholder/400/300"],
      flavors: ["Chocolate", "Dark Chocolate", "Milk Chocolate"],
      weights: [
        { weight: "0.5kg", price: 899 },
        { weight: "1kg", price: 1599 },
        { weight: "1.5kg", price: 2299 },
        { weight: "2kg", price: 2999 }
      ],
      isEggless: false,
      isBestseller: true,
      isAvailable: true,
      customizationOptions: {
        allowCustomMessage: true,
        allowCustomImage: true,
        maxMessageLength: 50
      },
      deliveryOptions: {
        sameDay: true,
        nextDay: true,
        scheduled: true,
        minOrderTime: 3
      }
    },
    {
      name: "Vanilla Dream Cake",
      slug: "vanilla-dream-cake", 
      description: "Classic vanilla sponge with fresh cream and seasonal fruits",
      categoryId: 1,
      basePrice: "799",
      images: ["/api/placeholder/400/300"],
      flavors: ["Vanilla", "French Vanilla", "Vanilla Bean"],
      weights: [
        { weight: "0.5kg", price: 799 },
        { weight: "1kg", price: 1399 },
        { weight: "1.5kg", price: 1999 },
        { weight: "2kg", price: 2599 }
      ],
      isEggless: true,
      isBestseller: true,
      isAvailable: true,
      customizationOptions: {
        allowCustomMessage: true,
        allowCustomImage: false,
        maxMessageLength: 30
      },
      deliveryOptions: {
        sameDay: true,
        nextDay: true,
        scheduled: true,
        minOrderTime: 2
      }
    },
    {
      name: "Red Velvet Romance",
      slug: "red-velvet-romance",
      description: "Moist red velvet cake with cream cheese frosting",
      categoryId: 3,
      basePrice: "1099",
      images: ["/api/placeholder/400/300"],
      flavors: ["Red Velvet", "Classic Red Velvet"],
      weights: [
        { weight: "0.5kg", price: 1099 },
        { weight: "1kg", price: 1799 },
        { weight: "1.5kg", price: 2499 },
        { weight: "2kg", price: 3199 }
      ],
      isEggless: false,
      isBestseller: false,
      isAvailable: true,
      customizationOptions: {
        allowCustomMessage: true,
        allowCustomImage: true,
        maxMessageLength: 40
      },
      deliveryOptions: {
        sameDay: false,
        nextDay: true,
        scheduled: true,
        minOrderTime: 4
      }
    }
  ],

  addons: [
    { name: "Birthday Candles (Set of 10)", description: "Colorful birthday candles", price: "50", category: "candles", isAvailable: true },
    { name: "Number Candles", description: "Custom number candles", price: "80", category: "candles", isAvailable: true },
    { name: "Greeting Card", description: "Beautiful greeting card with your message", price: "100", category: "cards", isAvailable: true },
    { name: "Fresh Flowers Bouquet", description: "Fresh seasonal flowers arrangement", price: "300", category: "flowers", isAvailable: true },
    { name: "Chocolate Box (12 pcs)", description: "Assorted premium chocolates", price: "400", category: "chocolates", isAvailable: true },
  ],

  deliveryAreas: [
    { name: "Sector 14", pincode: "122001", deliveryFee: "50", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Cyber City", pincode: "122002", deliveryFee: "60", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Golf Course Road", pincode: "122003", deliveryFee: "70", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: false, isActive: true },
    { name: "MG Road", pincode: "122004", deliveryFee: "50", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sohna Road", pincode: "122005", deliveryFee: "80", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: false, isActive: true },
    { name: "Udyog Vihar", pincode: "122006", deliveryFee: "60", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sector 49", pincode: "122007", deliveryFee: "50", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sector 56", pincode: "122009", deliveryFee: "70", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: false, isActive: true },
    { name: "Sector 40", pincode: "122011", deliveryFee: "60", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sector 45", pincode: "122012", deliveryFee: "50", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sector 46", pincode: "122015", deliveryFee: "70", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sector 47", pincode: "122016", deliveryFee: "60", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: false, isActive: true },
    { name: "Sector 50", pincode: "122017", deliveryFee: "50", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Sector 51", pincode: "122018", deliveryFee: "70", freeDeliveryThreshold: "500", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    { name: "Nirvana Country", pincode: "122051", deliveryFee: "80", freeDeliveryThreshold: "500", sameDayAvailable: false, midnightAvailable: false, isActive: true },
    { name: "Emerald Hills", pincode: "122052", deliveryFee: "80", freeDeliveryThreshold: "500", sameDayAvailable: false, midnightAvailable: false, isActive: true },
  ],

  promoCodes: [
    {
      code: "WELCOME20",
      description: "Welcome offer for new customers",
      discountType: "percentage",
      discountValue: "20",
      minOrderValue: "500",
      maxDiscount: "200",
      usageLimit: 100,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      code: "SAVE100",
      description: "Flat ₹100 off on orders above ₹1000",
      discountType: "fixed",
      discountValue: "100",
      minOrderValue: "1000",
      maxDiscount: null,
      usageLimit: 50,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    }
  ],

  orders: [
    {
      orderNumber: "ORD-2024-001",
      userId: 1,
      items: [{ cakeId: 1, name: "Chocolate Fantasy Cake", quantity: 1, weight: "1kg", flavor: "Chocolate", price: 1599, addons: [] }],
      subtotal: "1599",
      deliveryFee: "0",
      discount: "0",
      total: "1599",
      status: "delivered",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "John Doe",
        phone: "9876543210",
        address: "123 MG Road, Gurgaon",
        pincode: "122001",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2024-12-25'),
      specialInstructions: "Ring the doorbell twice"
    },
    {
      orderNumber: "ORD-2024-002",
      userId: 1,
      items: [{ cakeId: 2, name: "Vanilla Dream Cake", quantity: 1, weight: "1kg", flavor: "Vanilla", price: 1399, addons: [] }],
      subtotal: "1399",
      deliveryFee: "50",
      discount: "0",
      total: "1449",
      status: "confirmed",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "Jane Smith",
        phone: "9876543211",
        address: "456 Sector 14, Gurgaon",
        pincode: "122001",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2025-01-08'),
      deliveryTimeSlot: "slot1",
      specialInstructions: "Call before delivery"
    },
    {
      orderNumber: "ORD-2024-003",
      userId: 1,
      items: [{ cakeId: 3, name: "Red Velvet Romance", quantity: 1, weight: "1.5kg", flavor: "Red Velvet", price: 1799, addons: [] }],
      subtotal: "1799",
      deliveryFee: "0",
      discount: "0",
      total: "1799",
      status: "preparing",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "Mike Johnson",
        phone: "9876543212",
        address: "789 DLF Phase 1, Gurgaon",
        pincode: "122002",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2025-01-08'),
      deliveryTimeSlot: "slot2",
      specialInstructions: "Anniversary cake - handle with care"
    },
    {
      orderNumber: "ORD-2024-004",
      userId: 1,
      items: [{ cakeId: 1, name: "Chocolate Fantasy Cake", quantity: 1, weight: "0.5kg", flavor: "Chocolate", price: 899, addons: [] }],
      subtotal: "899",
      deliveryFee: "50",
      discount: "0",
      total: "949",
      status: "out_for_delivery",
      paymentMethod: "cod",
      paymentStatus: "pending",
      deliveryAddress: {
        name: "Sarah Wilson",
        phone: "9876543213",
        address: "321 Cyber City, Gurgaon",
        pincode: "122002",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2025-01-07'),
      deliveryTimeSlot: "slot3",
      specialInstructions: "COD order - collect payment"
    },
    {
      orderNumber: "ORD-2024-005",
      userId: 1,
      items: [{ cakeId: 2, name: "Vanilla Dream Cake", quantity: 1, weight: "1.5kg", flavor: "Vanilla", price: 1999, addons: [] }],
      subtotal: "1999",
      deliveryFee: "0",
      discount: "0",
      total: "1999",
      status: "pending",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "David Brown",
        phone: "9876543214",
        address: "654 Golf Course Road, Gurgaon",
        pincode: "122003",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2025-01-09'),
      deliveryTimeSlot: "slot4",
      specialInstructions: "Birthday surprise - deliver quietly"
    }
  ]
};

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Seed admin user first
    console.log("👤 Seeding admin user...");
    const adminPassword = await hashPassword("password123");
    const adminUser = {
      phone: "1111111111",
      email: "admin@cakesbuy.com",
      password: adminPassword,
      name: "Admin User",
      role: "admin" as const,
      walletBalance: "0",
      loyaltyPoints: 0,
      loyaltyTier: "bronze" as const
    };
    await db.insert(users).values(adminUser).onConflictDoNothing();

    // Seed categories
    console.log("📂 Seeding categories...");
    for (const category of seedData.categories) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }

    // Seed cakes
    console.log("🍰 Seeding cakes...");
    for (const cake of seedData.cakes) {
      await db.insert(cakes).values(cake).onConflictDoNothing();
    }

    // Seed addons
    console.log("🎁 Seeding addons...");
    for (const addon of seedData.addons) {
      await db.insert(addons).values(addon).onConflictDoNothing();
    }

    // Seed delivery areas
    console.log("🚚 Seeding delivery areas...");
    for (const area of seedData.deliveryAreas) {
      await db.insert(deliveryAreas).values(area).onConflictDoNothing();
    }

    // Seed promo codes
    console.log("🎫 Seeding promo codes...");
    for (const promo of seedData.promoCodes) {
      await db.insert(promoCodes).values(promo).onConflictDoNothing();
    }

    // Seed orders
    console.log("📦 Seeding orders...");
    for (const order of seedData.orders) {
      await db.insert(orders).values(order).onConflictDoNothing();
    }

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}