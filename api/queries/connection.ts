import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../db/schema";
import fs from "fs";
import path from "path";

// Ensure the db directory exists
const dbDir = path.resolve(process.cwd(), "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(path.join(dbDir, "sqlite.db"));
const db = drizzle(sqlite, { schema });

// Simple seeder to ensure at least one restaurant and some products exist for testing
const seed = () => {
  console.log("Setting up database tables...");
  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'cashier',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER REFERENCES restaurants(id),
      name TEXT NOT NULL,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER REFERENCES restaurants(id),
      name TEXT NOT NULL,
      emoji TEXT,
      base_price TEXT NOT NULL,
      current_price TEXT NOT NULL,
      min_price TEXT,
      max_price TEXT,
      is_active INTEGER DEFAULT 1,
      dynamic_pricing_enabled INTEGER DEFAULT 0,
      price_sensitivity TEXT DEFAULT '1',
      orders_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS live_demand (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      heat_score TEXT DEFAULT '0',
      velocity TEXT DEFAULT '0',
      hourly_orders INTEGER DEFAULT 0,
      daily_orders INTEGER DEFAULT 0,
      weekly_orders INTEGER DEFAULT 0,
      last_order_at TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER REFERENCES restaurants(id),
      branch_id INTEGER REFERENCES branches(id),
      employee_id INTEGER REFERENCES users(id),
      order_number TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      is_cancelled INTEGER DEFAULT 0,
      cancelled_at TEXT,
      cancellation_reason TEXT,
      source TEXT DEFAULT 'pos',
      subtotal TEXT NOT NULL,
      tax TEXT NOT NULL,
      discount TEXT DEFAULT '0',
      total TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      table_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price TEXT NOT NULL,
      total_price TEXT NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS pricing_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER REFERENCES restaurants(id),
      product_id INTEGER REFERENCES products(id),
      order_id INTEGER REFERENCES orders(id),
      old_price TEXT NOT NULL,
      new_price TEXT NOT NULL,
      change_percent TEXT NOT NULL,
      trigger TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existingUsers = sqlite.prepare("SELECT * FROM users LIMIT 1").get();
  if (!existingUsers) {
    console.log("Seeding initial data...");
    sqlite.prepare("INSERT INTO users (name, email, role) VALUES (?, ?, ?)").run("Admin", "admin@foodmarket.ai", "admin");
    sqlite.prepare("INSERT INTO restaurants (owner_id, name) VALUES (?, ?)").run(1, "FoodMarket AI");
    sqlite.prepare("INSERT INTO branches (restaurant_id, name) VALUES (?, ?)").run(1, "Main Branch");

    // Insert some products
    const insertProduct = sqlite.prepare("INSERT INTO products (restaurant_id, name, emoji, base_price, current_price, dynamic_pricing_enabled, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
    insertProduct.run(1, "Classic Burger", "🍔", "599", "599", 1, 1);
    insertProduct.run(1, "Cheese Pizza", "🍕", "1299", "1299", 1, 1);
    insertProduct.run(1, "French Fries", "🍟", "299", "299", 1, 1);
    insertProduct.run(1, "Coca Cola", "🥤", "199", "199", 0, 1);
    insertProduct.run(1, "Chicken Nuggets", "🍗", "699", "699", 1, 1);

    // Initial demand for all
    const insertDemand = sqlite.prepare("INSERT INTO live_demand (product_id) VALUES (?)");
    insertDemand.run(1);
    insertDemand.run(2);
    insertDemand.run(3);
    insertDemand.run(4);
    insertDemand.run(5);
  }
};

try {
  seed();
} catch (e) {
  console.error("Failed to seed db", e);
}

export const getDb = () => db;
