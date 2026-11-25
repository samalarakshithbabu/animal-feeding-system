import { useEffect, useState } from 'react';
import { schedulesAPI, animalsAPI, foodTypesAPI } from '../services/api';
import { Plus, Clock, Trash2, Calendar, Utensils, X } from 'lucide-react';

export default function Schedule() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    animal_id: '', food_type_id: '', scheduled_time: '08:00', portion_grams: 100, frequency: 'daily'
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [schedulesRes, animalsRes, foodRes] = await Promise.all([
        schedulesAPI.getAll({ active_only: true }),
        animalsAPI.getAll(),
        foodTypesAPI.getAll()
      ]);
      setSchedules(schedulesRes);
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
      await schedulesAPI.create(formData);
      setShowModal(false);
      setFormData({ animal_id: '', food_type_id: '', scheduled_time: '08:00', portion_grams: 100, frequency: 'daily' });
      loadData();
    } catch (error) {
      alert('Failed to create schedule');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await schedulesAPI.delete(id);
      loadData();
    } catch (error) {
      alert('Failed to delete');
    }
  }

  const timeSlots = [...new Set(schedules.map(s => s.scheduled_time))].sort();

  const stats = {
    total: schedules.length,
    animals: [...new Set(schedules.map(s => s.animal_id))].length,
    daily: schedules.filter(s => s.frequency === 'daily').length,
    twiceDaily: schedules.filter(s => s.frequency === 'twice_daily').length,
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
          <h1 className="text-2xl font-bold text-gray-900">Feeding Schedules</h1>
          <p className="text-gray-500 mt-1">Manage daily feeding routines</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
        >
          <Plus className="w-5 h-5" />
          Add Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Schedules</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Utensils className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.animals}</p>
              <p className="text-sm text-gray-500">Animals Fed</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.daily}</p>
              <p className="text-sm text-gray-500">Daily</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.twiceDaily}</p>
              <p className="text-sm text-gray-500">Twice Daily</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule by Time */}
      <div className="space-y-4">
        {timeSlots.map(time => {
          const slotSchedules = schedules.filter(s => s.scheduled_time === time);
          return (
            <div key={time} className="card overflow-hidden">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-xl font-bold">{time}</h3>
                  <p className="text-primary-100 text-sm">{slotSchedules.length} feeding{slotSchedules.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slotSchedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                            {schedule.animal_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{schedule.animal_name}</p>
                            <p className="text-sm text-gray-500">{schedule.species}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                            {schedule.food_name}
                          </span>
                          <span className="text-sm text-gray-500">{schedule.portion_grams}g</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 capitalize">
                          {schedule.frequency.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {schedules.length === 0 && (
          <div className="text-center py-16 card">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium text-lg">No active schedules</p>
            <p className="text-gray-500 mt-1">Create your first feeding schedule</p>
            <button onClick={() => setShowModal(true)} className="mt-4 btn btn-primary">
              Create Schedule
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Feeding Schedule</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="label">Animal</label>
                <select
                  required
                  value={formData.animal_id}
                  onChange={e => setFormData({...formData, animal_id: e.target.value})}
                  className="select"
                >
                  <option value="">Select animal</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Food Type</label>
                <select
                  required
                  value={formData.food_type_id}
                  onChange={e => setFormData({...formData, food_type_id: e.target.value})}
                  className="select"
                >
                  <option value="">Select food</option>
                  {foodTypes.map(f => <option key={f.id} value={f.id}>{f.name} ({f.category})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.scheduled_time}
                    onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
                    className="input"
                  />
                </div>
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
              </div>
              <div>
                <label className="label">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                  className="select"
                >
                  <option value="daily">Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}