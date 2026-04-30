const supabase = require('../services/supabase');
const supabaseAdmin = require('../services/supabaseAdmin'); // Use admin client to bypass RLS

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: 'Invalid or expired token' });

    const employeeId = user.email.replace('@libraind.com', '');
    
    // Use supabaseAdmin to read from public.users (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('name, initial, role')
        .eq('employee_id', employeeId)
        .single();

    if (userError || !userData) return res.status(403).json({ error: 'User not found' });

    req.user = { ...user, ...userData };
    next();
};

module.exports = verifyToken;