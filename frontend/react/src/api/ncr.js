// frontend/react/src/api/ncr.js

const API_BASE = `${import.meta.env.VITE_API_URL}/api/ncr`;

/**
 * GET /api/ncr
 * Returns raw Smartsheet data (columns + rows)
 */
export const getNCRSheet = async (token) => {
  const response = await fetch(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Failed to fetch NCR sheet');
  const json = await response.json();
  return json.data;
};

/**
 * GET /api/ncr/statuses
 * Returns status map from Supabase: { "MI2026-0001": "open", ... }
 */
export const getNCRStatuses = async (token) => {
  const response = await fetch(`${API_BASE}/statuses`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Failed to fetch NCR statuses');
  const json = await response.json();
  return json.data;
};

/**
 * PUT /api/ncr/:miId/status
 * Updates the status of an NCR in Supabase
 * @param {string} miId   - MI ID from Smartsheet (e.g. "MI2026-0001")
 * @param {string} status - 'open' | 'in_progress' | 'closed'
 * @param {string} token  - JWT auth token
 */
export const updateNCRStatus = async (miId, status, token) => {
  const response = await fetch(`${API_BASE}/${miId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update NCR status');
  const json = await response.json();
  return json.data;
};