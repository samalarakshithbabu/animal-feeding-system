import { useEffect, useState } from 'react';
import { animalsAPI } from '../services/api';
import { Plus, Search, Edit, PawPrint, X } from 'lucide-react';
import clsx from 'clsx';

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  ill: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  quarantine: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  recovering: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
};

export default function AnimalList() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', species: '', age_months: 0, weight_kg: 0, status: 'healthy', feeding_zone: ''
  });

  useEffect(() => { loadAnimals(); }, []);

  async function loadAnimals() {
    try {
      const data = await animalsAPI.getAll();
      setAnimals(data);
    } catch (error) {
      console.error('Failed to load animals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await animalsAPI.update(editing.id, formData);
      } else {
        await animalsAPI.create(formData);
      }
      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', species: '', age_months: 0, weight_kg: 0, status: 'healthy', feeding_zone: '' });
      loadAnimals();
    } catch (error) {
      alert('Failed to save animal');
    }
  }

  function startEdit(animal: any) {
    setEditing(animal);
    setFormData({ ...animal });
    setShowModal(true);
  }

  const filtered = animals.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.species.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: animals.length,
    healthy: animals.filter(a => a.status === 'healthy').length,
    underCare: animals.filter(a => a.status === 'ill' || a.status === 'recovering').length,
    zones: [...new Set(animals.map(a => a.feeding_zone))].length,
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
          <h1 className="text-2xl font-bold text-gray-900">Animals</h1>
          <p className="text-gray-500 mt-1">Manage animal profiles and feeding zones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
        >
          <Plus className="w-5 h-5" />
          Add Animal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <PawPrint className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Animals</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.healthy}</p>
              <p className="text-sm text-gray-500">Healthy</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.underCare}</p>
              <p className="text-sm text-gray-500">Under Care</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.zones}</p>
              <p className="text-sm text-gray-500">Feeding Zones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search animals by name or species..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Animals Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(animal => (
          <div
            key={animal.id}
            className="card p-5 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => startEdit(animal)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                  animal.status === 'healthy' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  animal.status === 'ill' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                  animal.status === 'quarantine' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                  'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  {animal.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{animal.name}</p>
                  <p className="text-sm text-gray-500">{animal.species}</p>
                </div>
              </div>
              <span className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                statusColors[animal.status]?.bg,
                statusColors[animal.status]?.text
              )}>
                {animal.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Age</p>
                <p className="font-medium text-gray-900">{animal.age_months} mo</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Weight</p>
                <p className="font-medium text-gray-900">{animal.weight_kg} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Zone</p>
                <p className="font-medium text-gray-900">{animal.feeding_zone}</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(animal); }}
                className="p-2 bg-white shadow-md rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 card">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium text-lg">No animals found</p>
          <p className="text-gray-500 mt-1">Try adjusting your search</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Animal' : 'Add New Animal'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditing(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input"
                  placeholder="e.g., Simba"
                />
              </div>
              <div>
                <label className="label">Species</label>
                <input
                  type="text"
                  required
                  value={formData.species}
                  onChange={e => setFormData({...formData, species: e.target.value})}
                  className="input"
                  placeholder="e.g., Lion"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Age (months)</label>
                  <input
                    type="number"
                    value={formData.age_months}
                    onChange={e => setFormData({...formData, age_months: Number(e.target.value)})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Feeding Zone</label>
                <input
                  type="text"
                  required
                  value={formData.feeding_zone}
                  onChange={e => setFormData({...formData, feeding_zone: e.target.value})}
                  className="input"
                  placeholder="e.g., Zone A"
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="select"
                >
                  <option value="healthy">Healthy</option>
                  <option value="ill">Ill</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="recovering">Recovering</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null); }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editing ? 'Update' : 'Add Animal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}