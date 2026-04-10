// backend/src/routes/rework.js
const express = require('express');
const router = express.Router();
const REWORK_SHEET_ID = '3042764846485380';
const { getSheet } = require('../services/smartsheet');

router.get('/reworks', async (req, res) => {
  try {
    const sheet = await getSheet(REWORK_SHEET_ID);
    res.json(sheet);
  } catch (error) {
    console.error('Error in /reworks:', error);
    res.status(500).json({ error: 'Error al obtener reworks' });
  }
});

router.put('/reworks/:rowId/status', async (req, res) => {
  try {
    const { rowId } = req.params;
    const { status } = req.body;
    
    const result = await updateRow(REWORK_SHEET_ID, rowId, status);
    res.json(result);
  } catch (error) {
    console.error('Error updating rework status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
}); 



module.exports = router;