const cloudinary = require('cloudinary').v2;                                    // Cloudinary library
const { CloudinaryStorage } = require('multer-storage-cloudinary');             // Multer storage enging for Cloudinary
require('dotenv').config();                                                     // Environment variables

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a new Cloudinary storage instance for Multer
const storage = new CloudinaryStorage({
    cloudinary, 
    params: {
        folder: 'user_avatars',
        allowed_formats: ['jpg', 'png', 'jpeg'], 
        transformation: [
            {
                width: 300,             // Crop width
                height: 300,            // Crop height
                crop: 'fill',           // Ensures the image fills the specified dimensions
                gravity: 'auto',        // Uses the "center to subject" feature
                fetch_format: 'auto',   // Automatically converts to WebP or the most efficient format
                quality: 'auto',        // Adjusts qualtiy dynamically to balance file size and appearance
            }
        ]
    }
});

// Export the Cloudinary instance and storage engine
module.exports = { cloudinary, storage };