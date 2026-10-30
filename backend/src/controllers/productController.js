import asyncHandler from "../utils/asyncHandler.js";
import {
  createOrUpdateProduct,
  getProductsList,
  getProductById as fetchProductById,
  updateProductDetails,
  removeProduct,
} from "../services/productService.js";

/**
 * @desc    Create a new product or update if ID is provided
 * @route   POST /api/products
 * @access  Public / Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { id, _id, collections, ...productData } = req.body;
  const productId = id || _id;

  const { product, isNew } = await createOrUpdateProduct({
    productId,
    productData,
    collections,
  });

  return res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? "Product created successfully" : "Product updated successfully",
    data: product,
  });
});

/**
 * @desc    Get all products with filtering, search, and tab counts
 * @route   GET /api/products
 * @access  Public / Admin
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { products, totalCount, tabCounts, categories } = await getProductsList(req.query);

  return res.status(200).json({
    success: true,
    count: products.length,
    total: totalCount,
    tabCounts,
    categories,
    data: products,
  });
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public / Admin
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await fetchProductById(req.params.id);

  return res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * @desc    Update product details
 * @route   PUT /api/products/:id
 * @access  Public / Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await updateProductDetails(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Public / Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await removeProduct(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Product deleted",
  });
});
