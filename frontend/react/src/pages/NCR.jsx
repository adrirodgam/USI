// Add this function to your existing ncr.js API file

/**
 * Get severity mapping from Supabase
 * Maps defect types (e.g., "DIMENSIONAL") to severity ("CRITICA", "MAYOR", "MENOR")
 * @returns {Promise<Object>} Severity map: { "DIMENSIONAL": "CRITICA", ... }
 */
export const getSeverityMapping = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/severity-mapping`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching severity mapping:', error);
    // Return default mapping if API fails
    return {
      'DIMENSIONAL': 'CRITICA',
      'COSMETICO': 'MENOR',
      'MANO DE OBRA': 'MAYOR',
      'SET UP INGENIERIA': 'MAYOR',
      'PROCESO': 'MAYOR',
      'MATERIAL': 'CRITICA'
    };
  }
};