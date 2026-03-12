import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api/pieces' 
})

export const getPieces = async (customerId, token) => {
  try {
    const response = await apiClient.get(`/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) {
    return []
  }
}