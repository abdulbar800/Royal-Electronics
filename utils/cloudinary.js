const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'royal-electronics/products',
            use_filename: true
        });
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

const deleteFromCloudinary = async (public_id) => {
    try {
        await cloudinary.uploader.destroy(public_id);
        return true;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };