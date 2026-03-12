const express = require('express')
const { z } = require('zod')
const supabase = require('../services/supabase')

const router = express.Router()

const LoginSchema = z.object({
    employee_id: z.string(),
    password: z.string()
})

router.post('/login', async (req, res)  => {
    try {
        const validatedData = LoginSchema.safeParse(req.body)
        const email = `${validatedData.data.employee_id}@libraind.com`

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: validatedData.data.password
        })

        if (error) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const { data: user } = await supabase
            .from('users')
            .select('name, initial, role')
            .eq('employee_id', validatedData.data.employee_id)
            .single()

        res.json({ session: data.session, user })

    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router