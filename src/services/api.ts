const API_BASE = 'http://localhost:3001/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Animals
export const animalsAPI = {
  getAll: () => fetchAPI<any[]>('/animals'),
  getById: (id: number) => fetchAPI<any>(`/animals/${id}`),
  create: (data: any) => fetchAPI<any>('/animals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/animals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Food Types
export const foodTypesAPI = {
  getAll: () => fetchAPI<any[]>('/food-types'),
};

// Food Stock
export const stockAPI = {
  getAll: () => fetchAPI<any[]>('/food-stock'),
  getLow: () => fetchAPI<any[]>('/food-stock/low'),
  restock: (data: any) => fetchAPI<any>('/food-stock/restock', { method: 'POST', body: JSON.stringify(data) }),
  getTransactions: (params?: { food_type_id?: number; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any[]>(`/food-transactions${query ? `?${query}` : ''}`);
  },
};

// Schedules
export const schedulesAPI = {
  getAll: (params?: { animal_id?: number; active_only?: boolean }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any[]>(`/schedules${query ? `?${query}` : ''}`);
  },
  create: (data: any) => fetchAPI<any>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI<any>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI<any>(`/schedules/${id}`, { method: 'DELETE' }),
};

// Feeding Logs (Core)
export const feedingLogsAPI = {
  getAll: (params?: { animal_id?: number; start_date?: string; end_date?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any[]>(`/feeding-logs${query ? `?${query}` : ''}`);
  },
  getToday: () => fetchAPI<any[]>('/feeding-logs/today'),
  create: (data: any) => fetchAPI<any>('/feeding-logs', { method: 'POST', body: JSON.stringify(data) }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => fetchAPI<any>('/dashboard/stats'),
};

// Analysis
export const analysisAPI = {
  getConsumption: (days?: number) => fetchAPI<any[]>(`/analysis/consumption${days ? `?days=${days}` : ''}`),
  getTrends: (days?: number) => fetchAPI<any[]>(`/analysis/trends${days ? `?days=${days}` : ''}`),
  getCost: (days?: number) => fetchAPI<any[]>(`/analysis/cost${days ? `?days=${days}` : ''}`),
  getForecast: () => fetchAPI<any[]>('/analysis/forecast'),
};

// Alerts
export const alertsAPI = {
  getAll: (params?: { acknowledged?: boolean }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI<any[]>(`/alerts${query ? `?${query}` : ''}`);
  },
  acknowledge: (id: number) => fetchAPI<any>(`/alerts/${id}/acknowledge`, { method: 'PUT' }),
  generate: () => fetchAPI<any>('/alerts/generate', { method: 'POST' }),
};

// Reports
export const reportsAPI = {
  getFeedingReport: (start_date?: string, end_date?: string) => {
    const query = new URLSearchParams({ start_date: start_date || '', end_date: end_date || '' }).toString();
    return fetchAPI<any>(`/reports/feeding?${query}`);
  },
};

// Staff
export const staffAPI = {
  getAll: () => fetchAPI<any[]>('/staff'),
};