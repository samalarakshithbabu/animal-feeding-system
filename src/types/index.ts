// Animal Types
export interface Animal {
  id: number;
  name: string;
  species: string;
  age_months: number;
  weight_kg: number;
  status: 'healthy' | 'ill' | 'quarantine' | 'recovering';
  feeding_zone: string;
  created_at: string;
}

// Feeding Schedule Types
export interface FeedingSchedule {
  id: number;
  animal_id: number;
  food_type_id: number;
  scheduled_time: string;
  portion_grams: number;
  frequency: 'daily' | 'twice_daily' | 'weekly' | 'custom';
  is_active: boolean;
}

export interface FeedingLog {
  id: number;
  animal_id: number;
  food_type_id: number;
  scheduled_time: string;
  actual_time: string;
  portion_grams: number;
  portion_wasted_grams: number;
  consumed_grams: number;
  notes: string;
  staff_id: number;
  status: 'completed' | 'partial' | 'missed' | 'skipped';
  created_at: string;
}

// Food Inventory Types
export interface FoodType {
  id: number;
  name: string;
  category: 'meat' | 'vegetable' | 'fruit' | 'grain' | 'supplement' | 'live';
  unit_cost: number;
  unit: string;
  calories_per_gram: number;
}

export interface FoodStock {
  id: number;
  food_type_id: number;
  quantity_kg: number;
  min_threshold_kg: number;
  expiration_date: string;
  supplier: string;
  last_restocked: string;
}

export interface FoodTransaction {
  id: number;
  food_type_id: number;
  transaction_type: 'in' | 'out' | 'waste' | 'adjustment';
  quantity_kg: number;
  reason: string;
  staff_id: number;
  created_at: string;
}

// Staff Types
export interface Staff {
  id: number;
  name: string;
  role: 'keeper' | 'veterinarian' | 'manager' | 'admin';
  email: string;
  phone: string;
  is_active: boolean;
}

// Analysis Types
export interface ConsumptionAnalysis {
  animal_id: number;
  animal_name: string;
  total_consumed_grams: number;
  average_daily_grams: number;
  waste_percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface AnomalyAlert {
  id: number;
  animal_id: number;
  alert_type: 'missed_feeding' | 'reduced_consumption' | 'waste_spike' | 'low_stock' | 'expiration_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface StockForecast {
  food_type_id: number;
  food_name: string;
  current_stock_kg: number;
  projected_daily_usage_kg: number;
  days_until_empty: number;
  recommended_order_kg: number;
  estimated_cost: number;
}

// Dashboard Stats
export interface DashboardStats {
  total_animals: number;
  active_schedules: number;
  today_completed: number;
  today_missed: number;
  total_waste_kg: number;
  daily_cost: number;
  alerts_count: number;
  low_stock_items: number;
}

// Report Types
export interface FeedingReport {
  period_start: string;
  period_end: string;
  total_feedings: number;
  completion_rate: number;
  total_consumed_kg: number;
  total_wasted_kg: number;
  total_cost: number;
  by_animal: ConsumptionAnalysis[];
  by_food_type: { food_type_id: number; name: string; consumed_kg: number; cost: number }[];
}