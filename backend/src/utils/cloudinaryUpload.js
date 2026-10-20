import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

const uploadImage = async (filePath, folder = 'ecommerce') => {

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('The temporary image file does not exist.');
  }

  try {
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      overwrite: false,
      invalidate: true
    });

    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    const message = error?.error?.message || error?.message || 'Unknown Cloudinary error';
    throw new Error(`Cloudinary upload failed: ${message}`);
  }
};

export const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || typeof publicId !== 'string') {
    throw new Error('A valid Cloudinary publicId is required.');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(result.result || 'Failed to delete image from Cloudinary');
    }

    return result;
  } catch (error) {
    const message = error?.error?.message || error?.message || 'Unknown Cloudinary error';
    throw new Error(`Cloudinary delete failed: ${message}`);
  }
};

export default uploadImage;
