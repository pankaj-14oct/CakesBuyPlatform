import { db } from "./db";
import { invoices, orders, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Order, Invoice, InsertInvoice } from "@shared/schema";

// Generate unique invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `INV-${timestamp}-${randomStr}`.toUpperCase();
}

// Convert order to invoice format
export function convertOrderToInvoice(order: Order, customerInfo?: { name?: string; email?: string; phone?: string }): Omit<InsertInvoice, 'invoiceNumber'> {
  // Parse order items and convert to invoice items
  const invoiceItems = order.items.map(item => {
    const baseItem = {
      name: item.name,
      description: `${item.weight} ${item.flavor} cake`,
      quantity: item.quantity,
      unitPrice: item.price / item.quantity,
      totalPrice: item.price,
      taxRate: 0,
      taxAmount: 0,
    };

    // Add addons to the description or as separate items
    if (item.addons && item.addons.length > 0) {
      const addonDesc = item.addons.map(addon => `${addon.name} (${addon.quantity}x)`).join(', ');
      baseItem.description += ` with ${addonDesc}`;
      
      // Add addon prices to the total
      const addonTotal = item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
      baseItem.totalPrice += addonTotal;
      baseItem.unitPrice = baseItem.totalPrice / baseItem.quantity;
    }

    return baseItem;
  });

  // Add delivery fee as separate item if applicable
  if (order.deliveryFee && parseFloat(order.deliveryFee) > 0) {
    invoiceItems.push({
      name: "Delivery Service",
      description: "Home delivery service",
      quantity: 1,
      unitPrice: parseFloat(order.deliveryFee),
      totalPrice: parseFloat(order.deliveryFee),
      taxRate: 0,
      taxAmount: 0,
    });
  }

  const subtotal = parseFloat(order.subtotal);
  const deliveryFee = parseFloat(order.deliveryFee || "0");
  const discount = parseFloat(order.discount || "0");
  const total = parseFloat(order.total);

  return {
    orderId: order.id,
    userId: order.userId,
    customerName: customerInfo?.name || order.deliveryAddress.name,
    customerEmail: customerInfo?.email || order.deliveryAddress.email || undefined,
    customerPhone: customerInfo?.phone || order.deliveryAddress.phone,
    billingAddress: {
      address: order.deliveryAddress.address,
      pincode: order.deliveryAddress.pincode,
      city: order.deliveryAddress.city,
      landmark: order.deliveryAddress.landmark,
    },
    items: invoiceItems,
    subtotal: subtotal.toString(),
    taxAmount: "0", // No tax for now, can be configured later
    discountAmount: discount.toString(),
    deliveryFee: deliveryFee.toString(),
    totalAmount: total.toString(),
    status: "sent",
    paymentStatus: order.paymentStatus as any,
    paymentMethod: order.paymentMethod,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    notes: order.specialInstructions || undefined,
    terms: "Payment is due within 7 days of invoice date. For cash on delivery orders, payment is due upon delivery.",
  };
}

// Create invoice for an order
export async function createInvoiceForOrder(orderId: number, customerInfo?: { name?: string; email?: string; phone?: string }): Promise<Invoice> {
  // Get the order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Check if invoice already exists for this order
  const existingInvoice = await db.query.invoices.findFirst({
    where: eq(invoices.orderId, orderId),
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // Convert order to invoice
  const invoiceData = convertOrderToInvoice(order, customerInfo);
  const invoiceNumber = generateInvoiceNumber();

  // Create the invoice
  const [invoice] = await db.insert(invoices).values({
    invoiceNumber: invoiceNumber,
    ...invoiceData,
  } as any).returning();

  return invoice;
}

// Update invoice status
export async function updateInvoiceStatus(
  invoiceId: number, 
  status: "draft" | "sent" | "paid" | "cancelled",
  paymentStatus?: "pending" | "paid" | "partially_paid" | "overdue"
): Promise<Invoice> {
  const updateData: any = { 
    status,
    updatedAt: new Date(),
  };

  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
    
    if (paymentStatus === "paid") {
      updateData.paidDate = new Date();
    }
  }

  const [updatedInvoice] = await db.update(invoices)
    .set(updateData)
    .where(eq(invoices.id, invoiceId))
    .returning();

  if (!updatedInvoice) {
    throw new Error("Invoice not found");
  }

  return updatedInvoice;
}

// Get invoice by order ID
export async function getInvoiceByOrderId(orderId: number): Promise<Invoice | null> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.orderId, orderId),
  });

  return invoice || null;
}

// Get invoice by invoice number
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.invoiceNumber, invoiceNumber),
  });

  return invoice || null;
}

// Get all invoices for a user
export async function getUserInvoices(userId: number): Promise<Invoice[]> {
  const userInvoices = await db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
  });

  return userInvoices;
}

// Get invoice details with order information
export async function getInvoiceWithOrder(invoiceId: number): Promise<(Invoice & { order?: Order }) | null> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });

  if (!invoice) {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, invoice.orderId),
  });

  return {
    ...invoice,
    order,
  };
}

// Generate basic invoice data for display
export function getInvoiceDisplayData(invoice: Invoice & { order?: Order }) {
  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount.toString()).toLocaleString('en-IN')}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  };

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formatDate(invoice.invoiceDate),
    dueDate: formatDate(invoice.dueDate),
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail || 'N/A',
    customerPhone: invoice.customerPhone,
    billingAddress: invoice.billingAddress,
    items: invoice.items,
    subtotal: formatCurrency(invoice.subtotal || 0),
    discountAmount: formatCurrency(invoice.discountAmount || 0),
    deliveryFee: formatCurrency(invoice.deliveryFee || 0),
    taxAmount: formatCurrency(invoice.taxAmount || 0),
    totalAmount: formatCurrency(invoice.totalAmount || 0),
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
    paymentMethod: invoice.paymentMethod,
    notes: invoice.notes,
    terms: invoice.terms,
    order: invoice.order
  };
}