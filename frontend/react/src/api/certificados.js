import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api' 
})

export const generarCOC = async (data, token) => {
  try {
    const response = await apiClient.post('/certificados', data, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    return response.data
  } catch (err) {
    return null
  }
}