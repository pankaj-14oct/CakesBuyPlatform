import { db } from "./db";
import { users, categories, cakes, addons, orders, deliveryAreas, promoCodes, reviews, navigationItems, pages } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq, sql } from "drizzle-orm";

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

    // Seed 25 dummy users for pagination testing
    console.log("👤 Seeding dummy users...");
    const dummyUsers = [];
    const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Emily", "James", "Emma", "William", "Olivia", "Alexander", "Sophia", "Benjamin", "Isabella", "Daniel", "Mia", "Matthew", "Charlotte", "Andrew", "Amelia", "Christopher", "Harper", "Anthony"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"];
    const loyaltyTiers = ["Bronze", "Silver", "Gold", "Platinum"];
    
    for (let i = 1; i <= 25; i++) {
      const userPassword = await hashPassword(`password${i}`);
      const firstName = firstNames[i - 1];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const phone = `98765${String(10000 + i).slice(-5)}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const totalSpent = Math.floor(Math.random() * 10000);
      const loyaltyPoints = Math.floor(totalSpent / 10); // 1 point per ₹10
      const orderCount = Math.floor(Math.random() * 20) + 1;
      const walletBalance = Math.floor(Math.random() * 1000);
      const loyaltyTier = loyaltyTiers[Math.floor(totalSpent / 2500)]; // Bronze: 0-2499, Silver: 2500-4999, Gold: 5000-7499, Platinum: 7500+
      
      const dummyUser = {
        phone,
        email,
        password: userPassword,
        name: `${firstName} ${lastName}`,
        role: "customer" as const,
        walletBalance: walletBalance.toString(),
        loyaltyPoints,
        loyaltyTier,
        totalSpent: totalSpent.toString(),
        orderCount,
        birthday: Math.random() > 0.5 ? `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
        anniversary: Math.random() > 0.7 ? `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : null,
        addresses: Math.random() > 0.3 ? [
          {
            id: `addr_${i}_1`,
            name: `${firstName} ${lastName}`,
            type: "Home",
            address: `${Math.floor(Math.random() * 999) + 1} ${["MG Road", "Sector 14", "DLF Phase 1", "Cyber City", "Golf Course Road", "Sohna Road"][Math.floor(Math.random() * 6)]}`,
            pincode: ["122001", "122002", "122003", "122004", "122005"][Math.floor(Math.random() * 5)],
            city: "Gurgaon",
            landmark: Math.random() > 0.5 ? ["Near Metro Station", "Opposite Mall", "Behind Hospital", "Near Park"][Math.floor(Math.random() * 4)] : null,
            isDefault: true
          }
        ] : []
      };
      
      dummyUsers.push(dummyUser);
    }
    
    // Insert dummy users in batches
    for (const user of dummyUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

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
    
    // First, remove any existing duplicates by keeping only the first occurrence of each unique addon
    await db.execute(sql`
      DELETE FROM addons 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM addons 
        GROUP BY name, description, price, category
      );
    `);
    
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

    // Seed sample pages
    console.log("📄 Seeding sample pages...");
    
    const pagesData = [
      {
        title: "About Us",
        slug: "about-us",
        content: `<div class="prose max-w-none">
          <h1>About CakesBuy</h1>
          <p>Welcome to CakesBuy - your premier destination for 100% eggless cakes in Gurgaon. Since our establishment, we have been committed to creating delicious, fresh, and beautiful cakes that bring joy to every celebration.</p>
          
          <h2>Our Story</h2>
          <p>CakesBuy was founded with a simple mission: to provide high-quality, eggless cakes that don't compromise on taste or quality. We understand the importance of dietary preferences and restrictions, which is why every cake we create is completely egg-free while maintaining the rich, moist texture and delicious flavors you expect.</p>
          
          <h2>What Makes Us Special</h2>
          <ul>
            <li><strong>100% Eggless:</strong> All our cakes are made without eggs, perfect for vegetarians and those with egg allergies</li>
            <li><strong>Same-Day Delivery:</strong> Fresh cakes delivered to your doorstep in Gurgaon within hours</li>
            <li><strong>Custom Photo Cakes:</strong> Personalize your celebrations with high-quality photo prints on cakes</li>
            <li><strong>Premium Ingredients:</strong> We use only the finest ingredients to ensure exceptional taste and quality</li>
            <li><strong>Expert Bakers:</strong> Our skilled team has years of experience in eggless baking</li>
          </ul>
          
          <h2>Our Commitment</h2>
          <p>At CakesBuy, we are committed to making every celebration special. Whether it's a birthday, anniversary, or any special occasion, we ensure that our cakes not only look amazing but taste incredible too.</p>
          
          <p>Contact us today to experience the difference that fresh, eggless cakes can make for your celebrations!</p>
        </div>`,
        metaDescription: "CakesBuy - Premium 100% eggless cakes in Gurgaon with same-day delivery. Custom photo cakes, birthday cakes, anniversary cakes and more.",
        metaKeywords: "eggless cakes, cakes in gurgaon, same day delivery, photo cakes, birthday cakes, anniversary cakes",
        isPublished: true,
        showInMenu: true,
        menuOrder: 1,
        createdBy: 1,
        updatedBy: 1
      },
      {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: `<div class="prose max-w-none">
          <h1>Privacy Policy</h1>
          <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
          
          <h2>Information We Collect</h2>
          <p>When you use CakesBuy, we may collect the following information:</p>
          <ul>
            <li>Personal information such as name, email address, and phone number</li>
            <li>Delivery address and payment information</li>
            <li>Order history and preferences</li>
            <li>Website usage data and cookies</li>
          </ul>
          
          <h2>How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Process and fulfill your cake orders</li>
            <li>Communicate with you about your orders</li>
            <li>Improve our services and user experience</li>
            <li>Send you promotional offers (with your consent)</li>
            <li>Comply with legal obligations</li>
          </ul>
          
          <h2>Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
          <ul>
            <li>Delivery partners to fulfill your orders</li>
            <li>Payment processors for transaction processing</li>
            <li>Legal authorities when required by law</li>
          </ul>
          
          <h2>Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and update your personal information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>File a complaint with relevant authorities</li>
          </ul>
          
          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <ul>
            <li>Email: privacy@cakesbuy.com</li>
            <li>Phone: +91-XXXXXXXXXX</li>
          </ul>
        </div>`,
        metaDescription: "CakesBuy Privacy Policy - Learn how we collect, use, and protect your personal information when you order cakes online.",
        metaKeywords: "privacy policy, data protection, cakesbuy terms",
        isPublished: true,
        showInMenu: true,
        menuOrder: 2,
        createdBy: 1,
        updatedBy: 1
      },
      {
        title: "Terms & Conditions",
        slug: "terms-conditions",
        content: `<div class="prose max-w-none">
          <h1>Terms & Conditions</h1>
          
          <h2>1. Acceptance of Terms</h2>
          <p>By using CakesBuy's services, you agree to comply with and be bound by these Terms & Conditions.</p>
          
          <h2>2. Orders and Payment</h2>
          <ul>
            <li>All orders are subject to availability and confirmation</li>
            <li>Prices are subject to change without notice</li>
            <li>Payment must be completed to confirm your order</li>
            <li>We accept various payment methods including UPI, cards, and cash on delivery</li>
          </ul>
          
          <h2>3. Delivery</h2>
          <ul>
            <li>We deliver within Gurgaon city limits</li>
            <li>Delivery charges may apply based on location and order value</li>
            <li>Same-day delivery is available for orders placed before 6 PM</li>
            <li>We are not responsible for delays due to weather or unforeseen circumstances</li>
          </ul>
          
          <h2>4. Cancellation and Refunds</h2>
          <ul>
            <li>Orders can be cancelled up to 2 hours before delivery time</li>
            <li>Refunds will be processed within 5-7 business days</li>
            <li>Custom/photo cakes cannot be cancelled once production begins</li>
          </ul>
          
          <h2>5. Quality Guarantee</h2>
          <ul>
            <li>We guarantee fresh, high-quality eggless cakes</li>
            <li>If you're not satisfied, contact us within 2 hours of delivery</li>
            <li>We reserve the right to replace or refund defective products</li>
          </ul>
          
          <h2>6. Limitation of Liability</h2>
          <p>CakesBuy's liability is limited to the value of the order placed. We are not responsible for any indirect or consequential damages.</p>
          
          <h2>7. Contact Information</h2>
          <p>For any questions regarding these terms, contact us at:</p>
          <ul>
            <li>Email: support@cakesbuy.com</li>
            <li>Phone: +91-XXXXXXXXXX</li>
          </ul>
        </div>`,
        metaDescription: "CakesBuy Terms & Conditions - Read our terms of service for ordering eggless cakes online in Gurgaon.",
        metaKeywords: "terms and conditions, cakesbuy terms, order terms, delivery terms",
        isPublished: true,
        showInMenu: true,
        menuOrder: 3,
        createdBy: 1,
        updatedBy: 1
      }
    ];
    
    for (const page of pagesData) {
      await db.insert(pages).values(page).onConflictDoNothing();
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