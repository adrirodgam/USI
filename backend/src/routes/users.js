// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const supabaseAdmin = require('../services/supabaseAdmin');
const verifyToken = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// GET /api/users?email=... (used by AppContext)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (email) {
      const employeeId = email.split('@')[0];
      if (!employeeId) return res.status(400).json({ error: 'Invalid email format' });

      // FIX: Include all fields needed by AppContext (role, initial, department, active)
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('employee_id, name, initial, role, active, department, signature_url, email')
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

// GET /api/users/all – list all users (admin/developer)
router.get('/all', verifyToken, checkRole('developer', 'admin', 'gerente'), async (req, res) => {
  try {
    // FIX: Include department in SELECT
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('employee_id, name, initial, role, active, department, email');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users – create new user (also in Auth)
router.post('/', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id, name, initial, role, department, email } = req.body;
    if (!employee_id || !name || !initial || !role) {
      return res.status(400).json({ error: 'Missing required fields: employee_id, name, initial, role' });
    }

    // Check if employee_id already exists in public.users
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('employee_id')
      .eq('employee_id', employee_id)
      .single();
    if (existing) return res.status(409).json({ error: 'User already exists' });

    // Create user in Supabase Auth (login email = employee_id@libraind.com)
    const loginEmail = `${employee_id}@libraind.com`;
    const temporaryPassword = 'Usi2026!';
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError || !authUser) {
      console.error('Auth creation error:', authError);
      return res.status(500).json({ error: 'Failed to create login account' });
    }

    // Insert into public.users — email here is the real contact email, NOT the login email
    const newUser = {
      employee_id,
      name,
      initial,
      role,
      department: department || 'Calidad',
      active: true,
      email: email || null,
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([newUser])
      .select('employee_id, name, initial, role, active, department, email')
      .single();

    if (error) {
      // Rollback: delete the auth user if insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:employee_id – update user
router.put('/:employee_id', verifyToken, checkRole('developer', 'admin'), async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { name, role, active, email, department } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;
    if (email !== undefined) updates.email = email;
    if (department !== undefined) updates.department = department;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('employee_id', employee_id)
      .select('employee_id, name, initial, role, active, department, email')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:employee_id – soft delete
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
