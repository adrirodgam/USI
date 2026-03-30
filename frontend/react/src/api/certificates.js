import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`
})

export const generateCOC = async (data, token) => {
  try {
    const response = await apiClient.post('/certificates', data, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    return response.data
  } catch (err) {
    return null
  }
}
