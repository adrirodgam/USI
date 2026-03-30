import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL}/api/pieces`
})

export const getPieces = async (customerId, token) => {
  try {
    const response = await apiClient.get(`/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) {
    console.error('Error getting pieces:', err)
    return []
  }
}

export const createPiece = async (pieceData, token) => {
  try {
    const response = await apiClient.post('/', pieceData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) { 
    console.error('Error creating piece:', err)
    throw err
  }
}
