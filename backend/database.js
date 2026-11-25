import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'feeding.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Users table for authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'keeper', 'viewer')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Animals table
  CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    age_months INTEGER DEFAULT 0,
    weight_kg REAL DEFAULT 0,
    status TEXT DEFAULT 'healthy' CHECK(status IN ('healthy', 'ill', 'quarantine', 'recovering')),
    feeding_zone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Food types catalog
  CREATE TABLE IF NOT EXISTS food_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK(category IN ('meat', 'vegetable', 'fruit', 'grain', 'supplement', 'live')),
    unit_cost REAL NOT NULL,
    unit TEXT DEFAULT 'kg',
    calories_per_gram REAL DEFAULT 0
  );

  -- Food inventory
  CREATE TABLE IF NOT EXISTS food_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_type_id INTEGER NOT NULL,
    quantity_kg REAL NOT NULL DEFAULT 0,
    min_threshold_kg REAL DEFAULT 5,
    expiration_date DATE,
    supplier TEXT,
    last_restocked DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_type_id) REFERENCES food_types(id)
  );

  -- Food transactions (in/out/waste)
  CREATE TABLE IF NOT EXISTS food_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_type_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('in', 'out', 'waste', 'adjustment')),
    quantity_kg REAL NOT NULL,
    reason TEXT,
    staff_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_type_id) REFERENCES food_types(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
  );

  -- Staff table
  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('keeper', 'veterinarian', 'manager', 'admin')),
    email TEXT UNIQUE,
    phone TEXT,
    is_active INTEGER DEFAULT 1
  );

  -- Feeding schedules
  CREATE TABLE IF NOT EXISTS feeding_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    food_type_id INTEGER NOT NULL,
    scheduled_time TIME NOT NULL,
    portion_grams REAL NOT NULL,
    frequency TEXT DEFAULT 'daily' CHECK(frequency IN ('daily', 'twice_daily', 'weekly', 'custom')),
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    FOREIGN KEY (food_type_id) REFERENCES food_types(id)
  );

  -- Feeding logs (the core tracking table)
  CREATE TABLE IF NOT EXISTS feeding_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    food_type_id INTEGER NOT NULL,
    scheduled_time DATETIME NOT NULL,
    actual_time DATETIME,
    portion_grams REAL NOT NULL,
    portion_wasted_grams REAL DEFAULT 0,
    consumed_grams REAL DEFAULT 0,
    notes TEXT,
    staff_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('completed', 'partial', 'missed', 'skipped')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    FOREIGN KEY (food_type_id) REFERENCES food_types(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
  );

  -- Anomaly alerts
  CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('missed_feeding', 'reduced_consumption', 'waste_spike', 'low_stock', 'expiration_warning')),
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    is_acknowledged INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_feeding_logs_animal ON feeding_logs(animal_id);
  CREATE INDEX IF NOT EXISTS idx_feeding_logs_date ON feeding_logs(scheduled_time);
  CREATE INDEX IF NOT EXISTS idx_feeding_logs_status ON feeding_logs(status);
  CREATE INDEX IF NOT EXISTS idx_food_stock_food_type ON food_stock(food_type_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_food_type ON food_transactions(food_type_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON food_transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Seed initial data
const seedData = async () => {
  // Check if already seeded
  const animalCount = db.prepare('SELECT COUNT(*) as count FROM animals').get().count;
  if (animalCount > 0) {
    // Ensure default admin user exists
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@zoo.com');
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      db.prepare(`
        INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
      `).run('admin@zoo.com', passwordHash, 'System Administrator', 'admin');

      const viewerExists = db.prepare('SELECT id FROM users WHERE email = ?').get('viewer@zoo.com');
      if (!viewerExists) {
        const viewerHash = await bcrypt.hash('viewer123', 12);
        db.prepare(`
          INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
        `).run('viewer@zoo.com', viewerHash, 'Viewer Account', 'viewer');
      }
    }
    return;
  }

  // Insert food types
  const insertFoodType = db.prepare(`
    INSERT INTO food_types (name, category, unit_cost, unit, calories_per_gram) VALUES (?, ?, ?, ?, ?)
  `);
  const foodTypes = [
    ['Beef', 'meat', 12.50, 'kg', 2.5],
    ['Chicken', 'meat', 8.00, 'kg', 1.8],
    ['Fish', 'meat', 15.00, 'kg', 2.0],
    ['Carrots', 'vegetable', 2.00, 'kg', 0.4],
    ['Leafy Greens', 'vegetable', 3.50, 'kg', 0.3],
    ['Apples', 'fruit', 4.00, 'kg', 0.5],
    ['Bananas', 'fruit', 2.50, 'kg', 0.9],
    ['Pellets', 'grain', 5.00, 'kg', 3.5],
    ['Grains Mix', 'grain', 3.00, 'kg', 3.0],
    ['Supplements', 'supplement', 25.00, 'kg', 0],
    ['Live Insects', 'live', 30.00, 'kg', 1.5]
  ];
  foodTypes.forEach(f => insertFoodType.run(...f));

  // Insert staff
  const insertStaff = db.prepare(`
    INSERT INTO staff (name, role, email, phone) VALUES (?, ?, ?, ?)
  `);
  const staffMembers = [
    ['John Smith', 'keeper', 'john@zoo.com', '555-0101'],
    ['Sarah Johnson', 'keeper', 'sarah@zoo.com', '555-0102'],
    ['Dr. Emily Chen', 'veterinarian', 'emily@zoo.com', '555-0103'],
    ['Mike Wilson', 'manager', 'mike@zoo.com', '555-0104']
  ];
  staffMembers.forEach(s => insertStaff.run(...s));

  // Insert animals
  const insertAnimal = db.prepare(`
    INSERT INTO animals (name, species, age_months, weight_kg, status, feeding_zone) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const animals = [
    ['Simba', 'Lion', 48, 190, 'healthy', 'Zone A'],
    ['Elsa', 'Lion', 42, 175, 'healthy', 'Zone A'],
    ['Zazu', 'Hornbill', 24, 2.5, 'healthy', 'Zone B'],
    ['Rafiki', 'Mandrill', 36, 35, 'healthy', 'Zone B'],
    ['Pumbaa', 'Warthog', 30, 85, 'healthy', 'Zone C'],
    ['Timon', 'Meerkat', 12, 4, 'healthy', 'Zone C'],
    ['Dumbo', 'Elephant', 120, 3500, 'healthy', 'Zone D'],
    ['Giraffe 1', 'Giraffe', 60, 800, 'healthy', 'Zone D'],
    ['Penguin 1', 'Penguin', 18, 25, 'healthy', 'Zone E'],
    ['Penguin 2', 'Penguin', 18, 24, 'healthy', 'Zone E']
  ];
  animals.forEach(a => insertAnimal.run(...a));

  // Insert food stock
  const insertStock = db.prepare(`
    INSERT INTO food_stock (food_type_id, quantity_kg, min_threshold_kg, expiration_date, supplier) VALUES (?, ?, ?, ?, ?)
  `);
  const stocks = [
    [1, 50, 10, '2025-06-15', 'Local Butcher'],
    [2, 30, 15, '2025-06-10', 'Poultry Farm'],
    [4, 100, 20, '2025-06-20', 'Organic Farm'],
    [8, 200, 50, '2025-12-01', 'Feed Supplier'],
    [11, 5, 2, '2025-06-25', 'Insect Farm']
  ];
  stocks.forEach(s => insertStock.run(...s));

  // Insert feeding schedules
  const insertSchedule = db.prepare(`
    INSERT INTO feeding_schedules (animal_id, food_type_id, scheduled_time, portion_grams, frequency) VALUES (?, ?, ?, ?, ?)
  `);
  const schedules = [
    [1, 1, '08:00', 5000, 'daily'],
    [1, 8, '16:00', 2000, 'daily'],
    [2, 1, '08:00', 4500, 'daily'],
    [2, 8, '16:00', 1800, 'daily'],
    [3, 11, '07:00', 100, 'twice_daily'],
    [3, 2, '12:00', 150, 'daily'],
    [4, 2, '08:00', 400, 'daily'],
    [4, 4, '14:00', 300, 'daily'],
    [5, 4, '07:00', 2000, 'daily'],
    [5, 7, '15:00', 500, 'daily'],
    [6, 11, '07:00', 50, 'twice_daily'],
    [7, 4, '06:00', 30000, 'daily'],
    [7, 8, '12:00', 15000, 'daily'],
    [8, 4, '07:00', 15000, 'daily'],
    [8, 7, '14:00', 2000, 'daily'],
    [9, 3, '08:00', 300, 'twice_daily'],
    [10, 3, '08:00', 280, 'twice_daily']
  ];
  schedules.forEach(s => insertSchedule.run(...s));

  // Generate some feeding logs for the past 7 days
  const insertLog = db.prepare(`
    INSERT INTO feeding_logs (animal_id, food_type_id, scheduled_time, actual_time, portion_grams, portion_wasted_grams, consumed_grams, staff_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    // Generate logs for each animal based on their schedule
    for (let animalId = 1; animalId <= 10; animalId++) {
      const schedulesForAnimal = schedules.filter(s => s[0] === animalId);
      schedulesForAnimal.forEach((sched, idx) => {
        const scheduledTime = `${sched[2]}:00`;
        const actualTime = Math.random() > 0.1 ? scheduledTime : null; // 10% missed
        const status = actualTime
          ? (Math.random() > 0.85 ? 'partial' : 'completed')
          : (Math.random() > 0.5 ? 'missed' : 'skipped');
        const portionGrams = sched[3];
        const consumedGrams = status === 'completed'
          ? portionGrams * (0.9 + Math.random() * 0.1)
          : status === 'partial'
            ? portionGrams * (0.3 + Math.random() * 0.4)
            : 0;
        const wastedGrams = status === 'partial'
          ? portionGrams - consumedGrams
          : status === 'completed'
            ? portionGrams * Math.random() * 0.05
            : 0;

        insertLog.run(
          animalId,
          sched[1],
          `${dateStr} ${scheduledTime}`,
          actualTime ? `${dateStr} ${actualTime}` : null,
          portionGrams,
          Math.round(wastedGrams * 100) / 100,
          Math.round(consumedGrams * 100) / 100,
          (animalId % 4) + 1,
          status
        );
      });
    }
  }

  // Insert some anomaly alerts
  const insertAlert = db.prepare(`
    INSERT INTO anomaly_alerts (animal_id, alert_type, severity, message) VALUES (?, ?, ?, ?)
  `);
  insertAlert.run(1, 'reduced_consumption', 'medium', 'Simba consumed only 60% of scheduled feeding on 2025-01-15');
  insertAlert.run(4, 'missed_feeding', 'high', 'Rafiki missed morning feeding on 2025-01-16');
  insertAlert.run(11, 'low_stock', 'critical', 'Live Insects stock below minimum threshold');
  insertAlert.run(null, 'expiration_warning', 'medium', 'Chicken stock expires in 5 days');
  insertAlert.run(7, 'waste_spike', 'low', 'Dumbo waste percentage increased by 15% this week');

  // Create default users
  const passwordHash = await bcrypt.hash('admin123', 12);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
  `).run('admin@zoo.com', passwordHash, 'System Administrator', 'admin');

  const viewerHash = await bcrypt.hash('viewer123', 12);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
  `).run('viewer@zoo.com', viewerHash, 'Viewer Account', 'viewer');

  console.log('Database seeded successfully');
};

seedData();

export default db;