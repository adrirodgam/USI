// backend/src/routes/ncr.js

const express = require('express');
const router = express.Router();
const { getSheet } = require('../services/smartsheet');
const supabaseAdmin = require('../services/supabaseAdmin'); // ✅ instancia directa, no destructuring
const verifyToken = require('../middleware/auth.middleware'); // ✅ default export, sin destructuring

const NCR_SHEET_ID = '7886010277908356';

/**
 * GET /api/ncr
 * Retorna el sheet crudo de Smartsheet (columns + rows)
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const sheetData = await getSheet(NCR_SHEET_ID);
    res.json({ success: true, data: sheetData });
  } catch (error) {
    console.error('Error fetching NCR sheet:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch NCR data from Smartsheet' });
  }
});

/**
 * GET /api/ncr/statuses
 * Retorna todos los statuses guardados en Supabase como un mapa { mi_id: status }
 */
router.get('/statuses', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ncr_status')
      .select('mi_id, status');

    if (error) throw error;

    const statusMap = {};
    data.forEach(record => {
      statusMap[record.mi_id] = record.status;
    });

    res.json({ success: true, data: statusMap });
  } catch (error) {
    console.error('Error fetching NCR statuses:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch statuses from database' });
  }
});

/**
 * PUT /api/ncr/:miId/status
 * Upsert del status de un NCR en Supabase
 * Body: { status: 'open' | 'in_progress' | 'closed' }
 */
router.put('/:miId/status', verifyToken, async (req, res) => {
  try {
    const { miId } = req.params;
    const { status } = req.body;
    const employeeId = req.user.employee_id;

    const validStatuses = ['open', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`
      });
    }

    const { data, error } = await supabaseAdmin
      .from('ncr_status')
      .upsert(
        {
          mi_id: miId,
          status: status,
          updated_by: employeeId,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'mi_id' }
      )
      .select();

    if (error) throw error;

    res.json({
      success: true,
      data: data[0],
      message: `Status actualizado a "${status}" para NCR ${miId}`
    });
  } catch (error) {
    console.error('Error updating NCR status:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update NCR status' });
  }
});

module.exports = router;
