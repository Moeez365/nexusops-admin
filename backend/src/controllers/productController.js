import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Collection from '../models/collectionModel.js';

const escapeRegex = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const syncProductCollections = async (productId, collectionIds) => {
  if (!Array.isArray(collectionIds)) return;

  await Promise.all([
    Collection.updateMany(
      { _id: { $in: collectionIds } },
      { $addToSet: { products: productId } }
    ),
    Collection.updateMany(
      { _id: { $nin: collectionIds }, products: productId },
      { $pull: { products: productId } }
    )
  ]);
};

export const createProduct = async (req, res) => {
  try {
    const { id, _id, collections, ...productData } = req.body;
    const productId = id || _id;

    if (productId) {
      const product = await Product.findByIdAndUpdate(productId, productData, {
        new: true,
        runValidators: true
      }).populate('images');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await syncProductCollections(product._id, collections);

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    }

    const product = await Product.create(productData);
    await product.populate('images');
    await syncProductCollections(product._id, collections);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { search, status, category, collection, sortBy, isActive } = req.query;
    const filter = {};

    // Status filter
    if (status === 'active') {
      filter.isActive = true;
      filter.stock = { $gt: 0 };
    } else if (status === 'low_stock') {
      filter.isActive = true;
      filter.stock = { $gt: 0, $lte: 10 };
    } else if (status === 'out_of_stock') {
      filter.isActive = true;
      filter.stock = { $lte: 0 };
    } else if (status === 'draft') {
      filter.isActive = false;
    } else if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    // Category filter
    if (category && category.trim()) {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    // Collection filter
    if (collection && collection.trim()) {
      if (mongoose.Types.ObjectId.isValid(collection.trim())) {
        const foundCollection = await Collection.findById(collection.trim()).select('products');
        if (foundCollection && Array.isArray(foundCollection.products)) {
          filter._id = { $in: foundCollection.products };
        } else {
          filter._id = { $in: [] };
        }
      } else {
        filter._id = { $in: [] };
      }
    }

    // Search filter across name, category, brand, description, tags
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortQuery = { createdAt: 1 };
    } else if (sortBy === 'stock_asc') {
      sortQuery = { stock: 1 };
    } else if (sortBy === 'stock_desc') {
      sortQuery = { stock: -1 };
    } else if (sortBy === 'price_asc') {
      sortQuery = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sortQuery = { price: -1 };
    } else if (sortBy === 'name_asc') {
      sortQuery = { name: 1 };
    } else if (sortBy === 'name_desc') {
      sortQuery = { name: -1 };
    }

    const products = await Product.find(filter)
      .sort(sortQuery)
      .populate('images');

    // Tab counts base filter: scoped by collection or category if specified
    const countBaseFilter = {};
    if (filter._id) {
      countBaseFilter._id = filter._id;
    }
    if (category && category.trim()) {
      countBaseFilter.category = filter.category;
    }

    const [totalCount, activeCount, outOfStockCount, draftCount, lowStockCount, distinctCategories] = await Promise.all([
      Product.countDocuments(countBaseFilter),
      Product.countDocuments({ ...countBaseFilter, isActive: true, stock: { $gt: 0 } }),
      Product.countDocuments({ ...countBaseFilter, isActive: true, stock: { $lte: 0 } }),
      Product.countDocuments({ ...countBaseFilter, isActive: false }),
      Product.countDocuments({ ...countBaseFilter, isActive: true, stock: { $gt: 0, $lte: 10 } }),
      Product.distinct('category')
    ]);

    const tabCounts = {
      all: totalCount,
      active: activeCount,
      out_of_stock: outOfStockCount,
      draft: draftCount,
      low_stock: lowStockCount,
    };

    res.json({
      success: true,
      count: products.length,
      total: totalCount,
      tabCounts,
      categories: distinctCategories.filter(Boolean),
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('images');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { collections, ...productData } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await syncProductCollections(product._id, collections);

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Collection.updateMany(
      { products: product._id },
      { $pull: { products: product._id } }
    );

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
