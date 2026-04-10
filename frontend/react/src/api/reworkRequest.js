// frontend/react/src/api/reworkRequest
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Get KPIs for reworks
export const getReworks = async () => {
    try{
        const response = await fetch(`${API_URL}/rework/reworks`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
        throw new Error('Error al obtener Reworks')
    } 

    return await response.json();
  } catch (error) {
    console.error('Error in getReworks:',  error);
    throw error;
  }
 };

export const updateReworkStatus = async (rowId, status) => {
  try {
    const response = await fetch(`${API_URL}/rework/${rowId}/status`, {
      method: "PUT",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        throw new Error('Error al obtener Reworks')
    } 
    
    return await response.json();
  } catch (error) {
    console.error("Error updating rework status:", error);
    throw error;
  }
};