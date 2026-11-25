# 🐾 Animal Feeding System v2.0

A comprehensive smart web application for animal feeding operations with SQL logging, Python analytics, waste tracking, anomaly detection, and stock forecasting.

## 🌟 What's New (v2.0 vs Original)

### Original Limitations
- Only covered scheduling functionality
- No feeding data logging or storage
- No consumption analysis
- No waste tracking or cost tracking
- No anomaly detection or alerts
- No stock forecasting

### v2.0 Improvements
| Feature | Original | v2.0 |
|---------|----------|------|
| Feeding Logging | ❌ | ✅ SQL-based with full history |
| Consumption Analysis | ❌ | ✅ Per animal, per food type |
| Waste Tracking | ❌ | ✅ Grams wasted, cost impact |
| Cost Analytics | ❌ | ✅ Daily/weekly/monthly reports |
| Anomaly Alerts | ❌ | ✅ Missed/reduced/waste alerts |
| Stock Forecasting | ❌ | ✅ 14-day prediction with AI |
| Data Visualization | ❌ | ✅ Charts and trends |

---

## 🛠️ Tech Stack

### Frontend
- **React 18.x** + **TypeScript 5.x** - Component-based UI
- **Vite 5.x** - Lightning-fast dev server
- **Tailwind CSS 3.x** - Utility-first styling
- **Recharts** - Data visualization
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Express.js 4.x** - REST API server
- **Better-SQLite3** - Local SQL database (no external DB required)

### Analytics
- **Python 3.x** - Advanced analytics module
- Statistical anomaly detection
- Linear regression for forecasting
- Seasonal consumption patterns

---

## 📁 Project Structure

```
Animal-Feeding-System/
├── src/
│   ├── components/
│   │   └── Navbar.tsx         # Navigation component
│   ├── pages/
│   │   ├── Welcome.tsx        # Dashboard with real-time stats
│   │   ├── AnimalList.tsx     # Animal management
│   │   ├── Schedule.tsx       # Feeding schedules
│   │   ├── Feeding.tsx        # Feeding log (CORE)
│   │   ├── Food.tsx           # Inventory & stock
│   │   ├── Analysis.tsx       # Stock forecast
│   │   ├── Alerts.tsx         # Anomaly alerts
│   │   └── Breeding.tsx       # Reports & analytics
│   ├── services/
│   │   └── api.ts             # API client
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
├── backend/
│   ├── database.js            # SQLite schema & seeding
│   ├── server.js              # Express REST API
│   └── analytics.py           # Python analytics module
├── data/
│   └── feeding.db             # SQLite database (auto-created)
├── public/
│   └── paw.svg                # App icon
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- Python 3.8+ (for analytics)

### Installation

```bash
# Clone the repository
cd Animal-Feeding-System

# Install Node dependencies
npm install

# Start both backend and frontend
npm run dev:all
```

Or run separately:
```bash
# Terminal 1: Backend (port 3001)
npm run server

# Terminal 2: Frontend (port 5173)
npm run dev
```

Visit:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001/api

---

## 📊 Core Features

### 1. Feeding Logging (The Core)
Log every feeding with:
- Animal identification
- Food type and portion size
- Actual consumption (grams)
- Waste tracking
- Status: completed/partial/missed/skipped
- Staff notes

```typescript
// API Example
POST /api/feeding-logs
{
  "animal_id": 1,
  "food_type_id": 1,
  "scheduled_time": "2025-01-17T08:00:00",
  "portion_grams": 5000,
  "consumed_grams": 4800,
  "portion_wasted_grams": 200,
  "status": "completed"
}
```

### 2. Waste & Cost Tracking
Track every gram of food:
- **Waste** → Recorded and cost calculated
- **Consumption** → Deducted from inventory
- **Transactions** → Full audit trail

Cost per food type tracked automatically with real-time calculations.

### 3. Anomaly Detection (Python + SQL)
Automated alerts for:
- **Missed Feedings** - Multiple missed = critical alert
- **Reduced Consumption** - Statistical outlier detection
- **Waste Spikes** - Waste > 2x standard deviation
- **Low Stock** - Below minimum threshold
- **Expiration Warnings** - Items expiring soon

```python
# Example: Anomaly Detection
python backend/analytics.py anomalies medium
# Returns sorted alerts by severity
```

### 4. Stock Forecasting (AI-Powered)
Python analytics predict:
- Days until stockout
- Recommended order quantity
- Estimated reorder cost
- Seasonal trend adjustments

```python
# Generate 14-day forecast
python backend/analytics.py forecast 14
```

---

## 📈 Database Schema (SQLite)

### Core Tables
- `animals` - Animal profiles with species, weight, status
- `food_types` - Food catalog with categories and costs
- `food_stock` - Current inventory levels
- `feeding_schedules` - Recurring feeding routines
- `feeding_logs` - **Core table** - All feeding records
- `food_transactions` - In/out/waste audit trail
- `anomaly_alerts` - Detected issues
- `staff` - Caretakers and veterinarians

### Key Relationships
```
animals 1───N feeding_schedules
animals 1───N feeding_logs
food_types 1───N feeding_schedules
food_types 1───N feeding_logs
food_types 1───N food_stock
food_types 1───N food_transactions
```

---

## 🎨 Pages Overview

| Page | Description |
|------|-------------|
| **Dashboard** | Real-time stats, today's feedings, alerts, consumption trends |
| **Animals** | Add/edit animals, filter by species/status |
| **Schedules** | Create feeding routines by time slot |
| **Feeding Log** | Record and track all feedings with quick actions |
| **Inventory** | Stock levels, restock, transaction history |
| **Analysis** | 14-day stock forecast with reorder recommendations |
| **Alerts** | View and acknowledge anomaly alerts |
| **Reports** | Cost analysis, consumption by animal/food |

---

## 🔧 API Endpoints

### Animals
- `GET /api/animals` - List all
- `POST /api/animals` - Create
- `PUT /api/animals/:id` - Update

### Food Stock
- `GET /api/food-stock` - All stock
- `GET /api/food-stock/low` - Low stock items
- `POST /api/food-stock/restock` - Add stock

### Feeding Logs (Core)
- `GET /api/feeding-logs` - Filtered logs
- `GET /api/feeding-logs/today` - Today's feedings
- `POST /api/feeding-logs` - Record feeding

### Analysis
- `GET /api/analysis/consumption` - Per-animal consumption
- `GET /api/analysis/trends` - 14-day trends
- `GET /api/analysis/cost` - Cost breakdown
- `GET /api/analysis/forecast` - Stock predictions

### Alerts
- `GET /api/alerts` - Get alerts
- `PUT /api/alerts/:id/acknowledge` - Acknowledge
- `POST /api/alerts/generate` - Run detection

---

## 📊 Python Analytics Commands

```bash
# View consumption patterns
python backend/analytics.py consumption 30

# Generate anomaly alerts
python backend/analytics.py anomalies medium

# Stock forecast for 14 days
python backend/analytics.py forecast 14

# Cost analysis
python backend/analytics.py cost 2025-01-01 2025-01-31

# Full analysis report
python backend/analytics.py full
```

---

## 🎯 Key Metrics Tracked

| Metric | Description |
|--------|-------------|
| Completion Rate | % of feedings completed on time |
| Waste % | Wasted food as percentage of total |
| Daily Cost | Total feeding cost per day |
| Stock Days | Days until stockout |
| Anomaly Rate | Alerts per 100 feedings |

---

## 🔒 Data Safety

- Local SQLite database (no cloud sync)
- All data stored in `./data/feeding.db`
- Backup by copying the database file
- Seed data included for testing

---

## 📄 License

MIT License

---

## 👨‍💻 Built With

- React + TypeScript + Vite
- Express + SQLite
- Python (analytics)
- Tailwind CSS
- Recharts