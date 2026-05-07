/**
 * NCR Routes - Smartsheet + Supabase Status Tracker
 * 
 * Smartsheet is READ-ONLY source of truth for NCR data.
 * Supabase only stores workflow status (open/in_progress/closed)
 * linked by MI# (unique identifier from Smartsheet)
 */

const express = require('express');
const router = express.Router();
const { getSheet } = require('../services/smartsheet');
const { createSupabaseClient } = require('.../services/supabase');
const { verifyToken } = require('../middleware/auth.middleware');

// Sheet ID for NCR Manufacturing Issues Log
const NCR_SHEET_ID = '7886010277908356';

/**
 * GET /api/ncr
 * Returns RAW Smartsheet data (no parsing)
 * Frontend will parse and combine with statuses
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    // Get raw sheet data from Smartsheet
    const sheetData = await getSheet(NCR_SHEET_ID);
    
    res.json({
      success: true,
      data: sheetData
    });
  } catch (error) {
    console.error('Error fetching NCR sheet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NCR data from Smartsheet'
    });
  }
});

/**
 * GET /api/ncr/statuses
 * Returns all statuses from Supabase as a map: { "MI#": "status" }
 */
router.get('/statuses', verifyToken, async (req, res) => {
  try {
    const supabase = createSupabaseClient();
    
    // Get all status records from Supabase
    const { data, error } = await supabase
      .from('ncr_status')
      .select('mi_id, status');
    
    if (error) throw error;
    
    // Convert to map object: { "MI2026-0001": "in_progress", ... }
    const statusMap = {};
    data.forEach(record => {
      statusMap[record.mi_id] = record.status;
    });
    
    res.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    console.error('Error fetching NCR statuses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statuses from database'
    });
  }
});

/**
 * GET /api/ncr/severity-mapping
 * Returns severity mapping for defect types
 */
router.get('/severity-mapping', verifyToken, async (req, res) => {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from('ncr_severity_mapping')
      .select('defect_type, severity');
    
    if (error) throw error;
    
    // Convert to map object
    const severityMap = {};
    data.forEach(item => {
      severityMap[item.defect_type] = item.severity;
    });
    
    res.json({
      success: true,
      data: severityMap
    });
  } catch (error) {
    console.error('Error fetching severity mapping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch severity mapping'
    });
  }
});

/**
 * PUT /api/ncr/:miId/status
 * Update or create status for a specific NCR (by MI#)
 * Body: { status: "open" | "in_progress" | "closed" }
 */
router.put('/:miId/status', verifyToken, async (req, res) => {
  try {
    const { miId } = req.params;
    const { status } = req.body;
    const employeeId = req.user.employee_id;
    
    // Validate status value
    const validStatuses = ['open', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const supabase = createSupabaseClient();
    
    // UPSERT: insert if not exists, update if exists
    const { data, error } = await supabase
      .from('ncr_status')
      .upsert({
        mi_id: miId,
        status: status,
        updated_by: employeeId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'mi_id'
      })
      .select();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data[0],
      message: `Status updated to "${status}" for NCR ${miId}`
    });
  } catch (error) {
    console.error('Error updating NCR status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update NCR status'
    });
  }
});

module.exports = router;