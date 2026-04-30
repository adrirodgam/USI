const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

// GET /api/users?email=... — fetch one user by email-derived employee_id
router.get('/', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'Email query parameter required' })

    // Example email: "112417@libraind.com" → employee_id = "112417"
    const employeeId = email.split('@')[0]
    if (!employeeId) return res.status(400).json({ error: 'Invalid email format' })

    const { data, error } = await supabase
      .from('users')
      .select('employee_id, name, signature_url')
      .eq('employee_id', employeeId)
      .single()

    if (error) {
      console.error('Error fetching user by employee_id:', error)
      return res.status(400).json({ error: error.message })
    }
    if (!data) return res.status(404).json({ error: 'User not found' })

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router