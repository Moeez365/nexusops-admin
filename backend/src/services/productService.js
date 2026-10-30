import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Collection from "../models/collectionModel.js";
import { escapeRegex } from "../utils/sanitize.js";

/**
 * Synchronize product reference inside assigned collections
 */
export const syncProductCollections = async (productId, collectionIds) => {
  if (!Array.isArray(collectionIds)) return;

  await Promise.all([
    Collection.updateMany(
      { _id: { $in: collectionIds } },
      { $addToSet: { products: productId } }
    ),
    Collection.updateMany(
      { _id: { $nin: collectionIds }, products: productId },
      { $pull: { products: productId } }
    ),
  ]);
};

/**
 * Create a new product or update existing if ID is provided
 */
export const createOrUpdateProduct = async ({ productId, productData, collections }) => {
  if (productId) {
    const existingProduct = await Product.findByIdAndUpdate(productId, productData, {
      new: true,
      runValidators: true,
    }).populate("images");

    if (!existingProduct) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    await syncProductCollections(existingProduct._id, collections);

    return { product: existingProduct, isNew: false };
  }

  const newProduct = await Product.create(productData);
  await newProduct.populate("images");
  await syncProductCollections(newProduct._id, collections);

  return { product: newProduct, isNew: true };
};

/**
 * Fetch products list with filtering, searching, sorting, and tab aggregation counts
 */
export const getProductsList = async (queryParams = {}) => {
  const { search, status, category, collection, sortBy, isActive } = queryParams;
  const filter = {};

  // Status filtering
  if (status === "active") {
    filter.isActive = true;
    filter.stock = { $gt: 0 };
  } else if (status === "low_stock") {
    filter.isActive = true;
    filter.stock = { $gt: 0, $lte: 10 };
  } else if (status === "out_of_stock") {
    filter.isActive = true;
    filter.stock = { $lte: 0 };
  } else if (status === "draft") {
    filter.isActive = false;
  } else if (isActive === "true") {
    filter.isActive = true;
  } else if (isActive === "false") {
    filter.isActive = false;
  }

  // Category filtering
  if (category && category.trim()) {
    filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
  }

  // Collection filtering
  if (collection && collection.trim()) {
    const collectionId = collection.trim();
    if (mongoose.Types.ObjectId.isValid(collectionId)) {
      const foundCollection = await Collection.findById(collectionId).select("products");
      filter._id = { $in: foundCollection?.products || [] };
    } else {
      filter._id = { $in: [] };
    }
  }

  // Search filter across name, category, brand, description, tags
  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [
      { name: searchRegex },
      { category: searchRegex },
      { brand: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ];
  }

  // Sorting
  const sortMap = {
    oldest: { createdAt: 1 },
    stock_asc: { stock: 1 },
    stock_desc: { stock: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  };
  const sortQuery = sortMap[sortBy] || { createdAt: -1 };

  const products = await Product.find(filter)
    .sort(sortQuery)
    .populate("images");

  // Base filter for tab counts scoped by collection or category
  const countBaseFilter = {};
  if (filter._id) {
    countBaseFilter._id = filter._id;
  }
  if (category && category.trim()) {
    countBaseFilter.category = filter.category;
  }

  const [totalCount, activeCount, outOfStockCount, draftCount, lowStockCount, distinctCategories] =
    await Promise.all([
      Product.countDocuments(countBaseFilter),
      Product.countDocuments({ ...countBaseFilter, isActive: true, stock: { $gt: 0 } }),
      Product.countDocuments({ ...countBaseFilter, isActive: true, stock: { $lte: 0 } }),
      Product.countDocuments({ ...countBaseFilter, isActive: false }),
      Product.countDocuments({ ...countBaseFilter, isActive: true, stock: { $gt: 0, $lte: 10 } }),
      Product.distinct("category"),
    ]);

  const tabCounts = {
    all: totalCount,
    active: activeCount,
    out_of_stock: outOfStockCount,
    draft: draftCount,
    low_stock: lowStockCount,
  };

  return {
    products,
    totalCount,
    tabCounts,
    categories: distinctCategories.filter(Boolean),
  };
};

/**
 * Fetch a single product by ID
 */
export const getProductById = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId).populate("images");
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Update product details
 */
export const updateProductDetails = async (productId, { collections, ...productData }) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findByIdAndUpdate(productId, productData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  await syncProductCollections(product._id, collections);

  return product;
};

/**
 * Delete a product and cleanup collections
 */
export const removeProduct = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  await Collection.updateMany(
    { products: product._id },
    { $pull: { products: product._id } }
  );

  return product;
};

