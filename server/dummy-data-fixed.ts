import { db } from "./db";
import { users, categories, cakes, orders } from "@shared/schema";
import { hashPassword } from "./auth";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
}

export const dummyData = {
  categories: [
    { name: "Birthday Cakes", slug: "birthday-cakes", description: "Celebrate special birthdays with our delicious cakes", icon: "🎂", isActive: true },
    { name: "Wedding Cakes", slug: "wedding-cakes", description: "Elegant wedding cakes for your perfect day", icon: "💒", isActive: true },
    { name: "Anniversary Cakes", slug: "anniversary-cakes", description: "Beautiful cakes for celebrating milestones", icon: "💕", isActive: true },
    { name: "Theme Cakes", slug: "theme-cakes", description: "Custom themed cakes for any occasion", icon: "🎨", isActive: true },
    { name: "Eggless Cakes", slug: "eggless-cakes", description: "Delicious eggless options for everyone", icon: "🥚", isActive: true },
    { name: "Photo Cakes", slug: "photo-cakes", description: "Personalized cakes with edible photos", icon: "📸", isActive: true },
    { name: "Designer Cakes", slug: "designer-cakes", description: "Premium designer cakes by expert bakers", icon: "✨", isActive: true },
    { name: "Kids Cakes", slug: "kids-cakes", description: "Fun and colorful cakes for children", icon: "🧒", isActive: true },
    { name: "Corporate Cakes", slug: "corporate-cakes", description: "Professional cakes for corporate events", icon: "🏢", isActive: true },
    { name: "Festival Cakes", slug: "festival-cakes", description: "Special cakes for festivals and celebrations", icon: "🎊", isActive: true },
  ],

  cakes: [
    {
      name: "Chocolate Fantasy Cake", slug: "chocolate-fantasy-cake", description: "Rich chocolate layers with ganache and berries", categoryId: 1,
      basePrice: "899", images: ["/api/placeholder/400/300"], flavors: ["Chocolate", "Dark Chocolate"], 
      weights: [{ weight: "0.5kg", price: 899 }, { weight: "1kg", price: 1599 }, { weight: "1.5kg", price: 2299 }],
      isEggless: false, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Vanilla Dream Cake", slug: "vanilla-dream-cake", description: "Classic vanilla sponge with fresh cream", categoryId: 1,
      basePrice: "799", images: ["/api/placeholder/400/300"], flavors: ["Vanilla", "French Vanilla"],
      weights: [{ weight: "0.5kg", price: 799 }, { weight: "1kg", price: 1399 }, { weight: "1.5kg", price: 1999 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Red Velvet Romance", slug: "red-velvet-romance", description: "Classic red velvet with cream cheese frosting", categoryId: 2,
      basePrice: "1199", images: ["/api/placeholder/400/300"], flavors: ["Red Velvet"],
      weights: [{ weight: "1kg", price: 1199 }, { weight: "1.5kg", price: 1799 }, { weight: "2kg", price: 2399 }],
      isEggless: false, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: true, scheduled: true }
    },
  ],

  users: [
    {
      name: "Admin User",
      email: "online.cakesbuy@gmail.com",
      phone: "1111111111",
      passwordHash: "",
      role: "admin",
      isActive: true,
      emailVerified: true
    },
    {
      name: "John Doe",
      email: "john@example.com", 
      phone: "9876543210",
      passwordHash: "",
      role: "customer",
      isActive: true,
      emailVerified: true
    }
  ]
};