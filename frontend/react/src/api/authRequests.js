import axios from 'axios'

const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api/auth' 
})

export const login = async (id_empleado, password) => {
  try {
    const response = await apiClient.post('/login', { id_empleado, password })
    return response.data.session.access_token
  } catch (err) {
    return null
  }
}