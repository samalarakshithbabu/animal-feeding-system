import { useEffect, useState } from 'react';
import { stockAPI, foodTypesAPI } from '../services/api';
import { Package, AlertTriangle, Truck, TrendingDown, DollarSign, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import clsx from 'clsx';

const CATEGORY_COLORS: Record<string, string> = {
  meat: '#ef4444',
  vegetable: '#22c55e',
  fruit: '#f59e0b',
  grain: '#8b5cf6',
  supplement: '#3b82f6',
  live: '#ec4899'
};

export default function Food() {
  const [stock, setStock] = useState<any[]>([]);
  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');
  const [showRestock, setShowRestock] = useState(false);
  const [restockData, setRestockData] = useState({ food_type_id: '', quantity_kg: 0, supplier: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [stockRes, foodsRes, txRes] = await Promise.all([
        stockAPI.getAll(),
        foodTypesAPI.getAll(),
        stockAPI.getTransactions({})
      ]);
      setStock(stockRes);
      setFoodTypes(foodsRes);
      setTransactions(txRes.slice(0, 50));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    try {
      await stockAPI.restock(restockData);
      setShowRestock(false);
      setRestockData({ food_type_id: '', quantity_kg: 0, supplier: '' });
      loadData();
    } catch (error) {
      alert('Failed to restock');
    }
  }

  const lowStock = stock.filter(s => s.quantity_kg <= s.min_threshold_kg);
  const totalValue = stock.reduce((sum, s) => sum + s.quantity_kg * s.unit_cost, 0);

  const categoryData = Object.entries(
    stock.reduce((acc, s) => {
      const cat = s.category || 'other';
      acc[cat] = (acc[cat] || 0) + s.quantity_kg;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

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
          <h1 className="text-2xl font-bold text-gray-900">Food Inventory</h1>
          <p className="text-gray-500 mt-1">Track stock levels, waste, and transactions</p>
        </div>
        <button
          onClick={() => setShowRestock(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
        >
          <Truck className="w-5 h-5" />
          Restock
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stock.length}</p>
              <p className="text-sm text-gray-500">Item Types</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(0)}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{lowStock.length}</p>
              <p className="text-sm text-gray-500">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{transactions.filter(t => t.transaction_type === 'waste').length}</p>
              <p className="text-sm text-gray-500">Waste Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stock Levels Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Levels Overview</h3>
          <p className="text-sm text-gray-500 mb-6">Current inventory vs minimum threshold</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stock.map(s => ({
              name: s.food_name?.slice(0, 12),
              stock: s.quantity_kg,
              min: s.min_threshold_kg,
              category: s.category
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
                formatter={(value: number, name: string) => [`${value} kg`, name === 'stock' ? 'Current' : 'Min']}
              />
              <Bar dataKey="stock" fill="#22c55e" name="Current Stock" radius={[4, 4, 0, 0]} />
              <Bar dataKey="min" fill="#ef4444" name="Min Threshold" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">By Category</h3>
          <p className="text-sm text-gray-500 mb-6">Stock distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#6b7280' }}></div>
                <span className="text-xs text-gray-600 capitalize">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs max-w-md">
        <button
          onClick={() => setActiveTab('stock')}
          className={clsx('tab', activeTab === 'stock' && 'active')}
        >
          Current Stock
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={clsx('tab', activeTab === 'transactions' && 'active')}
        >
          Recent Transactions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}20` }}>
                          <Package className="w-5 h-5" style={{ color: CATEGORY_COLORS[item.category] }} />
                        </div>
                        <span className="font-medium text-gray-900">{item.food_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-3 py-1 rounded-lg text-xs font-medium capitalize" style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}20`, color: CATEGORY_COLORS[item.category] }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="font-semibold">{item.quantity_kg} kg</td>
                    <td className="text-gray-500">{item.min_threshold_kg} kg</td>
                    <td>
                      <span className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        item.quantity_kg <= item.min_threshold_kg * 0.5 ? 'badge-danger' :
                        item.quantity_kg <= item.min_threshold_kg ? 'badge-warning' :
                        'badge-success'
                      )}>
                        {item.quantity_kg <= item.min_threshold_kg ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td className="text-gray-500">{item.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Food</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm text-gray-900">{tx.created_at?.slice(0, 16)}</td>
                    <td className="font-medium">{tx.food_name}</td>
                    <td>
                      <span className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium capitalize',
                        tx.transaction_type === 'in' && 'badge-success',
                        tx.transaction_type === 'out' && 'badge-info',
                        tx.transaction_type === 'waste' && 'badge-danger',
                        tx.transaction_type === 'adjustment' && 'badge-neutral'
                      )}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="font-medium">{tx.quantity_kg} kg</td>
                    <td className="text-gray-500 text-sm">{tx.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="modal-overlay" onClick={() => setShowRestock(false)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Restock Inventory</h2>
              <button onClick={() => setShowRestock(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRestock} className="p-6 space-y-5">
              <div>
                <label className="label">Food Item</label>
                <select
                  required
                  value={restockData.food_type_id}
                  onChange={e => setRestockData({...restockData, food_type_id: e.target.value})}
                  className="select"
                >
                  <option value="">Select food</option>
                  {foodTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quantity (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={restockData.quantity_kg}
                  onChange={e => setRestockData({...restockData, quantity_kg: Number(e.target.value)})}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Supplier</label>
                <input
                  type="text"
                  value={restockData.supplier}
                  onChange={e => setRestockData({...restockData, supplier: e.target.value})}
                  className="input"
                  placeholder="e.g., Local Butcher"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowRestock(false)} className="flex-1 btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}