import { db } from "./db.js";
import { orders } from "@shared/schema";

async function addDummyOrders() {
  console.log("🎂 Adding 25 dummy orders for pagination testing...");

  const sampleCakes = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const sampleUsers = [1, 2, 3, 4];
  const orderStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const paymentStatuses = ['pending', 'completed', 'failed', 'refunded'];

  const baseOrderNumber = Date.now();

  for (let i = 0; i < 25; i++) {
    const randomCakeId = sampleCakes[Math.floor(Math.random() * sampleCakes.length)];
    const randomUserId = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const randomStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const randomPaymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    
    // Random order date within last 30 days
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
    
    // Random delivery date 1-3 days after order
    const deliveryDate = new Date(randomDate);
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 1);

    const cakePrice = Math.floor(Math.random() * 1500) + 400; // Random cake price between 400-1900
    const deliveryFee = Math.floor(Math.random() * 100) + 50; // Random delivery fee 50-150
    const discount = Math.floor(Math.random() * 200); // Random discount 0-200
    const subtotal = cakePrice;
    const total = subtotal + deliveryFee - discount;

    const orderItems = [{
      cakeId: randomCakeId,
      name: `Test Cake ${i + 1}`,
      quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
      weight: ['0.5kg', '1kg', '1.5kg', '2kg'][Math.floor(Math.random() * 4)],
      flavor: ['Vanilla', 'Chocolate', 'Strawberry', 'Butterscotch'][Math.floor(Math.random() * 4)],
      customMessage: i % 3 === 0 ? `Happy Birthday Test ${i}!` : undefined,
      price: cakePrice,
      addons: Math.random() > 0.5 ? [{
        id: Math.floor(Math.random() * 5) + 1,
        name: 'Test Addon',
        price: Math.floor(Math.random() * 100) + 50,
        quantity: 1
      }] : undefined
    }];

    try {
      // Insert order
      const [newOrder] = await db.insert(orders).values({
        userId: randomUserId,
        orderNumber: `ORD-${baseOrderNumber + i}`,
        items: orderItems,
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        discount: discount.toString(),
        total: total.toString(),
        status: randomStatus,
        paymentStatus: randomPaymentStatus,
        paymentMethod: ['phonepe', 'upi', 'card', 'cod'][Math.floor(Math.random() * 4)],
        deliveryAddress: {
          name: `Test Customer ${i + 1}`,
          phone: `9${Math.floor(Math.random() * 900000000) + 100000000}`,
          address: `${Math.floor(Math.random() * 999) + 1} Test Street`,
          city: ['Mumbai', 'Delhi', 'Bangalore', 'Pune'][Math.floor(Math.random() * 4)],
          pincode: `${Math.floor(Math.random() * 90000) + 10000}`
        },
        deliveryDate: deliveryDate,
        deliveryTime: ['morning', 'afternoon', 'evening', 'midnight'][Math.floor(Math.random() * 4)],
        createdAt: randomDate,
        updatedAt: randomDate
      }).returning();

      console.log(`✅ Created order ${i + 1}/25: ${newOrder.orderNumber}`);
    } catch (error) {
      console.error(`❌ Error creating order ${i + 1}:`, error);
    }
  }

  console.log("🎉 Successfully added 25 dummy orders for pagination testing!");
}

addDummyOrders().catch(console.error);