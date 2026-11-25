import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  TrendingDown,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';
import { dashboardAPI, feedingLogsAPI, alertsAPI, analysisAPI } from '../services/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

// COLORS not used in this file

export default function Welcome() {
  const [stats, setStats] = useState<any>(null);
  const [todayFeedings, setTodayFeedings] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, feedingsRes, trendsRes, alertsRes] = await Promise.all([
          dashboardAPI.getStats(),
          feedingLogsAPI.getToday(),
          analysisAPI.getTrends(14),
          alertsAPI.getAll({ acknowledged: false })
        ]);
        setStats(statsRes);
        setTodayFeedings(feedingsRes);
        setTrends(trendsRes.map(t => ({ ...t, date: t.date.slice(5) })));
        setAlerts(alertsRes.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const completionRate = stats && stats.active_schedules > 0
    ? Math.round((stats.today_completed / (stats.today_completed + stats.today_missed || 1)) * 100) || 0
    : 0;

  const statusData = [
    { name: 'Completed', value: stats?.today_completed || 0, color: '#22c55e' },
    { name: 'Missed', value: stats?.today_missed || 0, color: '#ef4444' },
  ];

  const quickStats = [
    {
      icon: Users,
      label: 'Total Animals',
      value: stats?.total_animals || 0,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: Calendar,
      label: 'Active Schedules',
      value: stats?.active_schedules || 0,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: DollarSign,
      label: 'Daily Cost',
      value: `$${(stats?.daily_cost || 0).toFixed(0)}`,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      icon: AlertTriangle,
      label: 'Active Alerts',
      value: stats?.alerts_count || 0,
      color: stats?.alerts_count > 0 ? 'from-orange-500 to-orange-600' : 'from-gray-400 to-gray-500',
      bgColor: stats?.alerts_count > 0 ? 'bg-orange-50' : 'bg-gray-50',
      textColor: stats?.alerts_count > 0 ? 'text-orange-600' : 'text-gray-600',
      alert: stats?.alerts_count > 0
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm font-medium">Welcome back!</p>
              <h1 className="text-3xl font-bold mt-1">Animal Feeding Dashboard</h1>
              <p className="text-primary-200 mt-2 opacity-90">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-sm text-primary-200">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="stat-card group cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor} transition-transform group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                {stat.alert && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl`}></div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Consumption Trends Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consumption Trends</h3>
              <p className="text-sm text-gray-500">Last 14 days overview</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <span className="text-gray-600">Consumed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Wasted</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="consumedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="wastedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value} kg`, '']}
              />
              <Area
                type="monotone"
                dataKey="total_consumed_kg"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#consumedGradient)"
                name="Consumed"
              />
              <Area
                type="monotone"
                dataKey="total_wasted_kg"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#wastedGradient)"
                name="Wasted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Progress Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Progress</h3>
          <p className="text-sm text-gray-500 mb-6">Feedings completion status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-4">
            <p className="text-4xl font-bold text-primary-600">{completionRate}%</p>
            <p className="text-sm text-gray-500">Completion Rate</p>
          </div>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">{stats?.today_completed || 0}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-red-600">{stats?.today_missed || 0}</p>
              <p className="text-xs text-gray-500">Missed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Feedings */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Feedings</h3>
                  <p className="text-sm text-gray-500">Recent feeding activities</p>
                </div>
              </div>
              <Link to="/feeding" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
            {todayFeedings.slice(0, 8).map((feeding: any) => (
              <div
                key={feeding.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    feeding.status === 'completed' ? 'bg-green-100 text-green-600' :
                    feeding.status === 'missed' ? 'bg-red-100 text-red-600' :
                    feeding.status === 'partial' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {feeding.status === 'completed' ? <Target className="w-5 h-5" /> :
                     feeding.status === 'missed' ? <TrendingDown className="w-5 h-5" /> :
                     <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{feeding.animal_name}</p>
                    <p className="text-sm text-gray-500">{feeding.food_name} • {feeding.scheduled_time.slice(11, 16)}</p>
                  </div>
                </div>
                <span className={`badge ${
                  feeding.status === 'completed' ? 'badge-success' :
                  feeding.status === 'missed' ? 'badge-danger' :
                  feeding.status === 'partial' ? 'badge-warning' :
                  'badge-neutral'
                }`}>
                  {feeding.status}
                </span>
              </div>
            ))}
            {todayFeedings.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No feedings recorded today</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                  <p className="text-sm text-gray-500">Issues requiring attention</p>
                </div>
              </div>
              <Link to="/alerts" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border-l-4 transition-all hover:shadow-md ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-red-100' :
                      alert.severity === 'high' ? 'bg-orange-100' :
                      alert.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'high' ? 'text-orange-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <span className={`badge text-xs ${
                    alert.severity === 'critical' ? 'badge-danger' :
                    alert.severity === 'high' ? 'badge-warning' :
                    alert.severity === 'medium' ? 'badge-info' :
                    'badge-neutral'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-gray-900 font-medium">All Clear!</p>
                <p className="text-sm text-gray-500 mt-1">No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
          <Activity className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold">{(stats?.today_completed || 0) + (stats?.today_missed || 0)}</p>
          <p className="text-sm text-primary-100 mt-1">Feedings Today</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold">{((stats?.today_completed || 0) * 0.5).toFixed(1)} kg</p>
          <p className="text-sm text-green-100 mt-1">Total Consumed</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
          <TrendingDown className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold">{(stats?.total_waste_kg || 0).toFixed(1)} kg</p>
          <p className="text-sm text-red-100 mt-1">Total Waste</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <AlertTriangle className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-2xl font-bold">{stats?.low_stock_items || 0}</p>
          <p className="text-sm text-orange-100 mt-1">Low Stock Items</p>
        </div>
      </div>
    </div>
  );
}