// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Public endpoint (authenticated users only) – used by AppContext
// GET /api/users?email=...
router.get('/', verifyToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (email) {
      // Fetch one user by email-derived employee_id
      const employeeId = email.split('@')[0];
      if (!employeeId) return res.status(400).json({ error: 'Invalid email format' });

      const { data, error } = await supabase
        .from('users')
        .select('employee_id, name, signature_url')
        .eq('employee_id', employeeId)
        .single();

      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'User not found' });
      return res.json(data);
    }

    // If no email provided, return full list (only for admin/developer roles)
    // This block will be protected by the generic route below if needed, but we can reuse this endpoint
    // with checkRole for listing all users.
    // To avoid confusion, we'll separate them: listing all users is a separate protected route.
    // So here, if no email, we'll just return an error (bad request).
    return res.status(400).json({ error: 'Email parameter is required' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes: list all users, create, update, delete (soft)
// All these routes require authentication and role=developer or admin

// GET /api/users/all – list all users (with checkRole)
router.get('/all', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('employee_id, name, initial, role, active');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users – create new user
router.post('/', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id, name, initial, role } = req.body;
    if (!employee_id || !name || !initial || !role) {
      return res.status(400).json({ error: 'Missing required fields: employee_id, name, initial, role' });
    }

    // Check if employee_id already exists
    const { data: existing } = await supabase
      .from('users')
      .select('employee_id')
      .eq('employee_id', employee_id)
      .single();
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const { data, error } = await supabase
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

// PUT /api/users/:employee_id – update user (name, role, active)
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

    const { data, error } = await supabase
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

// DELETE /api/users/:employee_id – soft delete (deactivate)
router.delete('/:employee_id', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { data, error } = await supabase
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