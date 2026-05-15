// backend/src/routes/rework.js
const express = require('express');
const router = express.Router();
const REWORK_SHEET_ID = '5379392585813892';
const { getSheet, updateRow, addColumn, getColumns } = require('../services/smartsheet');

// Nombre de la columna de hora muerta total en Smartsheet
const DEAD_TIME_COLUMN = 'Hora Muerta Total (hrs)';

// Asegura que la columna de hora muerta exista en el sheet
const ensureDeadTimeColumn = async () => {
  try {
    const columns = await getColumns(REWORK_SHEET_ID);
    const exists = columns.some((col) => col.title === DEAD_TIME_COLUMN);
    if (!exists) {
      await addColumn(REWORK_SHEET_ID, { title: DEAD_TIME_COLUMN, type: 'TEXT_NUMBER' });
    }
  } catch (err) {
    console.error('Error ensuring dead time column:', err);
  }
};

ensureDeadTimeColumn();

// ── Calcular hora muerta total en horas ──────────────────────────────────────
const calcDeadTimeHours = (registeredDate, completedDate) => {
  if (!registeredDate || !completedDate) return null;
  const diffMs = new Date(completedDate) - new Date(registeredDate);
  if (diffMs < 0) return null;
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

// GET /reworks
router.get('/reworks', async (req, res) => {
  try {
    const sheet = await getSheet(REWORK_SHEET_ID);
    res.json(sheet);
  } catch (error) {
    console.error('Error in /reworks:', error);
    res.status(500).json({ error: 'Error al obtener reworks' });
  }
});

// PUT /reworks/:rowId/status
router.put('/reworks/:rowId/status', async (req, res) => {
  try {
    const { rowId } = req.params;
    const { status, registeredDate, completedDate, columnIds } = req.body;

    console.log('DEBUG:', { rowId, status, columnIds });

    if (!status) {
      return res.status(400).json({ error: 'El campo status es requerido' });
    }

    if (!columnIds?.status) {
      return res.status(400).json({ error: 'columnIds.status es requerido' });
    }

    // Construir las celdas a actualizar
    const cells = [
      { columnId: columnIds.status, value: status },
    ];

    // Si el rework se marca como Terminado, calcular y guardar hora muerta total
    if (status === 'Terminado' && registeredDate && completedDate && columnIds.deadTime) {
      const deadTimeHours = calcDeadTimeHours(registeredDate, completedDate);
      if (deadTimeHours !== null) {
        cells.push({ columnId: columnIds.deadTime, value: deadTimeHours });
      }
    }

    const result = await updateRow(REWORK_SHEET_ID, rowId, cells);
    res.json(result);
  } catch (error) {
    console.error('Error updating rework status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;