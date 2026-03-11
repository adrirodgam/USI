const express = require('express')
const { z } = require('zod')
const supabase = require('../services/supabase')

const router = express.Router()

const LoginSchema = z.object({
    id_empleado: z.string(),
    password: z.string()
})

router.post('/login', async (req, res)  => {
    try {
        const datosValidados = LoginSchema.safeParse(req.body)
        const email = `${datosValidados.data.id_empleado}@libraind.com`

        const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: datosValidados.data.password
        })

        if (error) {
        return res.status(401).json({ error: 'Credenciales incorrectas' })
        }

        const { data: usuario } = await supabase
            .from('usuarios')
            .select('nombre, inicial, rol')
            .eq('id_empleado', datosValidados.data.id_empleado)
            .single()

        res.json({ session: data.session, usuario })


    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor' })
    }
})

module.exports = router
