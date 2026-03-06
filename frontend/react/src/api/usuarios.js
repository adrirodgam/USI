import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api' 
})

export const getInspectores = async (token) => {
  try {
    const response = await apiClient.get('/usuarios', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) {
    return []
  }
}