const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const verifyToken = require('../middleware/auth.middleware');
const { registerOperator } = require('../services/smartsheet');
 
// GET /api/checklists/:clientId - Get checklists by client
router.get('/:clientId', verifyToken, async (req, res) => {
    const { clientId } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('checklists')
            .select('*, customers(name)')
            .eq('customer_id', clientId);   
 
        if (error) return res.status(400).json({ error: error.message });
 
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
 
// POST /api/checklists/register - Register operator on Smartsheet
router.post('/register', verifyToken, async (req, res) => {
    const { sheetId } = req.body;
    const { name, initial } = req.user;
 
    if (!sheetId) {
        return res.status(400).json({ error: 'Sheet ID is required' });
    }
 
    try {
        await registerOperator(sheetId, name, initial);
        res.json({ success: true });
    } catch (err) {
        console.error('Error registering on Smartsheet:', err);
        res.status(500).json({ error: 'Could not register on Smartsheet' });
    }
});
 
module.exports = router;