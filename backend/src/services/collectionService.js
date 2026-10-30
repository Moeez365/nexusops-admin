import mongoose from "mongoose";
import Collection from "../models/collectionModel.js";
import { escapeRegex } from "../utils/sanitize.js";

const COLLECTION_POPULATION = [
  { path: "image" },
  { path: "products", populate: { path: "images" } },
];

/**
 * Create or update collection
 */
export const createOrUpdateCollection = async (collectionData, collectionId) => {
  if (collectionId) {
    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      const error = new Error("Invalid collection ID");
      error.statusCode = 400;
      throw error;
    }

    const updatedCollection = await Collection.findByIdAndUpdate(collectionId, collectionData, {
      new: true,
      runValidators: true,
    }).populate(COLLECTION_POPULATION);

    if (!updatedCollection) {
      const error = new Error("Collection not found");
      error.statusCode = 404;
      throw error;
    }

    return { collection: updatedCollection, isNew: false };
  }

  const newCollection = await Collection.create(collectionData);
  await newCollection.populate(COLLECTION_POPULATION);

  return { collection: newCollection, isNew: true };
};

/**
 * Fetch collections list with filters, search, and tab aggregation counts
 */
export const getCollectionsList = async (queryParams = {}) => {
  const { search, status, sortBy, isActive } = queryParams;
  const filter = {};

  // Status filter
  if (status === "active" || isActive === "true") {
    filter.isActive = true;
  } else if (status === "draft" || isActive === "false") {
    filter.isActive = false;
  } else if (status === "has_products") {
    filter["products.0"] = { $exists: true };
  } else if (status === "empty") {
    filter.$or = [{ products: { $exists: false } }, { products: { $size: 0 } }];
  }

  // Search filter across name, description, slug
  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
    const searchCondition = [
      { name: searchRegex },
      { description: searchRegex },
      { slug: searchRegex },
    ];

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
      delete filter.$or;
    } else {
      filter.$or = searchCondition;
    }
  }

  // Sorting
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  };
  const sortQuery = sortMap[sortBy] || { sortOrder: 1, createdAt: -1 };

  const collections = await Collection.find(filter)
    .sort(sortQuery)
    .populate(COLLECTION_POPULATION);

  const [totalCount, activeCount, draftCount, hasProductsCount, emptyCount] = await Promise.all([
    Collection.countDocuments(),
    Collection.countDocuments({ isActive: true }),
    Collection.countDocuments({ isActive: false }),
    Collection.countDocuments({ "products.0": { $exists: true } }),
    Collection.countDocuments({
      $or: [{ products: { $exists: false } }, { products: { $size: 0 } }],
    }),
  ]);

  const tabCounts = {
    all: totalCount,
    active: activeCount,
    draft: draftCount,
    has_products: hasProductsCount,
    empty: emptyCount,
  };

  return {
    collections,
    totalCount,
    tabCounts,
  };
};

/**
 * Fetch single collection by ID
 */
export const getCollectionById = async (collectionId) => {
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    const error = new Error("Invalid collection ID");
    error.statusCode = 400;
    throw error;
  }

  const collection = await Collection.findById(collectionId).populate(COLLECTION_POPULATION);
  if (!collection) {
    const error = new Error("Collection not found");
    error.statusCode = 404;
    throw error;
  }

  return collection;
};

/**
 * Update collection details
 */
export const updateCollectionDetails = async (collectionId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    const error = new Error("Invalid collection ID");
    error.statusCode = 400;
    throw error;
  }

  const collection = await Collection.findByIdAndUpdate(collectionId, updateData, {
    new: true,
    runValidators: true,
  }).populate(COLLECTION_POPULATION);

  if (!collection) {
    const error = new Error("Collection not found");
    error.statusCode = 404;
    throw error;
  }

  return collection;
};

/**
 * Delete a collection
 */
export const removeCollection = async (collectionId) => {
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    const error = new Error("Invalid collection ID");
    error.statusCode = 400;
    throw error;
  }

  const collection = await Collection.findByIdAndDelete(collectionId);
  if (!collection) {
    const error = new Error("Collection not found");
    error.statusCode = 404;
    throw error;
  }

  return collection;
};

