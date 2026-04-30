//backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const supabaseAdmin = require('../services/supabaseAdmin'); // For admin operations
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Public endpoint – used by AppContext
// GET /api/users?email=...
router.get('/', verifyToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (email) {
      const employeeId = email.split('@')[0];
      if (!employeeId) return res.status(400).json({ error: 'Invalid email format' });

      const { data, error } = await supabaseAdmin
        .from('users')
        .select('employee_id, name, signature_url')
        .eq('employee_id', employeeId)
        .single();

      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'User not found' });
      return res.json(data);
    }
    return res.status(400).json({ error: 'Email parameter is required' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes: list all users, create, update, delete (soft)
router.get('/all', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('employee_id, name, initial, role, active');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id, name, initial, role } = req.body;
    if (!employee_id || !name || !initial || !role) {
      return res.status(400).json({ error: 'Missing required fields: employee_id, name, initial, role' });
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('employee_id')
      .eq('employee_id', employee_id)
      .single();
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{ employee_id, name, initial, role, active: true }])
      .select('employee_id, name, initial, role, active')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:employee_id', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { name, role, active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('employee_id', employee_id)
      .select('employee_id, name, initial, role, active')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:employee_id', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ active: false })
      .eq('employee_id', employee_id)
      .select('employee_id, name, active')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated', user: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;