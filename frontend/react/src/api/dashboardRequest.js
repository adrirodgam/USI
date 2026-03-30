// frontend/src/api/dashboardRequests.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Get KPIs for dashboard
export const getDashboardKPIs = async () => {
  try {
    const response = await fetch(`${API_URL}/dashboard/kpis`, {
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener KPIs');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getDashboardKPIs:', error);
    throw error;
  }
};

// Get recent activity for dashboard
export const getDashboardActivity = async (limit = 10) => {
  try {
    const response = await fetch(`${API_URL}/dashboard/activity?limit=${limit}`, {
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener actividad');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getDashboardActivity:', error);
    throw error;
  }
};

// Exportar reporte
export const exportDashboardReport = async () => {
  try {
    const response = await fetch(`${API_URL}/dashboard/export`, {
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Error al exportar reporte');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error('Error in exportDashboardReport:', error);
    throw error;
  }
};
