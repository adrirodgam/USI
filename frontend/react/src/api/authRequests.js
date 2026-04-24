import axios from 'axios'


const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://usi-production-d84d.up.railway.app';

const apiClient = axios.create({ 
  baseURL: `${API_BASE_URL}/api/auth`
})

export const login = async (employee_id, password) => {
  try {

    console.log('Llamando a:', `${API_BASE_URL}/api/auth/login`);
    const response = await apiClient.post('/login', { employee_id, password })
    return response.data
  } catch (err) {
    console.error('Error en login:', err.response?.data || err.message);
    return null
  }
}