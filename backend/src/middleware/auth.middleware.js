const supabase = require('../services/supabase');

const verifyToken = async (req, res, next) => {
    // 1. Get token from header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // 2. Ask Supabase to verify if the token is real and active
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // 3. If everything is fine, save the user and continue
    req.user = user;
    next();
};

module.exports = verifyToken;