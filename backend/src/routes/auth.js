// backend/src/routes/auth.js

const express = require('express');
const { z } = require('zod');
const supabase = require('../services/supabase');

const router = express.Router();

const LoginSchema = z.object({
  employee_id: z.string().min(1),
  password:    z.string().min(1),
});

router.post('/login', async (req, res) => {
  try {
    const validatedData = LoginSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({ error: 'employee_id y password son requeridos' });
    }

    const { employee_id, password } = validatedData.data;
    const email = `${employee_id}@libraind.com`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(`[AUTH] Login failed for ${employee_id}:`, error.message);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, initial, role, employee_id')
      .eq('employee_id', employee_id)
      .single();

    if (userError || !user) {
      console.error(`[AUTH] User record not found for ${employee_id}:`, userError?.message);
      return res.status(401).json({ error: 'Usuario no encontrado en el sistema' });
    }

    res.json({ session: data.session, user });

  } catch (err) {
    console.error('[AUTH] Unexpected error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;