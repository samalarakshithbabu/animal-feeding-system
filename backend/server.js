import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ============= ANIMALS API =============
app.get('/api/animals', (req, res) => {
  try {
    const animals = db.prepare('SELECT * FROM animals ORDER BY name').all();
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/animals/:id', (req, res) => {
  try {
    const animal = db.prepare('SELECT * FROM animals WHERE id = ?').get(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    res.json(animal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/animals', (req, res) => {
  try {
    const { name, species, age_months, weight_kg, status, feeding_zone } = req.body;
    const result = db.prepare(`
      INSERT INTO animals (name, species, age_months, weight_kg, status, feeding_zone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, species, age_months || 0, weight_kg || 0, status || 'healthy', feeding_zone);
    res.json({ id: result.lastInsertRowid, message: 'Animal added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/animals/:id', (req, res) => {
  try {
    const { name, species, age_months, weight_kg, status, feeding_zone } = req.body;
    db.prepare(`
      UPDATE animals SET name = ?, species = ?, age_months = ?, weight_kg = ?, status = ?, feeding_zone = ?
      WHERE id = ?
    `).run(name, species, age_months, weight_kg, status, feeding_zone, req.params.id);
    res.json({ message: 'Animal updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= FOOD TYPES API =============
app.get('/api/food-types', (req, res) => {
  try {
    const foodTypes = db.prepare('SELECT * FROM food_types ORDER BY name').all();
    res.json(foodTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/food-stock', (req, res) => {
  try {
    const stock = db.prepare(`
      SELECT fs.*, ft.name as food_name, ft.category, ft.unit_cost
      FROM food_stock fs
      JOIN food_types ft ON fs.food_type_id = ft.id
      ORDER BY ft.name
    `).all();
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/food-stock/low', (req, res) => {
  try {
    const lowStock = db.prepare(`
      SELECT fs.*, ft.name as food_name, ft.unit_cost
      FROM food_stock fs
      JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE fs.quantity_kg <= fs.min_threshold_kg
    `).all();
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/food-stock/restock', (req, res) => {
  try {
    const { food_type_id, quantity_kg, supplier, expiration_date } = req.body;
    const transaction = db.transaction(() => {
      // Update or insert stock
      const existing = db.prepare('SELECT * FROM food_stock WHERE food_type_id = ?').get(food_type_id);
      if (existing) {
        db.prepare('UPDATE food_stock SET quantity_kg = quantity_kg + ?, last_restocked = CURRENT_TIMESTAMP WHERE food_type_id = ?')
          .run(quantity_kg, food_type_id);
      } else {
        db.prepare('INSERT INTO food_stock (food_type_id, quantity_kg, supplier, expiration_date) VALUES (?, ?, ?, ?)')
          .run(food_type_id, quantity_kg, supplier, expiration_date);
      }
      // Record transaction
      db.prepare('INSERT INTO food_transactions (food_type_id, transaction_type, quantity_kg, reason, staff_id) VALUES (?, "in", ?, ?, 1)')
        .run(food_type_id, quantity_kg, `Restock from ${supplier}`);
    });
    transaction();
    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/food-transactions', (req, res) => {
  try {
    const { food_type_id, start_date, end_date } = req.query;
    let query = `
      SELECT ft.*, fd.name as food_name, s.name as staff_name
      FROM food_transactions ft
      JOIN food_types fd ON ft.food_type_id = fd.id
      LEFT JOIN staff s ON ft.staff_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (food_type_id) {
      query += ' AND ft.food_type_id = ?';
      params.push(food_type_id);
    }
    if (start_date) {
      query += ' AND ft.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND ft.created_at <= ?';
      params.push(end_date);
    }
    query += ' ORDER BY ft.created_at DESC LIMIT 100';
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= FEEDING SCHEDULES API =============
app.get('/api/schedules', (req, res) => {
  try {
    const { animal_id, active_only } = req.query;
    let query = `
      SELECT fs.*, a.name as animal_name, a.species, ft.name as food_name, ft.category
      FROM feeding_schedules fs
      JOIN animals a ON fs.animal_id = a.id
      JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE 1=1
    `;
    const params = [];
    if (animal_id) {
      query += ' AND fs.animal_id = ?';
      params.push(animal_id);
    }
    if (active_only === 'true') {
      query += ' AND fs.is_active = 1';
    }
    query += ' ORDER BY fs.scheduled_time';
    const schedules = db.prepare(query).all(...params);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedules', (req, res) => {
  try {
    const { animal_id, food_type_id, scheduled_time, portion_grams, frequency } = req.body;
    const result = db.prepare(`
      INSERT INTO feeding_schedules (animal_id, food_type_id, scheduled_time, portion_grams, frequency)
      VALUES (?, ?, ?, ?, ?)
    `).run(animal_id, food_type_id, scheduled_time, portion_grams, frequency || 'daily');
    res.json({ id: result.lastInsertRowid, message: 'Schedule created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schedules/:id', (req, res) => {
  try {
    const { animal_id, food_type_id, scheduled_time, portion_grams, frequency, is_active } = req.body;
    db.prepare(`
      UPDATE feeding_schedules SET animal_id = ?, food_type_id = ?, scheduled_time = ?, portion_grams = ?, frequency = ?, is_active = ?
      WHERE id = ?
    `).run(animal_id, food_type_id, scheduled_time, portion_grams, frequency, is_active ? 1 : 0, req.params.id);
    res.json({ message: 'Schedule updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/schedules/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM feeding_schedules WHERE id = ?').run(req.params.id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= FEEDING LOGS API (Core Feature) =============
app.get('/api/feeding-logs', (req, res) => {
  try {
    const { animal_id, start_date, end_date, status } = req.query;
    let query = `
      SELECT fl.*, a.name as animal_name, a.species, ft.name as food_name, s.name as staff_name
      FROM feeding_logs fl
      JOIN animals a ON fl.animal_id = a.id
      JOIN food_types ft ON fl.food_type_id = ft.id
      LEFT JOIN staff s ON fl.staff_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (animal_id) {
      query += ' AND fl.animal_id = ?';
      params.push(animal_id);
    }
    if (start_date) {
      query += ' AND fl.scheduled_time >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND fl.scheduled_time <= ?';
      params.push(end_date);
    }
    if (status) {
      query += ' AND fl.status = ?';
      params.push(status);
    }
    query += ' ORDER BY fl.scheduled_time DESC LIMIT 500';
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feeding-logs/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logs = db.prepare(`
      SELECT fl.*, a.name as animal_name, a.species, ft.name as food_name
      FROM feeding_logs fl
      JOIN animals a ON fl.animal_id = a.id
      JOIN food_types ft ON fl.food_type_id = ft.id
      WHERE date(fl.scheduled_time) = date(?)
      ORDER BY fl.scheduled_time
    `).all(today);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feeding-logs', (req, res) => {
  try {
    const { animal_id, food_type_id, scheduled_time, portion_grams, portion_wasted_grams, consumed_grams, notes, staff_id, status } = req.body;
    const actual_time = status !== 'missed' ? new Date().toISOString() : null;
    const result = db.prepare(`
      INSERT INTO feeding_logs (animal_id, food_type_id, scheduled_time, actual_time, portion_grams, portion_wasted_grams, consumed_grams, notes, staff_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(animal_id, food_type_id, scheduled_time, actual_time, portion_grams, portion_wasted_grams || 0, consumed_grams || 0, notes, staff_id || 1, status);

    // Update food stock if feeding completed
    if (status === 'completed' || status === 'partial') {
      const consumedTotal = (consumed_grams || 0) + (portion_wasted_grams || 0);
      db.prepare('UPDATE food_stock SET quantity_kg = quantity_kg - ? WHERE food_type_id = ?')
        .run(consumedTotal / 1000, food_type_id);
      db.prepare('INSERT INTO food_transactions (food_type_id, transaction_type, quantity_kg, reason, staff_id) VALUES (?, ?, ?, ?, ?)')
        .run(food_type_id, 'out', consumedTotal / 1000, 'Feeding', staff_id || 1);
    }

    // Record waste if any
    if (portion_wasted_grams > 0) {
      db.prepare('INSERT INTO food_transactions (food_type_id, transaction_type, quantity_kg, reason, staff_id) VALUES (?, ?, ?, ?, ?)')
        .run(food_type_id, 'waste', portion_wasted_grams / 1000, notes || 'Feeding waste', staff_id || 1);
    }

    res.json({ id: result.lastInsertRowid, message: 'Feeding logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= DASHBOARD API =============
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM animals) as total_animals,
        (SELECT COUNT(*) FROM feeding_schedules WHERE is_active = 1) as active_schedules,
        (SELECT COUNT(*) FROM feeding_logs WHERE date(scheduled_time) = date(?) AND status = 'completed') as today_completed,
        (SELECT COUNT(*) FROM feeding_logs WHERE date(scheduled_time) = date(?) AND status = 'missed') as today_missed,
        (SELECT COALESCE(SUM(portion_wasted_grams), 0) / 1000 FROM feeding_logs WHERE date(scheduled_time) = date(?)) as total_waste_kg,
        (SELECT COALESCE(SUM(fl.portion_grams * ft.unit_cost) / 1000, 0) FROM feeding_logs fl JOIN food_types ft ON fl.food_type_id = ft.id WHERE date(fl.scheduled_time) = date(?)) as daily_cost,
        (SELECT COUNT(*) FROM anomaly_alerts WHERE is_acknowledged = 0) as alerts_count,
        (SELECT COUNT(*) FROM food_stock WHERE quantity_kg <= min_threshold_kg) as low_stock_items
    `).get(today, today, today, today);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= ANALYSIS API =============
app.get('/api/analysis/consumption', (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analysis = db.prepare(`
      SELECT
        a.id as animal_id,
        a.name as animal_name,
        a.species,
        COALESCE(SUM(fl.consumed_grams), 0) as total_consumed_grams,
        COALESCE(SUM(fl.consumed_grams) / ?, 0) as average_daily_grams,
        CASE
          WHEN SUM(fl.portion_grams) > 0
          THEN ROUND((SUM(fl.portion_wasted_grams) / SUM(fl.portion_grams)) * 100, 2)
          ELSE 0
        END as waste_percentage
      FROM animals a
      LEFT JOIN feeding_logs fl ON a.id = fl.animal_id AND fl.scheduled_time >= ?
      GROUP BY a.id
      ORDER BY total_consumed_grams DESC
    `).all(parseInt(days), startDate.toISOString());

    res.json(analysis.map(a => ({
      ...a,
      total_consumed_kg: Math.round(a.total_consumed_grams / 1000 * 100) / 100,
      average_daily_kg: Math.round(a.average_daily_grams / 1000 * 100) / 100
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analysis/trends', (req, res) => {
  try {
    const { days = 14 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = db.prepare(`
      SELECT
        date(scheduled_time) as date,
        SUM(consumed_grams) as total_consumed,
        SUM(portion_wasted_grams) as total_wasted,
        COUNT(*) as total_feedings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM feeding_logs
      WHERE scheduled_time >= ?
      GROUP BY date(scheduled_time)
      ORDER BY date
    `).all(startDate.toISOString());

    res.json(trends.map(t => ({
      ...t,
      total_consumed_kg: Math.round(t.total_consumed / 1000 * 100) / 100,
      total_wasted_kg: Math.round(t.total_wasted / 1000 * 100) / 100,
      completion_rate: t.total_feedings > 0 ? Math.round((t.completed / t.total_feedings) * 100) : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analysis/cost', (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const costByFood = db.prepare(`
      SELECT
        ft.id as food_type_id,
        ft.name as food_name,
        ft.category,
        SUM(fl.consumed_grams) as consumed_grams,
        SUM(fl.consumed_grams * ft.unit_cost / 1000) as total_cost
      FROM feeding_logs fl
      JOIN food_types ft ON fl.food_type_id = ft.id
      WHERE fl.scheduled_time >= ?
      GROUP BY ft.id
      ORDER BY total_cost DESC
    `).all(startDate.toISOString());

    res.json(costByFood.map(c => ({
      ...c,
      consumed_kg: Math.round(c.consumed_grams / 1000 * 100) / 100,
      total_cost: Math.round(c.total_cost * 100) / 100
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= STOCK FORECAST API =============
app.get('/api/analysis/forecast', (req, res) => {
  try {
    // Get average daily consumption for each food type
    const dailyUsage = db.prepare(`
      SELECT
        fl.food_type_id,
        ft.name as food_name,
        AVG(daily_totals.daily_consumed / 1000) as avg_daily_kg
      FROM feeding_logs fl
      JOIN food_types ft ON fl.food_type_id = ft.id
      JOIN (
        SELECT date(scheduled_time) as day, food_type_id, SUM(consumed_grams) as daily_consumed
        FROM feeding_logs
        WHERE scheduled_time >= datetime('now', '-7 days')
        GROUP BY date(scheduled_time), food_type_id
      ) daily_totals ON date(fl.scheduled_time) = daily_totals.day AND fl.food_type_id = daily_totals.food_type_id
      WHERE fl.scheduled_time >= datetime('now', '-7 days')
      GROUP BY fl.food_type_id
    `).all();

    const currentStock = db.prepare(`
      SELECT fs.*, ft.name as food_name, ft.unit_cost
      FROM food_stock fs
      JOIN food_types ft ON fs.food_type_id = ft.id
    `).all();

    const forecast = currentStock.map(stock => {
      const usage = dailyUsage.find(d => d.food_type_id === stock.food_type_id);
      const dailyUsageKg = usage?.avg_daily_kg || 0;
      const currentStockKg = stock.quantity_kg;
      const daysUntilEmpty = dailyUsageKg > 0 ? Math.floor(currentStockKg / dailyUsageKg) : 999;
      const recommendedOrder = dailyUsageKg * 14; // 2 week supply
      const estimatedCost = recommendedOrder * stock.unit_cost;

      return {
        food_type_id: stock.food_type_id,
        food_name: stock.food_name,
        current_stock_kg: Math.round(currentStockKg * 100) / 100,
        projected_daily_usage_kg: Math.round(dailyUsageKg * 100) / 100,
        days_until_empty: daysUntilEmpty,
        recommended_order_kg: Math.round(recommendedOrder * 100) / 100,
        estimated_cost: Math.round(estimatedCost * 100) / 100,
        status: daysUntilEmpty < 3 ? 'critical' : daysUntilEmpty < 7 ? 'low' : 'ok'
      };
    });

    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= ALERTS API =============
app.get('/api/alerts', (req, res) => {
  try {
    const { acknowledged } = req.query;
    let query = `
      SELECT aa.*, a.name as animal_name
      FROM anomaly_alerts aa
      LEFT JOIN animals a ON aa.animal_id = a.id
    `;
    const params = [];
    if (acknowledged !== undefined) {
      query += ' WHERE aa.is_acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }
    query += ' ORDER BY aa.created_at DESC LIMIT 50';
    const alerts = db.prepare(query).all(...params);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alerts/:id/acknowledge', (req, res) => {
  try {
    db.prepare('UPDATE anomaly_alerts SET is_acknowledged = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Alert acknowledged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate anomaly alerts based on data
app.post('/api/alerts/generate', (req, res) => {
  try {
    const alerts = [];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check for missed feedings
    const missedFeedings = db.prepare(`
      SELECT a.name, COUNT(*) as count
      FROM feeding_logs fl
      JOIN animals a ON fl.animal_id = a.id
      WHERE date(fl.scheduled_time) >= ? AND fl.status = 'missed'
      GROUP BY fl.animal_id
    `).all(yesterday);

    missedFeedings.forEach(m => {
      if (m.count >= 2) {
        alerts.push({ animal_id: null, alert_type: 'missed_feeding', severity: 'high', message: `Multiple missed feedings for multiple animals on ${yesterday}` });
      } else {
        alerts.push({ animal_id: null, alert_type: 'missed_feeding', severity: 'medium', message: `${m.name} missed ${m.count} feeding(s) on ${yesterday}` });
      }
    });

    // Check for reduced consumption (below 70% of scheduled)
    const reducedConsumption = db.prepare(`
      SELECT a.name, fl.scheduled_time, (fl.consumed_grams / fl.portion_grams * 100) as consumption_rate
      FROM feeding_logs fl
      JOIN animals a ON fl.animal_id = a.id
      WHERE fl.scheduled_time >= ? AND fl.status = 'partial' AND (fl.consumed_grams / fl.portion_grams) < 0.7
    `).all(yesterday);

    reducedConsumption.forEach(r => {
      alerts.push({ animal_id: null, alert_type: 'reduced_consumption', severity: 'low', message: `${r.name} consumed only ${Math.round(r.consumption_rate)}% on ${r.scheduled_time.split('T')[0]}` });
    });

    // Check for low stock
    const lowStock = db.prepare(`
      SELECT fs.*, ft.name as food_name
      FROM food_stock fs
      JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE fs.quantity_kg <= fs.min_threshold_kg
    `).all();

    lowStock.forEach(ls => {
      const severity = ls.quantity_kg <= ls.min_threshold_kg * 0.5 ? 'critical' : 'high';
      alerts.push({ animal_id: null, alert_type: 'low_stock', severity, message: `${ls.food_name} stock low: ${Math.round(ls.quantity_kg)}kg (threshold: ${ls.min_threshold_kg}kg)` });
    });

    // Insert new alerts
    const insertAlert = db.prepare('INSERT INTO anomaly_alerts (animal_id, alert_type, severity, message) VALUES (?, ?, ?, ?)');
    alerts.forEach(a => insertAlert.run(a.animal_id, a.alert_type, a.severity, a.message));

    res.json({ message: `Generated ${alerts.length} alerts` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= REPORTS API =============
app.get('/api/reports/feeding', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const start = start_date || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const end = end_date || new Date().toISOString().split('T')[0];

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_feedings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as completion_rate,
        COALESCE(SUM(consumed_grams), 0) / 1000 as total_consumed_kg,
        COALESCE(SUM(portion_wasted_grams), 0) / 1000 as total_wasted_kg,
        COALESCE(SUM(fl.consumed_grams * ft.unit_cost) / 1000, 0) as total_cost
      FROM feeding_logs fl
      JOIN food_types ft ON fl.food_type_id = ft.id
      WHERE date(fl.scheduled_time) BETWEEN date(?) AND date(?)
    `).get(start, end);

    const byAnimal = db.prepare(`
      SELECT
        a.id as animal_id,
        a.name as animal_name,
        a.species,
        COUNT(*) as feeding_count,
        COALESCE(SUM(fl.consumed_grams), 0) as consumed_grams,
        COALESCE(SUM(fl.portion_wasted_grams), 0) as wasted_grams
      FROM feeding_logs fl
      JOIN animals a ON fl.animal_id = a.id
      WHERE date(fl.scheduled_time) BETWEEN date(?) AND date(?)
      GROUP BY a.id
    `).all(start, end);

    const byFoodType = db.prepare(`
      SELECT
        ft.id as food_type_id,
        ft.name as food_name,
        COALESCE(SUM(fl.consumed_grams), 0) / 1000 as consumed_kg,
        COALESCE(SUM(fl.consumed_grams * ft.unit_cost) / 1000, 0) as cost
      FROM feeding_logs fl
      JOIN food_types ft ON fl.food_type_id = ft.id
      WHERE date(fl.scheduled_time) BETWEEN date(?) AND date(?)
      GROUP BY ft.id
    `).all(start, end);

    res.json({
      period_start: start,
      period_end: end,
      ...summary,
      completion_rate: Math.round(summary.completion_rate * 100) / 100,
      total_consumed_kg: Math.round(summary.total_consumed_kg * 100) / 100,
      total_wasted_kg: Math.round(summary.total_wasted_kg * 100) / 100,
      total_cost: Math.round(summary.total_cost * 100) / 100,
      by_animal: byAnimal.map(a => ({
        ...a,
        consumed_kg: Math.round(a.consumed_grams / 1000 * 100) / 100,
        wasted_kg: Math.round(a.wasted_grams / 1000 * 100) / 100
      })),
      by_food_type: byFoodType.map(f => ({
        ...f,
        consumed_kg: Math.round(f.consumed_kg * 100) / 100,
        cost: Math.round(f.cost * 100) / 100
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= STAFF API =============
app.get('/api/staff', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff WHERE is_active = 1 ORDER BY name').all();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});