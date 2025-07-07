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
    {
      name: "Strawberry Delight", slug: "strawberry-delight", description: "Fresh strawberry cake with whipped cream", categoryId: 1,
      basePrice: "999", images: ["/api/placeholder/400/300"], flavors: ["Strawberry"],
      weights: [{ weight: "0.5kg", price: 999 }, { weight: "1kg", price: 1699 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Black Forest Special", slug: "black-forest-special", description: "Traditional Black Forest cake with cherries", categoryId: 3,
      basePrice: "1299", images: ["/api/placeholder/400/300"], flavors: ["Chocolate", "Black Forest"],
      weights: [{ weight: "1kg", price: 1299 }, { weight: "1.5kg", price: 1899 }, { weight: "2kg", price: 2499 }],
      isEggless: false, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: true, scheduled: true }
    },
    {
      name: "Butterscotch Bliss", slug: "butterscotch-bliss", description: "Creamy butterscotch cake with crunchy bits", categoryId: 1,
      basePrice: "849", images: ["/api/placeholder/400/300"], flavors: ["Butterscotch"],
      weights: [{ weight: "0.5kg", price: 849 }, { weight: "1kg", price: 1499 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Pineapple Paradise", slug: "pineapple-paradise", description: "Tropical pineapple cake with coconut flakes", categoryId: 1,
      basePrice: "899", images: ["/api/placeholder/400/300"], flavors: ["Pineapple"],
      weights: [{ weight: "0.5kg", price: 899 }, { weight: "1kg", price: 1599 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Mango Magic", slug: "mango-magic", description: "Fresh mango cake with mango cream layers", categoryId: 1,
      basePrice: "949", images: ["/api/placeholder/400/300"], flavors: ["Mango"],
      weights: [{ weight: "0.5kg", price: 949 }, { weight: "1kg", price: 1649 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Coffee Heaven", slug: "coffee-heaven", description: "Rich coffee flavored cake with mocha cream", categoryId: 1,
      basePrice: "999", images: ["/api/placeholder/400/300"], flavors: ["Coffee", "Mocha"],
      weights: [{ weight: "0.5kg", price: 999 }, { weight: "1kg", price: 1699 }],
      isEggless: false, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Lemon Zest Cake", slug: "lemon-zest-cake", description: "Tangy lemon cake with lemon cream frosting", categoryId: 1,
      basePrice: "799", images: ["/api/placeholder/400/300"], flavors: ["Lemon"],
      weights: [{ weight: "0.5kg", price: 799 }, { weight: "1kg", price: 1399 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Unicorn Theme Cake", slug: "unicorn-theme-cake", description: "Magical unicorn themed cake for kids", categoryId: 4,
      basePrice: "1499", images: ["/api/placeholder/400/300"], flavors: ["Vanilla", "Strawberry"],
      weights: [{ weight: "1kg", price: 1499 }, { weight: "1.5kg", price: 2199 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Photo Print Cake", slug: "photo-print-cake", description: "Personalized cake with edible photo print", categoryId: 6,
      basePrice: "1199", images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj4KICA8IS0tIENha2UgQmFzZSAtLT4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE5MCIgZmlsbD0iI2Y0ZTRjMSIgc3Ryb2tlPSIjZDRjNGExIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8IS0tIENha2UgTGF5ZXJzIC0tPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTgwIiBmaWxsPSIjZjhmMGQ4IiBzdHJva2U9IiNlOGQ4YzgiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTcwIiBmaWxsPSIjZmRmNmUzIiBzdHJva2U9IiNlZGUzZDMiIHN0cm9rZS13aWR0aD0iMSIvPgogIDwhLS0gRGVjb3JhdGl2ZSBCb3JkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxNzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YjhhMSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtZGFzaGFycmF5PSI4LDQiLz4KICA8IS0tIFBob3RvIEFyZWEgUGxhY2Vob2xkZXIgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTYwIiByPSI3MCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cmVjdCB4PSIxNjAiIHk9IjEyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2Y4ZjhmOCIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8IS0tIFBob3RvIHBsYWNlaG9sZGVyIGljb24gLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDE2MCkiPgogICAgPGNpcmNsZSByPSIyMCIgZmlsbD0iI2U4ZThlOCIvPgogICAgPHBhdGggZD0iTSAtMTIsLTggTCAxMiwtOCBMIDgsLTQgTCAtOCwtNCBaIiBmaWxsPSIjYzBjMGMwIi8+CiAgICA8Y2lyY2xlIHI9IjYiIGZpbGw9IiNhMGEwYTAiLz4KICAgIDxjaXJjbGUgcj0iMyIgZmlsbD0iI2ZmZmZmZiIvPgogIDwvZz4KICA8IS0tIFRleHQgcGxhY2Vob2xkZXIgYXJlYSAtLT4KICA8cmVjdCB4PSIxNDAiIHk9IjI1MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIyNSIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjY3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPllvdXIgTWVzc2FnZTwvdGV4dD4KICA8IS0tIERlY29yYXRpdmUgZWxlbWVudHMgLS0+CiAgPGcgc3Ryb2tlPSIjZDRiOGExIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiPgogICAgPCEtLSBUb3AgZGVjb3JhdGl2ZSBzd2lybHMgLS0+CiAgICA8cGF0aCBkPSJNIDgwLDEwMCBRIDkwLDkwIDEwMCwxMDAgUSAxMTAsMTEwIDEyMCwxMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDEwMCBRIDI5MCw5MCAzMDAsMTAwIFEgMzEwLDExMCAzMjAsMTAwIi8+CiAgICA8IS0tIEJvdHRvbSBkZWNvcmF0aXZlIHN3aXJscyAtLT4KICAgIDxwYXRoIGQ9Ik0gODAsMzAwIFEgOTAsMzEwIDEwMCwzMDAgUSAxMTAsMjkwIDEyMCwzMDAiLz4KICAgIDxwYXRoIGQ9Ik0gMjgwLDMwMCBRIDI5MCwzMTAgMzAwLDMwMCBRIDMxMCwyOTAgMzIwLDMwMCIvPgogIDwvZz4KICA8IS0tIFNtYWxsIGRlY29yYXRpdmUgZG90cyAtLT4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIxNDAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIxMjAiIGN5PSIyNjAiIHI9IjMiIGZpbGw9IiNkNGI4YTEiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIyNjAiIHI9IjMiIGZpbGg9IiNkNGI4YTEiLz4KICA8IS0tIENyZWFtIGJvcmRlciBkZXRhaWwgLS0+CiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIxODUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZThkOCIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg=='], flavors: ["Vanilla", "Chocolate"],
      weights: [{ weight: "1kg", price: 1199 }, { weight: "1.5kg", price: 1799 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Designer Rose Cake", slug: "designer-rose-cake", description: "Elegant cake decorated with sugar roses", categoryId: 7,
      basePrice: "1899", images: ["/api/placeholder/400/300"], flavors: ["Rose", "Vanilla"],
      weights: [{ weight: "1kg", price: 1899 }, { weight: "1.5kg", price: 2699 }, { weight: "2kg", price: 3499 }],
      isEggless: false, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Cartoon Character Cake", slug: "cartoon-character-cake", description: "Fun cartoon character themed cake", categoryId: 8,
      basePrice: "1399", images: ["/api/placeholder/400/300"], flavors: ["Chocolate", "Vanilla"],
      weights: [{ weight: "1kg", price: 1399 }, { weight: "1.5kg", price: 1999 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Corporate Logo Cake", slug: "corporate-logo-cake", description: "Professional cake with company logo", categoryId: 9,
      basePrice: "1699", images: ["/api/placeholder/400/300"], flavors: ["Vanilla", "Chocolate"],
      weights: [{ weight: "1kg", price: 1699 }, { weight: "2kg", price: 2999 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Diwali Special Cake", slug: "diwali-special-cake", description: "Festival themed cake with decorative elements", categoryId: 10,
      basePrice: "1199", images: ["/api/placeholder/400/300"], flavors: ["Kesar", "Vanilla"],
      weights: [{ weight: "1kg", price: 1199 }, { weight: "1.5kg", price: 1799 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Heart Shape Romance", slug: "heart-shape-romance", description: "Romantic heart shaped cake for special occasions", categoryId: 3,
      basePrice: "1399", images: ["/api/placeholder/400/300"], flavors: ["Red Velvet", "Strawberry"],
      weights: [{ weight: "1kg", price: 1399 }, { weight: "1.5kg", price: 1999 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: true, scheduled: true }
    },
    {
      name: "Fondant Fantasy", slug: "fondant-fantasy", description: "Premium cake covered in smooth fondant", categoryId: 7,
      basePrice: "2199", images: ["/api/placeholder/400/300"], flavors: ["Chocolate", "Vanilla"],
      weights: [{ weight: "1kg", price: 2199 }, { weight: "1.5kg", price: 3199 }],
      isEggless: false, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Oreo Crunch Cake", slug: "oreo-crunch-cake", description: "Chocolate cake loaded with Oreo cookies", categoryId: 1,
      basePrice: "1099", images: ["/api/placeholder/400/300"], flavors: ["Chocolate", "Oreo"],
      weights: [{ weight: "0.5kg", price: 1099 }, { weight: "1kg", price: 1899 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Ferrero Rocher Cake", slug: "ferrero-rocher-cake", description: "Luxurious cake with Ferrero Rocher chocolates", categoryId: 1,
      basePrice: "1599", images: ["/api/placeholder/400/300"], flavors: ["Chocolate", "Hazelnut"],
      weights: [{ weight: "1kg", price: 1599 }, { weight: "1.5kg", price: 2399 }],
      isEggless: false, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: true, scheduled: true }
    },
    {
      name: "KitKat Overload", slug: "kitkat-overload", description: "Chocolate cake decorated with KitKat bars", categoryId: 1,
      basePrice: "1299", images: ["/api/placeholder/400/300"], flavors: ["Chocolate"],
      weights: [{ weight: "1kg", price: 1299 }, { weight: "1.5kg", price: 1899 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: true }
    },
    {
      name: "Fresh Fruit Cake", slug: "fresh-fruit-cake", description: "Light sponge cake topped with fresh seasonal fruits", categoryId: 1,
      basePrice: "1199", images: ["/api/placeholder/400/300"], flavors: ["Vanilla", "Pineapple"],
      weights: [{ weight: "1kg", price: 1199 }, { weight: "1.5kg", price: 1799 }],
      isEggless: true, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: true, midnight: false, scheduled: false }
    },
    {
      name: "Designer Fondant Wedding", slug: "designer-fondant-wedding", description: "Multi-tier wedding cake with elegant fondant work", categoryId: 2,
      basePrice: "4999", images: ["/api/placeholder/400/300"], flavors: ["Vanilla", "Red Velvet", "Chocolate"],
      weights: [{ weight: "3kg", price: 4999 }, { weight: "5kg", price: 7999 }],
      isEggless: false, isBestseller: false, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    },
    {
      name: "Choco Truffle Supreme", slug: "choco-truffle-supreme", description: "Rich chocolate truffle cake with premium cocoa", categoryId: 1,
      basePrice: "1399", images: ["/api/placeholder/400/300"], flavors: ["Dark Chocolate", "Truffle"],
      weights: [{ weight: "1kg", price: 1399 }, { weight: "1.5kg", price: 1999 }],
      isEggless: false, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: true, scheduled: true }
    },
    {
      name: "Rainbow Layer Cake", slug: "rainbow-layer-cake", description: "Colorful multi-layered cake that's perfect for celebrations", categoryId: 8,
      basePrice: "1599", images: ["/api/placeholder/400/300"], flavors: ["Vanilla", "Strawberry"],
      weights: [{ weight: "1kg", price: 1599 }, { weight: "1.5kg", price: 2299 }],
      isEggless: true, isBestseller: true, isAvailable: true,
      deliveryOptions: { sameDay: false, midnight: false, scheduled: true }
    }
  ],

  users: [
    { email: "admin@cakesbuy.com", phone: "1111111111", addresses: [], role: "admin" },
    { email: "john@example.com", phone: "9876543210", addresses: [], role: "customer" },
    { email: "jane@example.com", phone: "9876543211", addresses: [], role: "customer" },
    { email: "mike@example.com", phone: "9876543212", addresses: [], role: "customer" },
    { email: "sarah@example.com", phone: "9876543213", addresses: [], role: "customer" },
    { email: "david@example.com", phone: "9876543214", addresses: [], role: "customer" },
    { email: "lisa@example.com", phone: "9876543215", addresses: [], role: "customer" },
    { email: "tom@example.com", phone: "9876543216", addresses: [], role: "customer" },
    { email: "emma@example.com", phone: "9876543217", addresses: [], role: "customer" },
    { email: "alex@example.com", phone: "9876543218", addresses: [], role: "customer" },
    { email: "olivia@example.com", phone: "9876543219", addresses: [], role: "customer" },
    { email: "ravi@example.com", phone: "9876543220", addresses: [], role: "customer" },
    { email: "priya@example.com", phone: "9876543221", addresses: [], role: "customer" },
  ],

  orders: [
    {
      orderNumber: generateOrderNumber(),
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
      orderNumber: generateOrderNumber(),
      userId: 2,
      items: [
        { cakeId: 3, name: "Red Velvet Romance", quantity: 1, weight: "1.5kg", flavor: "Red Velvet", price: 1799, addons: [] },
        { cakeId: 2, name: "Vanilla Dream Cake", quantity: 1, weight: "0.5kg", flavor: "Vanilla", price: 799, addons: [] }
      ],
      subtotal: "2598",
      deliveryFee: "50",
      discount: "0",
      total: "2648",
      status: "processing",
      paymentMethod: "cod",
      paymentStatus: "pending",
      deliveryAddress: {
        name: "Jane Smith",
        phone: "9876543211",
        address: "456 Sector 14, Gurgaon",
        pincode: "122001",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2024-12-28'),
      specialInstructions: "Call before delivery"
    },
    {
      orderNumber: generateOrderNumber(),
      userId: 3,
      items: [{ cakeId: 5, name: "Black Forest Special", quantity: 1, weight: "1kg", flavor: "Black Forest", price: 1299, addons: [] }],
      subtotal: "1299",
      deliveryFee: "0",
      discount: "0",
      total: "1299",
      status: "confirmed",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "Mike Johnson",
        phone: "9876543212",
        address: "789 DLF Phase 1, Gurgaon",
        pincode: "122002",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2024-12-30'),
      specialInstructions: ""
    },
    {
      orderNumber: generateOrderNumber(),
      userId: 4,
      items: [{ cakeId: 17, name: "Heart Shape Romance", quantity: 1, weight: "1.5kg", flavor: "Red Velvet", price: 1999, addons: [] }],
      subtotal: "1999",
      deliveryFee: "0",
      discount: "0",
      total: "1999",
      status: "out_for_delivery",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "Sarah Wilson",
        phone: "9876543213",
        address: "321 Cyber City, Gurgaon",
        pincode: "122002",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2024-12-27'),
      specialInstructions: "Handle with care"
    },
    {
      orderNumber: generateOrderNumber(),
      userId: 5,
      items: [{ cakeId: 13, name: "Designer Rose Cake", quantity: 1, weight: "2kg", flavor: "Rose", price: 3499, addons: [] }],
      subtotal: "3499",
      deliveryFee: "100",
      discount: "0",
      total: "3599",
      status: "pending",
      paymentMethod: "cod",
      paymentStatus: "pending",
      deliveryAddress: {
        name: "David Brown",
        phone: "9876543214",
        address: "654 Golf Course Road, Gurgaon",
        pincode: "122001",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2024-12-31'),
      specialInstructions: "New Year special delivery"
    },
    {
      orderNumber: generateOrderNumber(),
      userId: 6,
      items: [{ cakeId: 2, name: "Vanilla Dream Cake", quantity: 1, weight: "1kg", flavor: "Vanilla", price: 1299, addons: [] }],
      subtotal: "1299",
      deliveryFee: "50",
      discount: "0",
      total: "1349",
      status: "confirmed",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "Ravi Kumar",
        phone: "9876543220",
        address: "123 Sector 15, Gurgaon",
        pincode: "122001",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2025-01-07'),
      deliveryTimeSlot: "slot2",
      specialInstructions: "Call before delivery"
    },
    {
      orderNumber: generateOrderNumber(),
      userId: 7,
      items: [
        { cakeId: 5, name: "Black Forest Special", quantity: 1, weight: "1.5kg", flavor: "Chocolate", price: 1899, addons: [] }
      ],
      subtotal: "1899",
      deliveryFee: "0",
      discount: "0",
      total: "1899",
      status: "preparing",
      paymentMethod: "online",
      paymentStatus: "paid",
      deliveryAddress: {
        name: "Priya Sharma",
        phone: "9876543221",
        address: "456 Golf Course Road, Gurgaon",
        pincode: "122003",
        city: "Gurgaon"
      },
      deliveryDate: new Date('2025-01-07'),
      deliveryTimeSlot: "slot3",
      specialInstructions: "Ring doorbell, building has security"
    }
  ]
};

export async function importDummyData() {
  console.log("🌱 Starting dummy data import...");
  
  try {
    // Clear existing data first
    await db.delete(orders);
    await db.delete(cakes);
    await db.delete(categories);
    await db.delete(users);
    
    console.log("📂 Importing categories...");
    const insertedCategories = await db.insert(categories).values(dummyData.categories).returning();
    
    console.log("🍰 Importing cakes...");
    const cakesWithIds = dummyData.cakes.map((cake, index) => ({
      ...cake,
      categoryId: insertedCategories[cake.categoryId - 1]?.id || insertedCategories[0].id
    }));
    const insertedCakes = await db.insert(cakes).values(cakesWithIds).returning();
    
    console.log("👥 Importing users...");
    const usersWithPassword = await Promise.all(
      dummyData.users.map(async (user) => ({
        ...user,
        password: await hashPassword("password123")
      }))
    );
    const insertedUsers = await db.insert(users).values(usersWithPassword).returning();
    
    console.log("📦 Importing orders...");
    const ordersWithIds = dummyData.orders.map((order, index) => ({
      ...order,
      userId: insertedUsers[order.userId - 1]?.id || insertedUsers[0].id,
      items: order.items.map(item => ({
        ...item,
        cakeId: insertedCakes[item.cakeId - 1]?.id || insertedCakes[0].id
      }))
    }));
    await db.insert(orders).values(ordersWithIds);
    
    console.log("✅ Dummy data import completed successfully!");
    
    return {
      categories: insertedCategories.length,
      cakes: insertedCakes.length,
      users: insertedUsers.length,
      orders: ordersWithIds.length
    };
  } catch (error) {
    console.error("❌ Dummy data import failed:", error);
    throw error;
  }
}

export async function clearAllData() {
  console.log("🗑️ Starting data clearance...");
  
  try {
    await db.delete(orders);
    await db.delete(cakes);
    await db.delete(categories);
    await db.delete(users);
    
    console.log("✅ All data cleared successfully!");
    return { success: true, message: "All data cleared successfully" };
  } catch (error) {
    console.error("❌ Data clearance failed:", error);
    throw error;
  }
}