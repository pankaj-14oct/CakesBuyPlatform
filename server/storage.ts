import { 
  users, categories, cakes, addons, orders, deliveryAreas, promoCodes, reviews,
  type User, type InsertUser, type Category, type InsertCategory, 
  type Cake, type InsertCake, type Addon, type InsertAddon,
  type Order, type InsertOrder, type DeliveryArea, type InsertDeliveryArea,
  type PromoCode, type InsertPromoCode, type Review, type InsertReview
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  // Cakes
  getCakes(filters?: { categoryId?: number; isEggless?: boolean; isBestseller?: boolean }): Promise<Cake[]>;
  getCake(id: number): Promise<Cake | undefined>;
  getCakeBySlug(slug: string): Promise<Cake | undefined>;
  searchCakes(query: string): Promise<Cake[]>;

  // Addons
  getAddons(): Promise<Addon[]>;
  getAddonsByCategory(category: string): Promise<Addon[]>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<void>;

  // Delivery Areas
  getDeliveryAreas(): Promise<DeliveryArea[]>;
  checkDeliveryArea(pincode: string): Promise<DeliveryArea | undefined>;

  // Promo Codes
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  validatePromoCode(code: string, orderValue: number): Promise<{ valid: boolean; discount?: number; message?: string }>;

  // Reviews
  getCakeReviews(cakeId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private categories: Map<number, Category> = new Map();
  private cakes: Map<number, Cake> = new Map();
  private addons: Map<number, Addon> = new Map();
  private orders: Map<number, Order> = new Map();
  private deliveryAreas: Map<number, DeliveryArea> = new Map();
  private promoCodes: Map<number, PromoCode> = new Map();
  private reviews: Map<number, Review> = new Map();
  
  private currentUserId = 1;
  private currentCategoryId = 1;
  private currentCakeId = 1;
  private currentAddonId = 1;
  private currentOrderId = 1;
  private currentDeliveryAreaId = 1;
  private currentPromoCodeId = 1;
  private currentReviewId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoryData = [
      { name: "Birthday Cakes", slug: "birthday", description: "Perfect for birthday celebrations", icon: "fas fa-birthday-cake", isActive: true },
      { name: "Anniversary Cakes", slug: "anniversary", description: "Romantic cakes for special moments", icon: "fas fa-heart", isActive: true },
      { name: "Kids Special", slug: "kids", description: "Fun themed cakes for children", icon: "fas fa-child", isActive: true },
      { name: "Eggless Cakes", slug: "eggless", description: "Delicious eggless varieties", icon: "fas fa-leaf", isActive: true },
      { name: "Custom Design", slug: "custom", description: "Your vision, our creation", icon: "fas fa-palette", isActive: true },
      { name: "Wedding Cakes", slug: "wedding", description: "Grand cakes for special occasions", icon: "fas fa-ring", isActive: true },
    ];

    categoryData.forEach(cat => {
      const category: Category = { id: this.currentCategoryId++, ...cat };
      this.categories.set(category.id, category);
    });

    // Seed cakes
    const cakeData = [
      {
        name: "Chocolate Fantasy Cake",
        slug: "chocolate-fantasy-cake",
        description: "Rich chocolate cake with rainbow sprinkles and premium chocolate frosting",
        categoryId: 1,
        basePrice: "599.00",
        images: ["https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400"],
        flavors: ["Chocolate", "Dark Chocolate", "Milk Chocolate"],
        weights: [
          { weight: "500g", price: 599 },
          { weight: "1kg", price: 999 },
          { weight: "1.5kg", price: 1399 }
        ],
        isEggless: false,
        isCustomizable: true,
        isAvailable: true,
        isBestseller: true,
        tags: ["chocolate", "birthday", "bestseller"],
        rating: "4.8",
        reviewCount: 248,
        deliveryOptions: { sameDay: true, midnight: true, scheduled: true }
      },
      {
        name: "Strawberry Delight",
        slug: "strawberry-delight",
        description: "Fresh strawberries with vanilla cream layers, perfect for celebrations",
        categoryId: 4,
        basePrice: "749.00",
        images: ["https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400"],
        flavors: ["Vanilla", "Strawberry", "Mixed Berry"],
        weights: [
          { weight: "1kg", price: 749 },
          { weight: "1.5kg", price: 1099 },
          { weight: "2kg", price: 1449 }
        ],
        isEggless: true,
        isCustomizable: true,
        isAvailable: true,
        isBestseller: false,
        tags: ["strawberry", "eggless", "fresh"],
        rating: "4.6",
        reviewCount: 156,
        deliveryOptions: { sameDay: true, midnight: true, scheduled: true }
      },
      {
        name: "Red Velvet Romance",
        slug: "red-velvet-romance",
        description: "Classic red velvet with cream cheese frosting and custom decorations",
        categoryId: 2,
        basePrice: "899.00",
        images: ["https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400"],
        flavors: ["Red Velvet", "Classic Red Velvet"],
        weights: [
          { weight: "1kg", price: 899 },
          { weight: "1.5kg", price: 1299 },
          { weight: "2kg", price: 1699 }
        ],
        isEggless: false,
        isCustomizable: true,
        isAvailable: true,
        isBestseller: true,
        tags: ["red velvet", "anniversary", "custom"],
        rating: "4.9",
        reviewCount: 203,
        deliveryOptions: { sameDay: true, midnight: true, scheduled: true }
      },
      {
        name: "Unicorn Magic Cake",
        slug: "unicorn-magic-cake",
        description: "Colorful vanilla cake with rainbow layers and magical unicorn decorations",
        categoryId: 3,
        basePrice: "1199.00",
        images: ["https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400"],
        flavors: ["Vanilla", "Rainbow", "Funfetti"],
        weights: [
          { weight: "1.5kg", price: 1199 },
          { weight: "2kg", price: 1599 },
          { weight: "2.5kg", price: 1999 }
        ],
        isEggless: false,
        isCustomizable: true,
        isAvailable: true,
        isBestseller: true,
        tags: ["unicorn", "kids", "colorful", "theme"],
        rating: "4.9",
        reviewCount: 189,
        deliveryOptions: { sameDay: true, midnight: true, scheduled: true }
      }
    ];

    cakeData.forEach(cake => {
      const cakeEntity: Cake = { id: this.currentCakeId++, ...cake };
      this.cakes.set(cakeEntity.id, cakeEntity);
    });

    // Seed addons
    const addonData = [
      { name: "Birthday Candles", description: "Pack of colorful birthday candles", price: "50.00", category: "candles", isAvailable: true },
      { name: "Happy Birthday Balloons", description: "Set of 5 birthday balloons", price: "150.00", category: "balloons", isAvailable: true },
      { name: "Greeting Card", description: "Personalized greeting card", price: "100.00", category: "cards", isAvailable: true },
      { name: "Fresh Flowers", description: "Beautiful flower arrangement", price: "300.00", category: "flowers", isAvailable: true },
    ];

    addonData.forEach(addon => {
      const addonEntity: Addon = { id: this.currentAddonId++, ...addon };
      this.addons.set(addonEntity.id, addonEntity);
    });

    // Seed delivery areas (Gurgaon sectors)
    const deliveryAreaData = [
      { name: "Sector 14", pincode: "122001", deliveryFee: "0.00", freeDeliveryThreshold: "500.00", sameDayAvailable: true, midnightAvailable: true, isActive: true },
      { name: "Sector 56", pincode: "122011", deliveryFee: "0.00", freeDeliveryThreshold: "500.00", sameDayAvailable: true, midnightAvailable: true, isActive: true },
      { name: "DLF Phase 1", pincode: "122002", deliveryFee: "0.00", freeDeliveryThreshold: "500.00", sameDayAvailable: true, midnightAvailable: true, isActive: true },
      { name: "DLF Phase 2", pincode: "122008", deliveryFee: "0.00", freeDeliveryThreshold: "500.00", sameDayAvailable: true, midnightAvailable: true, isActive: true },
      { name: "Cyber City", pincode: "122002", deliveryFee: "0.00", freeDeliveryThreshold: "500.00", sameDayAvailable: true, midnightAvailable: true, isActive: true },
      { name: "Golf Course Road", pincode: "122007", deliveryFee: "0.00", freeDeliveryThreshold: "500.00", sameDayAvailable: true, midnightAvailable: true, isActive: true },
    ];

    deliveryAreaData.forEach(area => {
      const areaEntity: DeliveryArea = { id: this.currentDeliveryAreaId++, ...area };
      this.deliveryAreas.set(areaEntity.id, areaEntity);
    });

    // Seed promo codes
    const promoCodeData = [
      { code: "FIRST20", description: "20% off on first order", discountType: "percentage", discountValue: "20.00", minOrderValue: "500.00", maxDiscount: "200.00", usageLimit: 100, usedCount: 0, isActive: true, validFrom: new Date(), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { code: "WELCOME10", description: "10% off for new customers", discountType: "percentage", discountValue: "10.00", minOrderValue: "300.00", maxDiscount: "100.00", usageLimit: 200, usedCount: 0, isActive: true, validFrom: new Date(), validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
    ];

    promoCodeData.forEach(promo => {
      const promoEntity: PromoCode = { id: this.currentPromoCodeId++, ...promo };
      this.promoCodes.set(promoEntity.id, promoEntity);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { id: this.currentUserId++, ...insertUser };
    this.users.set(user.id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.isActive);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  // Cake methods
  async getCakes(filters?: { categoryId?: number; isEggless?: boolean; isBestseller?: boolean }): Promise<Cake[]> {
    let cakes = Array.from(this.cakes.values()).filter(cake => cake.isAvailable);
    
    if (filters?.categoryId) {
      cakes = cakes.filter(cake => cake.categoryId === filters.categoryId);
    }
    if (filters?.isEggless !== undefined) {
      cakes = cakes.filter(cake => cake.isEggless === filters.isEggless);
    }
    if (filters?.isBestseller !== undefined) {
      cakes = cakes.filter(cake => cake.isBestseller === filters.isBestseller);
    }
    
    return cakes;
  }

  async getCake(id: number): Promise<Cake | undefined> {
    return this.cakes.get(id);
  }

  async getCakeBySlug(slug: string): Promise<Cake | undefined> {
    return Array.from(this.cakes.values()).find(cake => cake.slug === slug);
  }

  async searchCakes(query: string): Promise<Cake[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.cakes.values()).filter(cake => 
      cake.isAvailable && (
        cake.name.toLowerCase().includes(searchTerm) ||
        cake.description?.toLowerCase().includes(searchTerm) ||
        cake.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );
  }

  // Addon methods
  async getAddons(): Promise<Addon[]> {
    return Array.from(this.addons.values()).filter(addon => addon.isAvailable);
  }

  async getAddonsByCategory(category: string): Promise<Addon[]> {
    return Array.from(this.addons.values()).filter(addon => 
      addon.isAvailable && addon.category === category
    );
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `CBG${Date.now()}${this.currentOrderId}`;
    const order: Order = { 
      id: this.currentOrderId++, 
      orderNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertOrder 
    };
    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.orderNumber === orderNumber);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      this.orders.set(id, order);
    }
  }

  // Delivery area methods
  async getDeliveryAreas(): Promise<DeliveryArea[]> {
    return Array.from(this.deliveryAreas.values()).filter(area => area.isActive);
  }

  async checkDeliveryArea(pincode: string): Promise<DeliveryArea | undefined> {
    return Array.from(this.deliveryAreas.values()).find(area => 
      area.isActive && area.pincode === pincode
    );
  }

  // Promo code methods
  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    return Array.from(this.promoCodes.values()).find(promo => 
      promo.code.toUpperCase() === code.toUpperCase() && promo.isActive
    );
  }

  async validatePromoCode(code: string, orderValue: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    const promo = await this.getPromoCode(code);
    
    if (!promo) {
      return { valid: false, message: "Invalid promo code" };
    }

    if (promo.validUntil && new Date() > promo.validUntil) {
      return { valid: false, message: "Promo code has expired" };
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return { valid: false, message: "Promo code usage limit exceeded" };
    }

    if (orderValue < parseFloat(promo.minOrderValue)) {
      return { valid: false, message: `Minimum order value should be ₹${promo.minOrderValue}` };
    }

    let discount = 0;
    if (promo.discountType === "percentage") {
      discount = (orderValue * parseFloat(promo.discountValue)) / 100;
      if (promo.maxDiscount && discount > parseFloat(promo.maxDiscount)) {
        discount = parseFloat(promo.maxDiscount);
      }
    } else {
      discount = parseFloat(promo.discountValue);
    }

    return { valid: true, discount, message: `Discount of ₹${discount} applied` };
  }

  // Review methods
  async getCakeReviews(cakeId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.cakeId === cakeId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = { 
      id: this.currentReviewId++, 
      createdAt: new Date(),
      ...insertReview 
    };
    this.reviews.set(review.id, review);
    return review;
  }
}

export const storage = new MemStorage();
