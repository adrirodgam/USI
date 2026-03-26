const axios = require('axios')
 
const SMARTSHEET_TOKEN = process.env.SMARTSHEET_TOKEN
const BASE_URL = 'https://api.smartsheet.com/2.0'
const WORKSPACE_ID = '8187746641569668';
 
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


async function findFolderByName(workspaceId, folderName) {
  try {
    const response = await axios.get(`${BASE_URL}/workspaces/${workspaceId}/folders`, {
      headers: { Authorization: `Bearer ${SMARTSHEET_TOKEN}` }
    });
    const folders = response.data.data || [];
    const found = folders.find(folder => folder.name === folderName);
    return found ? found.id : null;
  } catch (error) {
    console.error('Error finding folder:', error.response?.data || error.message);
    return null;
  }
}


async function createFolder(workspaceId, folderName) {
  try {
    const response = await axios.post(`${BASE_URL}/workspaces/${workspaceId}/folders`,
      { name: folderName },
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.id;
  } catch (error) {
    console.error('Error creating folder:', error.response?.data || error.message);
    throw error;
  }
}


// ✅ FIXED: usar GET /folders/{id} en lugar de GET /folders/{id}/sheets
async function findSheetByName(folderId, sheetName) {
  try {
    const response = await axios.get(`${BASE_URL}/folders/${folderId}`, {
      headers: { Authorization: `Bearer ${SMARTSHEET_TOKEN}` }
    });
    // El contenido de la carpeta viene en response.data.sheets
    const sheets = response.data.sheets || [];
    const found = sheets.find(sheet => sheet.name === sheetName);
    return found ? found.id : null;
  } catch (error) {
    console.error('Error finding sheet:', error.response?.data || error.message);
    return null;
  }
}


async function createSheet(folderId, sheetName) {
  try {
    const columns = [
      { title: 'Inspector', type: 'TEXT_NUMBER', primary: true },
      { title: 'Part No', type: 'TEXT_NUMBER' },
      { title: 'Drawing No', type: 'TEXT_NUMBER' },
      { title: 'Cliente', type: 'TEXT_NUMBER' },
      { title: 'Fecha', type: 'DATE' }
    ];

    const response = await axios.post(`${BASE_URL}/folders/${folderId}/sheets`,
      { name: sheetName, columns },
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.result.id;
  } catch (error) {
    console.error('Error creating sheet:', error.response?.data || error.message);
    throw error;
  }
}


async function getColumnIds(sheetId) {
  const sheet = await getSheet(sheetId);
  return {
    inspector: sheet.columns.find(c => c.title === 'Inspector')?.id,
    partNo: sheet.columns.find(c => c.title === 'Part No')?.id,
    drawingNo: sheet.columns.find(c => c.title === 'Drawing No')?.id,
    cliente: sheet.columns.find(c => c.title === 'Cliente')?.id,
    fecha: sheet.columns.find(c => c.title === 'Fecha')?.id
  };
}


async function addCertificateRow(sheetId, data) {
  try {
    const columnIds = await getColumnIds(sheetId);
    
  const cells = [
  { columnId: columnIds.inspector, value: data.inspector },
  { columnId: columnIds.partNo, value: data.partNo },
  { columnId: columnIds.drawingNo, value: data.drawingNo },
  { columnId: columnIds.cliente, value: data.cliente },
  { columnId: columnIds.fecha, value: data.fecha }
  ].filter(cell => cell.columnId && cell.value !== undefined && cell.value !== null && cell.value !== '');

    const response = await axios.post(`${BASE_URL}/sheets/${sheetId}/rows`,
      [{ cells }],
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.result[0].id;
  } catch (error) {
    console.error('Error adding row:', error.response?.data || error.message);
    throw error;
  }
}


async function attachFileToRow(sheetId, rowId, fileBuffer, fileName) {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const response = await axios.post(
      `${BASE_URL}/sheets/${sheetId}/rows/${rowId}/attachments`,
      form,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_TOKEN}`,
          ...form.getHeaders()
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error attaching file:', error.response?.data || error.message);
    throw error;
  }
}


async function saveCertificate(certificateData, fileBuffer, fileName) {
  try {
    const now = new Date();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthFolderName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const daySheetName = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Buscar o crear carpeta del mes
    let folderId = await findFolderByName(WORKSPACE_ID, monthFolderName);
    if (!folderId) {
      console.log(`Folder "${monthFolderName}" not found, creating...`);
      folderId = await createFolder(WORKSPACE_ID, monthFolderName);
    }
    console.log(`Using folder ID: ${folderId}`);

    // Buscar o crear hoja del día
    let sheetId = await findSheetByName(folderId, daySheetName);
    if (!sheetId) {
      console.log(`Sheet "${daySheetName}" not found, creating...`);
      sheetId = await createSheet(folderId, daySheetName);
    }
    console.log(`Using sheet ID: ${sheetId}`);

    
    const rowId = await addCertificateRow(sheetId, {
      inspector: certificateData.inspector,
      partNo: certificateData.partNo,
      drawingNo: certificateData.drawingNo,
      cliente: certificateData.cliente,
      fecha: now.toISOString().split('T')[0]
    });
    console.log(`Row added with ID: ${rowId}`);

  
    await attachFileToRow(sheetId, rowId, fileBuffer, fileName);
    console.log(`File "${fileName}" attached to row`);

    return { success: true, folderId, sheetId, rowId };
  } catch (error) {
    console.error('Error saving certificate:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { 
  getSheet, 
  registerOperator, 
  findFolderByName,
  createFolder,
  findSheetByName,
  createSheet,
  addCertificateRow,
  attachFileToRow,
  saveCertificate
};