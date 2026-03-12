import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api/auth' 
})

export const login = async (employee_id, password) => {
  try {
    const response = await apiClient.post('/login', { employee_id, password })
    return response.data
  } catch (err) {
    return null
  }
}