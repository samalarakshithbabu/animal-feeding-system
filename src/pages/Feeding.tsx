import { useEffect, useState } from 'react';
import { feedingLogsAPI, animalsAPI, foodTypesAPI } from '../services/api';
import { Check, X, Clock, FileText, Plus, Calendar, Target, X as XIcon } from 'lucide-react';
import clsx from 'clsx';

export default function Feeding() {
  const [logs, setLogs] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('today');
  const [formData, setFormData] = useState({
    animal_id: '', food_type_id: '', scheduled_time: '', portion_grams: 100,
    portion_wasted_grams: 0, consumed_grams: 100, notes: '', status: 'completed', staff_id: 1
  });

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    try {
      const params: any = {};
      if (filter === 'today') {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        params.start_date = today;
        params.end_date = today;
      } else if (filter === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        params.start_date = weekAgo;
      }
      const [logsRes, animalsRes, foodRes] = await Promise.all([
        feedingLogsAPI.getAll(params),
        animalsAPI.getAll(),
        foodTypesAPI.getAll()
      ]);
      setLogs(logsRes);
      setAnimals(animalsRes);
      setFoodTypes(foodRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await feedingLogsAPI.create(formData);
      setShowModal(false);
      setFormData({
        animal_id: '', food_type_id: '', scheduled_time: '', portion_grams: 100,
        portion_wasted_grams: 0, consumed_grams: 100, notes: '', status: 'completed', staff_id: 1
      });
      loadData();
    } catch (error) {
      alert('Failed to log feeding');
    }
  }

  function quickLog(log: any, status: 'completed' | 'partial' | 'missed') {
    setFormData({
      animal_id: log.animal_id,
      food_type_id: log.food_type_id,
      scheduled_time: log.scheduled_time.slice(0, 16),
      portion_grams: log.portion_grams,
      portion_wasted_grams: status === 'partial' ? Math.round(log.portion_grams * 0.3) : 0,
      consumed_grams: status === 'completed' ? log.portion_grams : status === 'partial' ? Math.round(log.portion_grams * 0.7) : 0,
      notes: '',
      status,
      staff_id: 1
    });
    setShowModal(true);
  }

  const stats = {
    completed: logs.filter(l => l.status === 'completed').length,
    partial: logs.filter(l => l.status === 'partial').length,
    missed: logs.filter(l => l.status === 'missed').length,
    total: logs.length
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Feeding Log</h1>
          <p className="text-gray-500 mt-1">Track and record all feeding activities</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
        >
          <Plus className="w-5 h-5" />
          Log Feeding
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Feedings</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.partial}</p>
              <p className="text-sm text-gray-500">Partial</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.missed}</p>
              <p className="text-sm text-gray-500">Missed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {['today', 'week', 'month'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx('tab', filter === f && 'active')}
          >
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Feedings Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Animal</th>
                <th>Food</th>
                <th>Portion</th>
                <th>Consumed</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-gray-900">{log.scheduled_time.slice(0, 10)}</p>
                      <p className="text-sm text-gray-500">{log.scheduled_time.slice(11, 16)}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {log.animal_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{log.animal_name}</p>
                        <p className="text-sm text-gray-500">{log.species}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                      {log.food_name}
                    </span>
                  </td>
                  <td className="font-medium">{log.portion_grams}g</td>
                  <td>
                    <div>
                      <p className={clsx(
                        'font-medium',
                        log.status === 'missed' ? 'text-gray-400' :
                        log.consumed_grams / log.portion_grams < 0.7 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {log.status === 'missed' ? '-' : `${log.consumed_grams}g`}
                      </p>
                      {log.portion_wasted_grams > 0 && (
                        <p className="text-xs text-gray-500">Waste: {log.portion_wasted_grams}g</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium capitalize',
                      log.status === 'completed' && 'bg-green-100 text-green-700',
                      log.status === 'partial' && 'bg-yellow-100 text-yellow-700',
                      log.status === 'missed' && 'bg-red-100 text-red-700',
                      log.status === 'skipped' && 'bg-gray-100 text-gray-700'
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="text-right">
                    {log.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => quickLog(log, 'completed')}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Complete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => quickLog(log, 'partial')}
                          className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                          title="Partial"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => quickLog(log, 'missed')}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Missed"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {log.notes && (
                      <button className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors" title={log.notes}>
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium text-lg">No feeding logs found</p>
            <p className="text-gray-500 mt-1">Start by logging a feeding</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 btn btn-primary"
            >
              Log First Feeding
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Log Feeding</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Animal</label>
                  <select
                    required
                    value={formData.animal_id}
                    onChange={e => setFormData({...formData, animal_id: e.target.value})}
                    className="select"
                  >
                    <option value="">Select animal</option>
                    {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Food</label>
                  <select
                    required
                    value={formData.food_type_id}
                    onChange={e => setFormData({...formData, food_type_id: e.target.value})}
                    className="select"
                  >
                    <option value="">Select food</option>
                    {foodTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Scheduled Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_time}
                  onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Portion (g)</label>
                  <input
                    type="number"
                    required
                    value={formData.portion_grams}
                    onChange={e => setFormData({...formData, portion_grams: Number(e.target.value)})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Consumed (g)</label>
                  <input
                    type="number"
                    required
                    value={formData.consumed_grams}
                    onChange={e => setFormData({...formData, consumed_grams: Number(e.target.value)})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Wasted (g)</label>
                  <input
                    type="number"
                    value={formData.portion_wasted_grams}
                    onChange={e => setFormData({...formData, portion_wasted_grams: Number(e.target.value)})}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="select"
                >
                  <option value="completed">Completed</option>
                  <option value="partial">Partial</option>
                  <option value="missed">Missed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="input"
                  rows={3}
                  placeholder="Optional observations..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}