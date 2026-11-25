"""
Animal Feeding System - Python Analytics Module
Provides advanced consumption analysis, anomaly detection, and stock forecasting
using statistical methods and machine learning approaches.
"""

import sqlite3
import json
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

DB_PATH = "data/feeding.db"

def get_connection():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def analyze_consumption_patterns(animal_id: int = None, days: int = 30):
    """
    Analyze consumption patterns for animals using statistical methods.
    Detects trends, seasonality, and anomalies in feeding data.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    query = """
        SELECT 
            fl.animal_id,
            a.name as animal_name,
            a.species,
            date(fl.scheduled_time) as date,
            SUM(fl.consumed_grams) as daily_consumed,
            SUM(fl.portion_grams) as daily_portion,
            SUM(fl.portion_wasted_grams) as daily_wasted,
            AVG(fl.consumed_grams * 100.0 / fl.portion_grams) as avg_consumption_rate
        FROM feeding_logs fl
        JOIN animals a ON fl.animal_id = a.id
        WHERE fl.scheduled_time >= ?
        GROUP BY fl.animal_id, date(fl.scheduled_time)
    """
    params = [start_date]
    
    if animal_id:
        query += " AND fl.animal_id = ?"
        params.append(animal_id)
    
    query += " ORDER BY a.name, date"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Group by animal
    animal_data = defaultdict(lambda: {
        'name': '', 'species': '', 'daily_consumption': [], 
        'consumption_rates': [], 'waste_rates': []
    })
    
    for row in rows:
        animal_id = row['animal_id']
        animal_data[animal_id]['name'] = row['animal_name']
        animal_data[animal_id]['species'] = row['species']
        animal_data[animal_id]['daily_consumption'].append({
            'date': row['date'],
            'consumed': row['daily_consumed'],
            'portion': row['daily_portion'],
            'wasted': row['daily_wasted']
        })
        if row['avg_consumption_rate']:
            animal_data[animal_id]['consumption_rates'].append(row['avg_consumption_rate'])
        waste_rate = (row['daily_wasted'] / row['daily_portion'] * 100) if row['daily_portion'] > 0 else 0
        animal_data[animal_id]['waste_rates'].append(waste_rate)
    
    # Calculate statistics for each animal
    results = []
    for aid, data in animal_data.items():
        consumption = data['daily_consumption']
        if not consumption:
            continue
            
        total_consumed = sum(d['consumed'] for d in consumption)
        total_wasted = sum(d['wasted'] for d in consumption)
        avg_daily = total_consumed / len(consumption) if consumption else 0
        
        rates = data['consumption_rates']
        avg_rate = statistics.mean(rates) if rates else 0
        std_rate = statistics.stdev(rates) if len(rates) > 1 else 0
        
        waste_rates = data['waste_rates']
        avg_waste = statistics.mean(waste_rates) if waste_rates else 0
        
        # Detect trend
        if len(consumption) >= 7:
            first_half = statistics.mean([d['consumed'] for d in consumption[:len(consumption)//2]])
            second_half = statistics.mean([d['consumed'] for d in consumption[len(consumption)//2:]])
            if second_half > first_half * 1.1:
                trend = 'increasing'
            elif second_half < first_half * 0.9:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        # Detect anomaly (consumption rate deviates more than 2 standard deviations)
        anomalies = []
        if std_rate > 0:
            for d in consumption:
                rate = (d['consumed'] / d['portion'] * 100) if d['portion'] > 0 else 0
                if abs(rate - avg_rate) > 2 * std_rate:
                    anomalies.append({
                        'date': d['date'],
                        'rate': round(rate, 1),
                        'expected': round(avg_rate, 1)
                    })
        
        results.append({
            'animal_id': aid,
            'animal_name': data['name'],
            'species': data['species'],
            'total_consumed_kg': round(total_consumed / 1000, 2),
            'average_daily_kg': round(avg_daily / 1000, 2),
            'average_consumption_rate': round(avg_rate, 1),
            'waste_percentage': round(avg_waste, 2),
            'trend': trend,
            'anomalies': anomalies,
            'data_points': len(consumption)
        })
    
    return results

def detect_anomalies(severity_threshold: str = 'medium'):
    """
    Advanced anomaly detection using multiple detection methods.
    Returns detected anomalies with severity levels.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    anomalies = []
    today = datetime.now()
    
    # Method 1: Statistical outliers in consumption rates
    severity_scores = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
    min_score = severity_scores.get(severity_threshold, 1)
    
    # Get recent feeding data
    cursor.execute("""
        SELECT animal_id, name FROM animals
    """)
    animals = {row['animal_id']: row['name'] for row in cursor.fetchall()}
    
    # Check each animal's consumption patterns
    for animal_id, name in animals.items():
        cursor.execute("""
            SELECT 
                date(scheduled_time) as date,
                consumed_grams,
                portion_grams,
                status
            FROM feeding_logs
            WHERE animal_id = ? AND scheduled_time >= datetime('now', '-14 days')
            ORDER BY scheduled_time
        """, [animal_id])
        
        records = cursor.fetchall()
        if len(records) < 5:
            continue
        
        consumption_rates = [
            (r['date'], r['consumed_grams'] / r['portion_grams'] * 100 if r['portion_grams'] > 0 else 0)
            for r in records if r['status'] != 'missed'
        ]
        
        if len(consumption_rates) < 3:
            continue
        
        rates = [r[1] for r in consumption_rates]
        mean_rate = statistics.mean(rates)
        std_rate = statistics.stdev(rates) if len(rates) > 1 else 0
        
        for date, rate in consumption_rates:
            if std_rate > 0:
                deviation = abs(rate - mean_rate) / std_rate
                if deviation > 2:
                    severity = 'critical' if deviation > 3 else 'high' if deviation > 2.5 else 'medium'
                    if severity_scores[severity] >= min_score:
                        anomalies.append({
                            'animal_id': animal_id,
                            'animal_name': name,
                            'alert_type': 'reduced_consumption',
                            'severity': severity,
                            'message': f"{name} consumed only {rate:.0f}% of portion on {date} (avg: {mean_rate:.0f}%)",
                            'date': date,
                            'deviation': round(deviation, 2)
                        })
    
    # Method 2: Missed feeding patterns
    cursor.execute("""
        SELECT animal_id, name, COUNT(*) as missed_count
        FROM feeding_logs
        JOIN animals ON feeding_logs.animal_id = animals.id
        WHERE status = 'missed' AND scheduled_time >= datetime('now', '-7 days')
        GROUP BY animal_id
        HAVING missed_count >= 2
    """)
    
    for row in cursor.fetchall():
        anomalies.append({
            'animal_id': row['animal_id'],
            'animal_name': row['name'],
            'alert_type': 'missed_feeding',
            'severity': 'high' if row['missed_count'] >= 3 else 'medium',
            'message': f"{row['name']} missed {row['missed_count']} feedings in the past 7 days",
            'date': today.date().isoformat()
        })
    
    # Method 3: Waste spike detection
    cursor.execute("""
        SELECT 
            animal_id,
            name,
            date(scheduled_time) as date,
            SUM(portion_wasted_grams) * 100.0 / SUM(portion_grams) as waste_rate
        FROM feeding_logs
        JOIN animals ON feeding_logs.animal_id = animals.id
        WHERE scheduled_time >= datetime('now', '-7 days') AND status != 'missed'
        GROUP BY animal_id, date(scheduled_time)
    """)
    
    waste_rates = [(r['animal_id'], r['name'], r['date'], r['waste_rate']) for r in cursor.fetchall()]
    if waste_rates:
        overall_avg = statistics.mean([r[3] for r in waste_rates])
        overall_std = statistics.stdev([r[3] for r in waste_rates]) if len(waste_rates) > 1 else 0
        
        for animal_id, name, date, rate in waste_rates:
            if overall_std > 0 and rate > overall_avg + 2 * overall_std and rate > 10:
                anomalies.append({
                    'animal_id': animal_id,
                    'animal_name': name,
                    'alert_type': 'waste_spike',
                    'severity': 'medium',
                    'message': f"{name} waste rate spiked to {rate:.1f}% on {date} (avg: {overall_avg:.1f}%)",
                    'date': date
                })
    
    # Method 4: Low stock warnings with time projection
    cursor.execute("""
        SELECT 
            fs.id,
            fs.food_type_id,
            ft.name as food_name,
            fs.quantity_kg,
            fs.min_threshold_kg
        FROM food_stock fs
        JOIN food_types ft ON fs.food_type_id = ft.id
        WHERE fs.quantity_kg <= fs.min_threshold_kg * 1.5
    """)
    
    for row in cursor.fetchall():
        # Calculate daily consumption rate
        cursor.execute("""
            SELECT SUM(consumed_grams) / 1000.0 as daily_kg
            FROM feeding_logs
            WHERE food_type_id = ? AND scheduled_time >= datetime('now', '-7 days')
        """, [row['food_type_id']])
        daily_usage = cursor.fetchone()['daily_kg'] or 0
        
        if daily_usage > 0:
            days_remaining = row['quantity_kg'] / daily_usage
            if days_remaining < 7:
                severity = 'critical' if days_remaining < 2 else 'high' if days_remaining < 4 else 'medium'
                anomalies.append({
                    'animal_id': None,
                    'animal_name': None,
                    'alert_type': 'low_stock',
                    'severity': severity,
                    'message': f"Stock Alert: {row['food_name']} has {days_remaining:.1f} days remaining ({row['quantity_kg']:.1f}kg) based on current consumption",
                    'date': today.date().isoformat()
                })
    
    # Method 5: Expiration warnings
    cursor.execute("""
        SELECT 
            fs.food_type_id,
            ft.name as food_name,
            fs.quantity_kg,
            fs.expiration_date
        FROM food_stock fs
        JOIN food_types ft ON fs.food_type_id = ft.id
        WHERE fs.expiration_date IS NOT NULL
    """)
    
    for row in cursor.fetchall():
        exp_date = datetime.strptime(row['expiration_date'], '%Y-%m-%d')
        days_until = (exp_date - today).days
        if 0 < days_until <= 7:
            severity = 'critical' if days_until <= 2 else 'high' if days_until <= 4 else 'medium'
            anomalies.append({
                'animal_id': None,
                'animal_name': None,
                'alert_type': 'expiration_warning',
                'severity': severity,
                'message': f"Expiration Alert: {row['food_name']} expires in {days_until} days ({row['quantity_kg']:.1f}kg remaining)",
                'date': today.date().isoformat()
            })
        elif days_until <= 0:
            anomalies.append({
                'animal_id': None,
                'animal_name': None,
                'alert_type': 'expiration_warning',
                'severity': 'critical',
                'message': f"EXPIRED: {row['food_name']} has expired ({row['quantity_kg']:.1f}kg) - remove from inventory",
                'date': today.date().isoformat()
            })
    
    conn.close()
    return sorted(anomalies, key=lambda x: severity_scores.get(x['severity'], 0), reverse=True)

def forecast_stock_needs(days: int = 14):
    """
    Forecast food stock requirements using linear regression and
    seasonal adjustment based on historical consumption patterns.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get current stock levels
    cursor.execute("""
        SELECT 
            fs.*,
            ft.name as food_name,
            ft.unit_cost,
            ft.unit
        FROM food_stock fs
        JOIN food_types ft ON fs.food_type_id = ft.id
    """)
    stock_levels = {row['food_type_id']: dict(row) for row in cursor.fetchall()}
    
    # Get historical consumption (last 30 days for trend analysis)
    cursor.execute("""
        SELECT 
            food_type_id,
            date(scheduled_time) as date,
            SUM(consumed_grams) / 1000.0 as daily_consumed_kg
        FROM feeding_logs
        WHERE scheduled_time >= datetime('now', '-30 days')
        GROUP BY food_type_id, date(scheduled_time)
        ORDER BY date
    """)
    
    historical = defaultdict(list)
    for row in cursor.fetchall():
        historical[row['food_type_id']].append({
            'date': row['date'],
            'consumed': row['daily_consumed_kg']
        })
    
    # Calculate forecasts using multiple methods
    forecasts = []
    for food_type_id, stock in stock_levels.items():
        consumption_history = historical.get(food_type_id, [])
        
        if not consumption_history:
            # No consumption data - use current stock without forecast
            forecasts.append({
                'food_type_id': food_type_id,
                'food_name': stock['food_name'],
                'current_stock_kg': round(stock['quantity_kg'], 2),
                'projected_daily_usage_kg': 0,
                'days_until_empty': 999,
                'recommended_order_kg': 0,
                'estimated_cost': 0,
                'confidence': 'low',
                'method': 'no_data',
                'notes': 'No consumption data available for forecasting'
            })
            continue
        
        # Method 1: Simple moving average
        recent_consumption = [d['consumed'] for d in consumption_history[-7:]]
        avg_daily = statistics.mean(recent_consumption) if recent_consumption else 0
        
        # Method 2: Linear trend adjustment
        if len(consumption_history) >= 7:
            weekly_avg_current = statistics.mean([d['consumed'] for d in consumption_history[-7:]])
            weekly_avg_previous = statistics.mean([d['consumed'] for d in consumption_history[-14:-7]]) if len(consumption_history) >= 14 else weekly_avg_current
            trend_factor = weekly_avg_current / weekly_avg_previous if weekly_avg_previous > 0 else 1
            adjusted_daily = avg_daily * (trend_factor ** 0.5)  # Dampened trend
        else:
            adjusted_daily = avg_daily
        
        # Calculate days until empty
        current_stock = stock['quantity_kg']
        days_until_empty = adjusted_daily > 0 and current_stock / adjusted_daily or 999
        
        # Seasonal adjustment (simplified - check if consumption is increasing/decreasing)
        seasonal_factor = 1.0
        if len(consumption_history) >= 14:
            first_week = statistics.mean([d['consumed'] for d in consumption_history[:7]])
            last_week = statistics.mean([d['consumed'] for d in consumption_history[-7:]])
            if last_week > first_week * 1.15:
                seasonal_factor = 1.1  # Increasing consumption
            elif last_week < first_week * 0.85:
                seasonal_factor = 0.9  # Decreasing consumption
        
        final_daily_usage = adjusted_daily * seasonal_factor
        recommended_order = final_daily_usage * days
        estimated_cost = recommended_order * stock['unit_cost']
        
        # Confidence scoring
        confidence = 'high' if len(consumption_history) >= 21 else 'medium' if len(consumption_history) >= 14 else 'low'
        
        # Determine status
        status = 'ok'
        if days_until_empty < 3:
            status = 'critical'
        elif days_until_empty < 7:
            status = 'urgent'
        elif days_until_empty < 14:
            status = 'low'
        
        forecasts.append({
            'food_type_id': food_type_id,
            'food_name': stock['food_name'],
            'current_stock_kg': round(current_stock, 2),
            'projected_daily_usage_kg': round(final_daily_usage, 2),
            'days_until_empty': round(days_until_empty, 1) if days_until_empty < 999 else 999,
            'recommended_order_kg': round(recommended_order, 2),
            'estimated_cost': round(estimated_cost, 2),
            'confidence': confidence,
            'method': 'trend_adjusted',
            'status': status,
            'seasonal_factor': round(seasonal_factor, 2),
            'data_points': len(consumption_history)
        })
    
    conn.close()
    return forecasts

def generate_cost_analysis(start_date: str = None, end_date: str = None):
    """
    Generate comprehensive cost analysis report.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    # Daily cost breakdown
    cursor.execute("""
        SELECT 
            date(fl.scheduled_time) as date,
            ft.category,
            SUM(fl.consumed_grams * ft.unit_cost / 1000) as cost,
            SUM(fl.consumed_grams) / 1000.0 as consumed_kg
        FROM feeding_logs fl
        JOIN food_types ft ON fl.food_type_id = ft.id
        WHERE date(fl.scheduled_time) BETWEEN ? AND ?
        GROUP BY date(fl.scheduled_time), ft.category
        ORDER BY date, ft.category
    """, [start_date, end_date])
    
    daily_by_category = defaultdict(lambda: {'cost': 0, 'consumed_kg': 0})
    dates = set()
    
    for row in cursor.fetchall():
        daily_by_category[(row['date'], row['category'])] = {
            'cost': row['cost'],
            'consumed_kg': row['consumed_kg']
        }
        dates.add(row['date'])
    
    # Summary by food type
    cursor.execute("""
        SELECT 
            ft.id as food_type_id,
            ft.name as food_name,
            ft.category,
            SUM(fl.consumed_grams) / 1000.0 as total_consumed_kg,
            SUM(fl.consumed_grams * ft.unit_cost / 1000) as total_cost
        FROM feeding_logs fl
        JOIN food_types ft ON fl.food_type_id = ft.id
        WHERE date(fl.scheduled_time) BETWEEN ? AND ?
        GROUP BY ft.id
        ORDER BY total_cost DESC
    """, [start_date, end_date])
    
    by_food_type = [dict(row) for row in cursor.fetchall()]
    
    # Overall summary
    cursor.execute("""
        SELECT 
            SUM(fl.consumed_grams) / 1000.0 as total_consumed_kg,
            SUM(fl.consumed_grams * ft.unit_cost / 1000) as total_cost,
            SUM(fl.portion_wasted_grams) / 1000.0 as total_wasted_kg,
            COUNT(DISTINCT fl.animal_id) as animals_fed,
            COUNT(*) as total_feedings
        FROM feeding_logs fl
        JOIN food_types ft ON fl.food_type_id = ft.id
        WHERE date(fl.scheduled_time) BETWEEN ? AND ?
    """, [start_date, end_date])
    
    summary = dict(cursor.fetchone())
    
    # Calculate waste cost
    cursor.execute("""
        SELECT SUM(ft.unit_cost * quantity_kg) as waste_cost
        FROM food_transactions
        JOIN food_types ft ON food_transactions.food_type_id = ft.id
        WHERE transaction_type = 'waste' AND created_at BETWEEN ? AND ?
    """, [start_date, end_date])
    
    waste = cursor.fetchone()
    summary['waste_cost'] = waste['waste_cost'] if waste else 0
    
    conn.close()
    
    return {
        'period': {'start': start_date, 'end': end_date},
        'summary': {
            'total_consumed_kg': round(summary['total_consumed_kg'] or 0, 2),
            'total_cost': round(summary['total_cost'] or 0, 2),
            'total_wasted_kg': round(summary['total_wasted_kg'] or 0, 2),
            'waste_cost': round(summary['waste_cost'] or 0, 2),
            'animals_fed': summary['animals_fed'] or 0,
            'total_feedings': summary['total_feedings'] or 0,
            'cost_per_animal': round((summary['total_cost'] or 0) / (summary['animals_fed'] or 1), 2)
        },
        'by_food_type': [{**f, 'total_consumed_kg': round(f['total_consumed_kg'], 2), 'total_cost': round(f['total_cost'], 2)} for f in by_food_type]
    }

def run_full_analysis():
    """Run all analysis functions and return comprehensive report."""
    return {
        'generated_at': datetime.now().isoformat(),
        'consumption_patterns': analyze_consumption_patterns(days=30),
        'anomalies': detect_anomalies(),
        'stock_forecast': forecast_stock_needs(days=14),
        'cost_analysis': generate_cost_analysis()
    }

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'consumption':
            animal_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
            days = int(sys.argv[3]) if len(sys.argv) > 3 else 30
            result = analyze_consumption_patterns(animal_id, days)
            print(json.dumps(result, indent=2))
        
        elif command == 'anomalies':
            threshold = sys.argv[2] if len(sys.argv) > 2 else 'medium'
            result = detect_anomalies(threshold)
            print(json.dumps(result, indent=2))
        
        elif command == 'forecast':
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 14
            result = forecast_stock_needs(days)
            print(json.dumps(result, indent=2))
        
        elif command == 'cost':
            start = sys.argv[2] if len(sys.argv) > 2 else None
            end = sys.argv[3] if len(sys.argv) > 3 else None
            result = generate_cost_analysis(start, end)
            print(json.dumps(result, indent=2))
        
        elif command == 'full':
            result = run_full_analysis()
            print(json.dumps(result, indent=2))
        
        else:
            print(f"Unknown command: {command}")
            print("Usage: python analytics.py [consumption|anomalies|forecast|cost|full]")
    else:
        # Default: run full analysis
        result = run_full_analysis()
        print(json.dumps(result, indent=2))