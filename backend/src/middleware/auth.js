const supabase = require('../services/supabase');

const verificarToken = async (req, res, next) => {
    // 1. Obtener el token del header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No se proporcionó un token' });
    }

    // 2. Pedirle a Supabase que verifique si el token es real y está activo
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // 3. Si todo está bien, guardamos el usuario y seguimos
    req.user = user;
    next();
};

module.exports = verificarToken;