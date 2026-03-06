const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_empleado, nombre')
      .eq('rol', 'inspector')
    
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' })
  }
})

module.exports = router