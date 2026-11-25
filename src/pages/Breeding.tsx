import { useEffect, useState } from 'react';
import { reportsAPI, analysisAPI } from '../services/api';
import { FileText, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Breeding() {
  const [report, setReport] = useState<any>(null);
  const [costByFood, setCostByFood] = useState<any[]>([]);
  const [consumption, setConsumption] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    setDateRange({ start, end });
    loadReport(start, end);
  }, []);

  async function loadReport(start?: string, end?: string) {
    setLoading(true);
    try {
      const s = start || dateRange.start;
      const e = end || dateRange.end;
      const [reportRes, costRes, consRes] = await Promise.all([
        reportsAPI.getFeedingReport(s, e),
        analysisAPI.getCost(7),
        analysisAPI.getConsumption(7)
      ]);
      setReport(reportRes);
      setCostByFood(costRes);
      setConsumption(consRes);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  const topConsumers = consumption
    .sort((a, b) => b.total_consumed_kg - a.total_consumed_kg)
    .slice(0, 5);

  // COLORS removed - not used

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Feeding analysis, consumption patterns, and cost tracking</p>
        </div>
        <button
          onClick={() => loadReport()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh Report
        </button>
      </div>

      {/* Date Range */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="input"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="input"
            />
          </div>
          <button onClick={() => loadReport()} className="btn btn-primary">
            Apply
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{report.total_feedings}</p>
                <p className="text-sm text-gray-500">Total Feedings</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{report.completion_rate}%</p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{report.total_consumed_kg} kg</p>
                <p className="text-sm text-gray-500">Total Consumed</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{report.total_wasted_kg} kg</p>
                <p className="text-sm text-gray-500">Total Waste</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${report.total_cost}</p>
                <p className="text-sm text-gray-500">Total Cost</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cost by Food Type */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost by Food Type</h3>
          <p className="text-sm text-gray-500 mb-6">Spending distribution across food categories</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costByFood.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="food_name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`$${value}`, 'Cost']}
              />
              <Bar dataKey="total_cost" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Consumers */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Consumers</h3>
          <p className="text-sm text-gray-500 mb-6">Animals with highest consumption</p>
          <div className="space-y-4">
            {topConsumers.map((animal, idx) => (
              <div key={animal.animal_id} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{animal.animal_name}</span>
                    <span className="text-sm text-gray-500">{animal.total_consumed_kg} kg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${(animal.total_consumed_kg / (topConsumers[0]?.total_consumed_kg || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Animal */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Consumption by Animal</h3>
            <p className="text-sm text-gray-500">Detailed breakdown per animal</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Consumed</th>
                  <th>Waste %</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report?.by_animal.map((a: any) => (
                  <tr key={a.animal_id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {a.animal_name?.charAt(0)}
                        </div>
                        <span className="font-medium">{a.animal_name}</span>
                      </div>
                    </td>
                    <td className="font-medium">{a.consumed_kg} kg</td>
                    <td>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        a.waste_percentage > 10 ? 'bg-red-100 text-red-700' :
                        a.waste_percentage > 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {a.waste_percentage}%
                      </span>
                    </td>
                    <td>
                      {a.trend === 'increasing' && <TrendingUp className="w-5 h-5 text-green-500" />}
                      {a.trend === 'decreasing' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      {a.trend === 'stable' && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Food Type */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Cost by Food Type</h3>
            <p className="text-sm text-gray-500">Spending breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Consumed</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report?.by_food_type.map((f: any) => (
                  <tr key={f.food_type_id} className="hover:bg-gray-50">
                    <td className="py-4 font-medium">{f.name}</td>
                    <td>{f.consumed_kg} kg</td>
                    <td className="text-green-600 font-medium">${f.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Waste Analysis */}
      {report && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Analysis</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-red-600">{report.total_wasted_kg} kg</p>
              <p className="text-gray-600 mt-1">Total Waste</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600">
                {report.total_consumed_kg > 0 ? (report.total_wasted_kg / report.total_consumed_kg * 100).toFixed(1) : 0}%
              </p>
              <p className="text-gray-600 mt-1">Waste Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">${(report.total_wasted_kg * 10).toFixed(0)}</p>
              <p className="text-gray-600 mt-1">Estimated Cost of Waste</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function clsx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}