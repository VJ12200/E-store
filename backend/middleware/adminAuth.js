import { User } from '../Database/index.js';

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get user from database to check role
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Add user info to request
        req.admin = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if user is admin or the resource owner
const requireAdminOrOwner = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Allow if user is admin or if they're accessing their own resource
        const resourceUserId = req.params.userId || req.body.userId;
        if (user.role === 'admin' || user.id.toString() === resourceUserId) {
            req.admin = user.role === 'admin' ? user : null;
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    } catch (error) {
        console.error('Admin or owner auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

export { requireAdmin, requireAdminOrOwner };
