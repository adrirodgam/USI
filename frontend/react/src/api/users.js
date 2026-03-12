import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api' 
})

export const getInspectors = async (token) => {
  try {
    const response = await apiClient.get('/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) {
    return []
  }
}