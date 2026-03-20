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
 
    // 3. Get employee data (name, initial, role) from users table
    const employeeId = user.email.replace('@libraind.com', '');
 
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, initial, role')
        .eq('employee_id', employeeId)
        .single();
 
    if (userError || !userData) {
        return res.status(403).json({ error: 'User not found' });
    }
 
    // 4. Save full user data and continue
    req.user = { ...user, ...userData };
    next();
};
 
module.exports = verifyToken;