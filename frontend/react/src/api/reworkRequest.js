// frontend/react/src/api/reworkRequest.js
const API_URL = `${import.meta.env.VITE_API_URL}/api`;
 
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
 
export const getReworks = async () => {
  try {
    const response = await fetch(`${API_URL}/rework/reworks`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Error al obtener Reworks');
    return await response.json();
  } catch (error) {
    console.error('Error in getReworks:', error);
    throw error;
  }
};
 
export const updateReworkStatus = async (rowId, status, registeredDate, formDate, completedDate, columnIds) => {
  try {
    const response = await fetch(`${API_URL}/rework/reworks/${rowId}/status`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({ status, registeredDate, formDate, completedDate, columnIds }),
    });
    if (!response.ok) throw new Error('Error al actualizar estado');
    return await response.json();
  } catch (error) {
    console.error('Error updating rework status:', error);
    throw error;
  }
};