import fs from 'fs';
import mongoose from 'mongoose';
import Image from '../models/imageModel.js';
import Product from '../models/productModel.js';
import Collection from '../models/collectionModel.js';
import uploadImage, { deleteCloudinaryImage } from '../utils/cloudinaryUpload.js';

export const getImages = async (req, res) => {
  try {
    const limit = Number(req.query.limit);

    if (!Number.isInteger(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'A positive integer limit is required, for example ?limit=10'
      });
    }

    const images = await Image.find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image file is required' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const filePath = file.path;
      const uploadResult = await uploadImage(filePath, 'ecommerce');

      const imageDoc = await Image.create({
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        altText: file.originalname,
        isPrimary: false
      });

      uploadedImages.push(imageDoc);

      // if (req.body.productId) {
      //   await Product.findByIdAndUpdate(req.body.productId, {
      //     $addToSet: { images: imageDoc._id }
      //   });
      // }

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete temporary file:', err);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadedImages
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => {
        if (file?.path) {
          fs.unlink(file.path, () => { });
        }
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    await deleteCloudinaryImage(image.publicId);

    await Promise.all([
      Image.findByIdAndDelete(id),
      Product.updateMany({ images: image._id }, { $pull: { images: image._id } }),
      Collection.updateMany({ image: image._id }, { $set: { image: null } })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: image
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
