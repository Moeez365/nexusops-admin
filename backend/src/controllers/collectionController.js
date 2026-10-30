import asyncHandler from "../utils/asyncHandler.js";
import {
  createOrUpdateCollection,
  getCollectionsList,
  getCollectionById as fetchCollectionById,
  updateCollectionDetails,
  removeCollection,
} from "../services/collectionService.js";

/**
 * @desc    Create a new collection or update if ID is provided
 * @route   POST /api/collections
 * @access  Public / Admin
 */
export const createCollection = asyncHandler(async (req, res) => {
  const { id, _id, ...collectionData } = req.body;
  const collectionId = id || _id;

  const { collection, isNew } = await createOrUpdateCollection(collectionData, collectionId);

  return res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? "Collection created successfully" : "Collection updated successfully",
    data: collection,
  });
});

/**
 * @desc    Get all collections with filters and tab counts
 * @route   GET /api/collections
 * @access  Public / Admin
 */
export const getCollections = asyncHandler(async (req, res) => {
  const { collections, totalCount, tabCounts } = await getCollectionsList(req.query);

  return res.status(200).json({
    success: true,
    count: collections.length,
    total: totalCount,
    tabCounts,
    data: collections,
  });
});

/**
 * @desc    Get single collection by ID
 * @route   GET /api/collections/:id
 * @access  Public / Admin
 */
export const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await fetchCollectionById(req.params.id);

  return res.status(200).json({
    success: true,
    data: collection,
  });
});

/**
 * @desc    Update collection details
 * @route   PUT /api/collections/:id
 * @access  Public / Admin
 */
export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await updateCollectionDetails(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Collection updated successfully",
    data: collection,
  });
});

/**
 * @desc    Delete a collection
 * @route   DELETE /api/collections/:id
 * @access  Public / Admin
 */
export const deleteCollection = asyncHandler(async (req, res) => {
  await removeCollection(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Collection deleted successfully",
  });
});
