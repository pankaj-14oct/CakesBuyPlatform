import { db } from "./db";
import { users, categories, cakes, addons, orders, deliveryAreas, promoCodes, reviews, navigationItems } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

const seedData = {
  categories: [
    // Parent category
    { name: "Cakes", slug: "cakes", description: "All types of delicious cakes", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop", isActive: true, parentId: null },
    // Child categories
    { name: "Birthday Cakes", slug: "birthday-cakes", description: "Delicious birthday cakes for all ages", image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Wedding Cakes", slug: "wedding-cakes", description: "Elegant wedding cakes for your special day", image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Anniversary Cakes", slug: "anniversary-cakes", description: "Celebrate milestones with beautiful cakes", image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Theme Cakes", slug: "theme-cakes", description: "Custom themed cakes for special occasions", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Eggless Cakes", slug: "eggless-cakes", description: "Delicious eggless options for everyone", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Photo Cakes", slug: "photo-cakes", description: "Personalized cakes with edible photos", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    // Flavor-based child categories
    { name: "Chocolate Cakes", slug: "chocolate-cakes", description: "Rich and indulgent chocolate cakes", image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Vanilla Cakes", slug: "vanilla-cakes", description: "Classic vanilla flavored cakes", image: "https://images.unsplash.com/photo-1586314075303-a93b06ced511?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Strawberry Cakes", slug: "strawberry-cakes", description: "Fresh strawberry flavored cakes", image: "https://images.unsplash.com/photo-1614707267971-d2d2dbe5b261?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Red Velvet Cakes", slug: "red-velvet-cakes", description: "Luxurious red velvet cakes", image: "https://images.unsplash.com/photo-1616690710400-a16d146927c5?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
    { name: "Fruit Cakes", slug: "fruit-cakes", description: "Fresh fruit topped cakes", image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop", isActive: true, parentId: 1 },
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

    // Seed categories with hierarchy
    console.log("📂 Seeding categories...");
    
    // First, create the parent category
    const parentCategory = await db.insert(categories).values({
      name: "Cakes",
      slug: "cakes",
      description: "All types of delicious cakes",
      icon: "🎂",
      isActive: true,
      parentId: null
    }).onConflictDoNothing().returning();
    
    // Get the parent category ID (either newly created or existing)
    const existingParent = await db.select().from(categories).where(eq(categories.slug, "cakes")).limit(1);
    const parentId = existingParent[0]?.id;
    
    if (parentId) {
      // Create child categories
      const childCategories = [
        { name: "Birthday Cakes", slug: "birthday-cakes", description: "Delicious birthday cakes for all ages", icon: "🎂", isActive: true, parentId },
        { name: "Wedding Cakes", slug: "wedding-cakes", description: "Elegant wedding cakes for your special day", icon: "💒", isActive: true, parentId },
        { name: "Anniversary Cakes", slug: "anniversary-cakes", description: "Celebrate milestones with beautiful cakes", icon: "💕", isActive: true, parentId },
        { name: "Theme Cakes", slug: "theme-cakes", description: "Custom themed cakes for special occasions", icon: "🎨", isActive: true, parentId },
        { name: "Eggless Cakes", slug: "eggless-cakes", description: "Delicious eggless options for everyone", icon: "🥚", isActive: true, parentId },
        { name: "Photo Cakes", slug: "photo-cakes", description: "Personalized cakes with edible photos", icon: "📸", isActive: true, parentId },
        { name: "Chocolate Cakes", slug: "chocolate-cakes", description: "Rich and indulgent chocolate cakes", icon: "🍫", isActive: true, parentId },
        { name: "Vanilla Cakes", slug: "vanilla-cakes", description: "Classic vanilla flavored cakes", icon: "🤍", isActive: true, parentId },
        { name: "Strawberry Cakes", slug: "strawberry-cakes", description: "Fresh strawberry flavored cakes", icon: "🍓", isActive: true, parentId },
        { name: "Red Velvet Cakes", slug: "red-velvet-cakes", description: "Luxurious red velvet cakes", icon: "❤️", isActive: true, parentId },
        { name: "Fruit Cakes", slug: "fruit-cakes", description: "Fresh fruit topped cakes", icon: "🍊", isActive: true, parentId },
      ];
      
      for (const category of childCategories) {
        await db.insert(categories).values(category).onConflictDoNothing();
      }
    }

    // Seed cakes with updated category references
    console.log("🍰 Seeding cakes...");
    
    // Get category IDs for mapping
    const birthdayCategory = await db.select().from(categories).where(eq(categories.slug, "birthday-cakes")).limit(1);
    const anniversaryCategory = await db.select().from(categories).where(eq(categories.slug, "anniversary-cakes")).limit(1);
    const chocolateCategory = await db.select().from(categories).where(eq(categories.slug, "chocolate-cakes")).limit(1);
    const vanillaCategory = await db.select().from(categories).where(eq(categories.slug, "vanilla-cakes")).limit(1);
    const redVelvetCategory = await db.select().from(categories).where(eq(categories.slug, "red-velvet-cakes")).limit(1);
    
    // Update cake data with correct category IDs
    const cakesWithCorrectIds = [
      {
        ...seedData.cakes[0],
        categoryId: chocolateCategory[0]?.id || birthdayCategory[0]?.id || parentId
      },
      {
        ...seedData.cakes[1],
        categoryId: vanillaCategory[0]?.id || birthdayCategory[0]?.id || parentId
      },
      {
        ...seedData.cakes[2],
        categoryId: redVelvetCategory[0]?.id || anniversaryCategory[0]?.id || parentId
      }
    ];
    
    for (const cake of cakesWithCorrectIds) {
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

    // Seed navigation items
    console.log("🧭 Seeding navigation items...");
    
    // Clear existing navigation items to prevent duplicates
    await db.delete(navigationItems);
    
    const navigationData = [
      { name: "Cakes", slug: "cakes", url: "/category/cakes", position: 0, isActive: true, isNew: false },
      { name: "Theme Cakes", slug: "theme-cakes", url: "/category/theme-cakes", position: 1, isActive: true, isNew: false },
      { name: "By Relationship", slug: "by-relationship", url: "/category/by-relationship", position: 2, isActive: true, isNew: false },
      { name: "Desserts", slug: "desserts", url: "/category/desserts", position: 3, isActive: true, isNew: false },
      { name: "Birthday", slug: "birthday", url: "/category/birthday-cakes", position: 4, isActive: true, isNew: false },
      { name: "Hampers", slug: "hampers", url: "/category/hampers", position: 5, isActive: true, isNew: true },
      { name: "Anniversary", slug: "anniversary", url: "/category/anniversary-cakes", position: 6, isActive: true, isNew: false },
      { name: "Occasion", slug: "occasion", url: "/category/occasion", position: 7, isActive: true, isNew: false },
      { name: "Customized Cakes", slug: "customized-cakes", url: "/customized-cakes", position: 8, isActive: true, isNew: false },
    ];
    
    for (const navItem of navigationData) {
      await db.insert(navigationItems).values(navItem);
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