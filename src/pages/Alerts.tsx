import { useEffect, useState } from 'react';
import { alertsAPI } from '../services/api';
import { Bell, AlertTriangle, CheckCircle, Clock, Package, Trash2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  useEffect(() => { loadAlerts(); }, [filter]);

  async function loadAlerts() {
    try {
      const data = await alertsAPI.getAll({ acknowledged: filter === 'active' ? false : filter === 'acknowledged' ? true : undefined });
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(id: number) {
    try {
      await alertsAPI.acknowledge(id);
      loadAlerts();
    } catch (error) {
      alert('Failed to acknowledge alert');
    }
  }

  async function generateAlerts() {
    try {
      await alertsAPI.generate();
      loadAlerts();
    } catch (error) {
      alert('Failed to generate alerts');
    }
  }

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedAlerts = [...alerts].sort((a, b) => (severityOrder[a.severity] || 0) - (severityOrder[b.severity] || 0));

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
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
          <h1 className="text-2xl font-bold text-gray-900">Anomaly Alerts</h1>
          <p className="text-gray-500 mt-1">AI-detected issues and warnings</p>
        </div>
        <button
          onClick={generateAlerts}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
        >
          <RefreshCw className="w-5 h-5" />
          Scan for Alerts
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.high}</p>
              <p className="text-sm text-gray-500">High</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.medium}</p>
              <p className="text-sm text-gray-500">Medium</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.low}</p>
              <p className="text-sm text-gray-500">Low</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {[
          { key: 'active', label: 'Active' },
          { key: 'acknowledged', label: 'Acknowledged' },
          { key: 'all', label: 'All' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={clsx('tab', filter === tab.key && 'active')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {sortedAlerts.map(alert => (
          <div
            key={alert.id}
            className={clsx(
              'card p-5 border-l-4 transition-all hover:shadow-lg',
              alert.severity === 'critical' && 'border-l-red-500',
              alert.severity === 'high' && 'border-l-orange-500',
              alert.severity === 'medium' && 'border-l-yellow-500',
              alert.severity === 'low' && 'border-l-blue-500',
              alert.is_acknowledged && 'opacity-60'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={clsx(
                  'p-3 rounded-xl',
                  alert.severity === 'critical' && 'bg-red-50',
                  alert.severity === 'high' && 'bg-orange-50',
                  alert.severity === 'medium' && 'bg-yellow-50',
                  alert.severity === 'low' && 'bg-blue-50'
                )}>
                  {alert.alert_type === 'low_stock' && (
                    <Package className={clsx('w-6 h-6',
                      alert.severity === 'critical' && 'text-red-600',
                      alert.severity === 'high' && 'text-orange-600'
                    )} />
                  )}
                  {alert.alert_type === 'missed_feeding' && (
                    <Clock className={clsx('w-6 h-6',
                      alert.severity === 'critical' && 'text-red-600',
                      alert.severity === 'high' && 'text-orange-600'
                    )} />
                  )}
                  {(alert.alert_type === 'reduced_consumption' || alert.alert_type === 'waste_spike') && (
                    <Trash2 className={clsx('w-6 h-6',
                      alert.severity === 'critical' && 'text-red-600',
                      alert.severity === 'high' && 'text-orange-600'
                    )} />
                  )}
                  {alert.alert_type === 'expiration_warning' && (
                    <AlertTriangle className={clsx('w-6 h-6',
                      alert.severity === 'critical' && 'text-red-600',
                      alert.severity === 'high' && 'text-orange-600'
                    )} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </h3>
                    <span className={clsx(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      alert.severity === 'critical' && 'bg-red-100 text-red-700',
                      alert.severity === 'high' && 'bg-orange-100 text-orange-700',
                      alert.severity === 'medium' && 'bg-yellow-100 text-yellow-700',
                      alert.severity === 'low' && 'bg-blue-100 text-blue-700'
                    )}>
                      {alert.severity}
                    </span>
                    {alert.is_acknowledged && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" /> Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{alert.message}</p>
                  <p className="text-sm text-gray-400 mt-2">{alert.created_at?.slice(0, 16)}</p>
                </div>
              </div>
              {!alert.is_acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-gray-900 font-medium text-lg">All Clear!</p>
            <p className="text-gray-500 mt-1">No alerts found</p>
          </div>
        )}
      </div>
    </div>
  );
}