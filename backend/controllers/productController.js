const Product = require('../models/product');
const { uploadToCloudinary } = require('../utils/cloudinary');


const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, brand, stock, images, video } = req.body;

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.path);
                imageUrls.push(result.url);
            }
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            brand,
            stock,
            images: imageUrls.length > 0 ? imageUrls : (images || ['https://via.placeholder.com/300']),
            video: video || null,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all products with search & filter
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const query = {};

        if (req.query.search) {
            //  FIX: escapeRegex use kar rahe hain - ReDoS protection
            const safeSearch = escapeRegex(req.query.search);
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.brand) {
            query.brand = req.query.brand;
        }

        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
        }

        if (req.query.minRating) {
            query.ratings = { $gte: parseFloat(req.query.minRating) };
        }

        if (req.query.inStock === 'true') {
            query.stock = { $gt: 0 };
        }

        const sort = {};
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const products = await Product.find(query)
            .sort(sort)
            .limit(limit)
            .skip(startIndex)
            .populate('createdBy', 'name email');

        const total = await Product.countDocuments(query);
        const categories = await Product.distinct('category');
        const brands = await Product.distinct('brand');

        res.json({
            success: true,
            count: products.length,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                categories,
                brands
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('reviews.user', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            product: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update product image
// @route   PUT /api/products/:id/image
// @access  Private/Admin
const updateProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one image'
            });
        }

        let imageUrls = [];
        for (const file of req.files) {
            const result = await uploadToCloudinary(file.path);
            imageUrls.push(result.url);
        }

        product.images = imageUrls;
        await product.save();

        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const alreadyReviewed = product.reviews.find(
            r => r.user && r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({
                success: false,
                message: 'Product already reviewed'
            });
        }

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Review added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateProductImage,
    deleteProduct,
    addReview
};
