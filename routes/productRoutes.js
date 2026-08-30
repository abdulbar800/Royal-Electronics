const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateProductImage,
    deleteProduct,
    addReview
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
    validateProduct,
    validateReview
} = require('../middleware/validation');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin routes with validation
router.post('/', protect, admin, validateProduct, upload.array('images', 5), createProduct);

router.put('/:id', protect, admin, validateProduct, updateProduct);
router.put('/:id/image', protect, admin, upload.array('images', 5), updateProductImage);
router.delete('/:id', protect, admin, deleteProduct);

// Protected routes with validation
router.post('/:id/reviews', protect, validateReview, addReview);

module.exports = router;