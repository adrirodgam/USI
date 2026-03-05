import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api/piezas' 
})

export const getPiezas = async (clienteId, token) => {
  try {
    const response = await apiClient.get(`/${clienteId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) {
    return []
  }
}