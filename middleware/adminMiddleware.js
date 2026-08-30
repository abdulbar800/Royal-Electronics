// @desc Check if user is admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authorized as admin'
        });
    }
};

module.exports = { admin }; 