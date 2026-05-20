import { sqliteTable, text, integer, numeric } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "manager", "cashier", "kitchen"] }).default("cashier"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const restaurants = sqliteTable("restaurants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  basePrice: text("base_price").notNull(), // stored as string to avoid precision loss
  currentPrice: text("current_price").notNull(),
  minPrice: text("min_price"),
  maxPrice: text("max_price"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  dynamicPricingEnabled: integer("dynamic_pricing_enabled", { mode: "boolean" }).default(false),
  priceSensitivity: text("price_sensitivity").default("1"),
  ordersCount: integer("orders_count").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const liveDemand = sqliteTable("live_demand", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id).notNull(),
  heatScore: text("heat_score").default("0"),
  velocity: text("velocity").default("0"),
  hourlyOrders: integer("hourly_orders").default(0),
  dailyOrders: integer("daily_orders").default(0),
  weeklyOrders: integer("weekly_orders").default(0),
  lastOrderAt: text("last_order_at"),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  employeeId: integer("employee_id").references(() => users.id),
  orderNumber: text("order_number").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "preparing", "ready", "served", "cancelled"] }).default("pending"),
  isCancelled: integer("is_cancelled", { mode: "boolean" }).default(false),
  cancelledAt: text("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  source: text("source").default("pos"),
  subtotal: text("subtotal").notNull(),
  tax: text("tax").notNull(),
  discount: text("discount").default("0"),
  total: text("total").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  tableNumber: text("table_number"),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: text("unit_price").notNull(),
  totalPrice: text("total_price").notNull(),
  notes: text("notes"),
});

export const pricingHistory = sqliteTable("pricing_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  oldPrice: text("old_price").notNull(),
  newPrice: text("new_price").notNull(),
  changePercent: text("change_percent").notNull(),
  trigger: text("trigger"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
