import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`
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
