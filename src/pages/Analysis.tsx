import { useEffect, useState } from 'react';
import { analysisAPI } from '../services/api';
import { TrendingUp, TrendingDown, AlertTriangle, Package, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  urgent: 'bg-orange-500',
  low: 'bg-yellow-500',
  ok: 'bg-green-500'
};

export default function Analysis() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [forecastRes, trendsRes] = await Promise.all([
        analysisAPI.getForecast(),
        analysisAPI.getTrends(14)
      ]);
      setForecast(forecastRes);
      setTrends(trendsRes.map(t => ({ ...t, date: t.date.slice(5) })));
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const urgentItems = forecast.filter(f => f.status === 'critical' || f.status === 'urgent');
  const totalOrderCost = urgentItems.reduce((sum, f) => sum + f.estimated_cost, 0);

  const stats = {
    total: forecast.length,
    needReorder: forecast.filter(f => f.days_until_empty < 14).length,
    dailyUsage: forecast.reduce((s, f) => s + f.projected_daily_usage_kg, 0),
    reorderCost: totalOrderCost
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Forecast</h1>
          <p className="text-gray-500 mt-1">AI-powered predictions and inventory optimization</p>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentItems.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Urgent Stock Alerts</h3>
              <p className="text-red-100 text-sm">{urgentItems.length} items need immediate attention</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentItems.slice(0, 6).map(item => (
              <div key={item.food_type_id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.food_name}</span>
                  <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                    {item.status}
                  </span>
                </div>
                <div className="text-sm text-red-100 space-y-1">
                  <p>Stock: {item.current_stock_kg} kg</p>
                  <p>Daily use: {item.projected_daily_usage_kg} kg</p>
                  <p className="font-medium text-white">Empty in {item.days_until_empty} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Tracked Items</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.needReorder}</p>
              <p className="text-sm text-gray-500">Need Reorder</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.dailyUsage.toFixed(1)} kg</p>
              <p className="text-sm text-gray-500">Daily Usage</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.reorderCost.toFixed(0)}</p>
              <p className="text-sm text-gray-500">Reorder Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Days Until Stockout */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Days Until Stockout</h3>
          <p className="text-sm text-gray-500 mb-6">Stock duration based on consumption</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={forecast.map(f => ({
              name: f.food_name?.slice(0, 12),
              days: f.days_until_empty > 30 ? 30 : f.days_until_empty,
              status: f.status
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [value >= 30 ? '30+ days' : `${value} days`, 'Days Left']}
              />
              <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                {forecast.map((entry, index) => (
                  <rect key={`bar-${index}`} fill={
                    entry.status === 'critical' ? '#ef4444' :
                    entry.status === 'urgent' ? '#f97316' :
                    entry.status === 'low' ? '#eab308' : '#22c55e'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Consumption Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Consumption Trend</h3>
          <p className="text-sm text-gray-500 mb-6">Daily consumption over time</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value} kg`, '']}
              />
              <Line type="monotone" dataKey="total_consumed_kg" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Consumed" />
              <Line type="monotone" dataKey="total_wasted_kg" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Wasted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Stock Forecast</h3>
          <p className="text-sm text-gray-500">14-day projection with recommendations</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Food</th>
                <th>Current Stock</th>
                <th>Daily Usage</th>
                <th>Days Left</th>
                <th>Order Amount</th>
                <th>Est. Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecast.map(item => (
                <tr key={item.food_type_id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${STATUS_COLORS[item.status]}`}></div>
                      <span className="font-medium text-gray-900">{item.food_name}</span>
                    </div>
                  </td>
                  <td className="font-medium">{item.current_stock_kg} kg</td>
                  <td>{item.projected_daily_usage_kg} kg</td>
                  <td>
                    <span className={clsx(
                      'font-medium',
                      item.days_until_empty < 7 ? 'text-red-600' :
                      item.days_until_empty < 14 ? 'text-orange-600' : 'text-gray-900'
                    )}>
                      {item.days_until_empty >= 999 ? '∞' : item.days_until_empty}
                    </span>
                  </td>
                  <td className="font-medium">{item.recommended_order_kg} kg</td>
                  <td className="text-green-600 font-medium">${item.estimated_cost}</td>
                  <td>
                    <span className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium capitalize',
                      item.status === 'critical' && 'bg-red-100 text-red-700',
                      item.status === 'urgent' && 'bg-orange-100 text-orange-700',
                      item.status === 'low' && 'bg-yellow-100 text-yellow-700',
                      item.status === 'ok' && 'bg-green-100 text-green-700'
                    )}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}