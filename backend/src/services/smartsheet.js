const axios = require('axios')
 
const SMARTSHEET_TOKEN = process.env.SMARTSHEET_TOKEN
const BASE_URL = 'https://api.smartsheet.com/2.0'
 
// Fetch sheet data including columns and rows
async function getSheet(sheetId) {
  const response = await axios.get(`${BASE_URL}/sheets/${sheetId}`, {
    headers: { Authorization: `Bearer ${SMARTSHEET_TOKEN}` }
  })
  return response.data
}
 
// Add a new row with operator name and initials
async function registerOperator(sheetId, name, initial) {
  const sheet = await getSheet(sheetId)
 
  // Find column IDs by title (Smartsheet requires numeric column IDs)
  const operatorCol = sheet.columns.find(c => c.title === 'Operador')
  const initialCol = sheet.columns.find(c => c.title === 'Inicial')
 
  if (!operatorCol || !initialCol) {
    throw new Error('Required columns not found in sheet')
  }
 
  await axios.post(`${BASE_URL}/sheets/${sheetId}/rows`,
    [{
      cells: [
        { columnId: operatorCol.id, value: name },
        { columnId: initialCol.id, value: initial }
      ]
    }],
    {
      headers: {
        Authorization: `Bearer ${SMARTSHEET_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )
}
 
module.exports = { getSheet, registerOperator }