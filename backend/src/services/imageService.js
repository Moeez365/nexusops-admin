import fs from "fs/promises";
import mongoose from "mongoose";
import Image from "../models/imageModel.js";
import uploadImage, { deleteCloudinaryImage } from "../utils/cloudinaryUpload.js";
import logger from "../utils/logger.js";

/**
 * Fetch image records up to limit
 */
export const getImagesList = async (limitParam) => {
  const limit = Number(limitParam);

  if (!Number.isInteger(limit) || limit < 1) {
    const error = new Error("A positive integer limit is required, for example ?limit=10");
    error.statusCode = 400;
    throw error;
  }

  const images = await Image.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit);

  return images;
};

/**
 * Upload array of local files to Cloudinary and persist Image models
 */
export const processImageUploads = async (files = []) => {
  if (!files || files.length === 0) {
    const error = new Error("At least one image file is required");
    error.statusCode = 400;
    throw error;
  }

  const uploadedImageDocs = [];

  for (const file of files) {
    const filePath = file.path;
    try {
      const uploadResult = await uploadImage(filePath, "ecommerce");

      const imageDoc = await Image.create({
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        altText: file.originalname,
        isPrimary: false,
      });

      uploadedImageDocs.push(imageDoc);
    } finally {
      // Safely cleanup temporary file
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        logger.warn(`Failed to unlink temporary upload file: ${filePath}`);
      }
    }
  }

  return uploadedImageDocs;
};

/**
 * Delete image from Cloudinary and database
 */
export const removeImage = async (imageId) => {
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    const error = new Error("Invalid image ID");
    error.statusCode = 400;
    throw error;
  }

  const image = await Image.findById(imageId);
  if (!image) {
    const error = new Error("Image not found");
    error.statusCode = 404;
    throw error;
  }

  if (image.publicId) {
    try {
      await deleteCloudinaryImage(image.publicId);
    } catch (cdnErr) {
      logger.warn(`Cloudinary deletion failed for publicId: ${image.publicId}`);
    }
  }

  await image.deleteOne();
  return image;
};

