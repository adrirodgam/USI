/**
 * NCR API Client
 * Handles all NCR-related API calls to the backend
 */

import axios from 'axios';

const API_BASE = '/api/ncr';

/**
 * Get raw Smartsheet data for NCRs
 * @returns {Promise<Object>} Raw sheet data from Smartsheet
 */
export const getNCRSheet = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_BASE, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching NCR sheet:', error);
    throw error;
  }
};

/**
 * Get all NCR statuses from Supabase
 * @returns {Promise<Object>} Status map: { "MI2026-0001": "open", ... }
 */
export const getNCRStatuses = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/statuses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching NCR statuses:', error);
    throw error;
  }
};

/**
 * Update status for a specific NCR
 * @param {string} miId - The MI# from Smartsheet (e.g., "MI2026-0001")
 * @param {string} status - New status: 'open', 'in_progress', or 'closed'
 * @returns {Promise<Object>} Updated status record
 */
export const updateNCRStatus = async (miId, status) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_BASE}/${miId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating NCR status:', error);
    throw error;
  }
};