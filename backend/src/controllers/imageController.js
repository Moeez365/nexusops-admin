import asyncHandler from "../utils/asyncHandler.js";
import {
  getImagesList,
  processImageUploads,
  removeImage,
} from "../services/imageService.js";

/**
 * @desc    Get images up to limit
 * @route   GET /api/upload
 * @access  Public / Admin
 */
export const getImages = asyncHandler(async (req, res) => {
  const images = await getImagesList(req.query.limit);

  return res.status(200).json({
    success: true,
    data: images,
  });
});

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload
 * @access  Public / Admin
 */
export const uploadImages = asyncHandler(async (req, res) => {
  const uploadedImages = await processImageUploads(req.files);

  return res.status(201).json({
    success: true,
    message: "Images uploaded successfully",
    data: uploadedImages,
  });
});

/**
 * @desc    Delete an image
 * @route   DELETE /api/upload/:id
 * @access  Public / Admin
 */
export const deleteImage = asyncHandler(async (req, res) => {
  await removeImage(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});
