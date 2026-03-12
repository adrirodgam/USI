const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const verifyToken = require('../middleware/auth.middleware');

// GET /api/pieces/:clientId - Get pieces by client
router.get('/:clientId', verifyToken, async (req, res) => {
    const { clientId } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('pieces')
            .select('*, customers(name)')
            .eq('customer_id', clientId);   

        if (error) return res.status(400).json({ error: error.message });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;