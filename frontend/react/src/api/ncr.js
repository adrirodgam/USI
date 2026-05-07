// frontend/react/src/api/ncr.js

const API_BASE = `${import.meta.env.VITE_API_URL}/api/ncr`; // ✅ consistente con el resto del proyecto

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * GET /api/ncr
 * Retorna el sheet crudo de Smartsheet
 */
export const getNCRSheet = async () => {
  const response = await fetch(API_BASE, { headers: getAuthHeader() });
  if (!response.ok) throw new Error('Error al obtener NCR sheet');
  const json = await response.json();
  return json.data; // { columns, rows }
};

/**
 * GET /api/ncr/statuses
 * Retorna mapa de statuses desde Supabase: { "MI2026-0001": "open", ... }
 */
export const getNCRStatuses = async () => {
  const response = await fetch(`${API_BASE}/statuses`, { headers: getAuthHeader() });
  if (!response.ok) throw new Error('Error al obtener statuses de NCR');
  const json = await response.json();
  return json.data; // {}  si no hay registros aún — no crashea
};

/**
 * PUT /api/ncr/:miId/status
 * Actualiza el status de un NCR en Supabase
 * @param {string} miId  - ID del MI en Smartsheet (ej: "MI2026-0001")
 * @param {string} status - 'open' | 'in_progress' | 'closed'
 */
export const updateNCRStatus = async (miId, status) => {
  const response = await fetch(`${API_BASE}/${miId}/status`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Error al actualizar status de NCR');
  const json = await response.json();
  return json.data;
};
