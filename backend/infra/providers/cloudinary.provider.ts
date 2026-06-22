import { v2 as cloudinary } from 'cloudinary'; // Cloudinary library
import { CloudinaryStorage } from 'multer-storage-cloudinary'; // Multer storage enging for Cloudinary
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a new Cloudinary storage instance for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [
      {
        width: 300, // Crop width
        height: 300, // Crop height
        crop: 'fill', // Ensures the image fills the specified dimensions
        gravity: 'auto', // Uses the "center to subject" feature
        fetch_format: 'auto', // Automatically converts to WebP or the most efficient format
        quality: 'auto', // Adjusts qualtiy dynamically to balance file size and appearance
      },
    ],
  } as any,
});

// Create a Cloudinary storage instance for organisation logos
const orgStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'orgs',
    allowed_formats: ['jpg', 'png', 'jpeg', 'svg', 'webp'],
    transformation: [
      {
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'auto',
        fetch_format: 'auto',
        quality: 'auto',
      },
    ],
  } as any,
});

// Export the Cloudinary instance and storage engines
export { cloudinary, storage, orgStorage };
