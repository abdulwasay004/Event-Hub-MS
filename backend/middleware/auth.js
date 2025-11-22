// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin']);

// User or Admin middleware (since users can create events)
const requireUserOrAdmin = requireRole(['user', 'admin']);

// Check if user owns resource or is admin
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  const userId = parseInt(req.params.userId || req.params.id);
  if (req.session.user.user_id !== userId && req.session.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied' 
    });
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireUserOrAdmin,
  requireOwnerOrAdmin
};