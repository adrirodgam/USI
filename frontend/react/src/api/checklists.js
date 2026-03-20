import axios from 'axios'
 
const apiClient = axios.create({ 
  baseURL: 'http://localhost:3000/api/checklists' 
})
 
export const getChecklists = async (customerId, token) => {
  try {
    const response = await apiClient.get(`/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  } catch (err) {
    return []
  }
}
 
export const registerOnSmartsheet = async (sheetId, token) => {
  try {
    const response = await apiClient.post('/register', 
      { sheetId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  } catch (err) {
    console.error('Error registering on Smartsheet:', err)
    return null
  }
}
