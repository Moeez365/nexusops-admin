import mongoose from 'mongoose';
import Collection from '../models/collectionModel.js';

const collectionPopulation = [
  { path: 'image' },
  { path: 'products', populate: { path: 'images' } }
];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createCollection = async (req, res) => {
  try {
    const { id, _id, ...collectionData } = req.body;
    const collectionId = id || _id;

    if (collectionId) {
      if (!isValidId(collectionId)) {
        return res.status(400).json({ success: false, message: 'Invalid collection ID' });
      }

      const collection = await Collection.findByIdAndUpdate(collectionId, collectionData, {
        new: true,
        runValidators: true
      }).populate(collectionPopulation);

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Collection not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Collection updated successfully',
        data: collection
      });
    }

    const collection = await Collection.create(collectionData);
    await collection.populate(collectionPopulation);

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getCollections = async (req, res) => {
  try {
    const { search, status, sortBy, isActive } = req.query;
    const filter = {};

    // Status filter
    if (status === 'active' || isActive === 'true') {
      filter.isActive = true;
    } else if (status === 'draft' || isActive === 'false') {
      filter.isActive = false;
    } else if (status === 'has_products') {
      filter['products.0'] = { $exists: true };
    } else if (status === 'empty') {
      filter.$or = [
        { products: { $exists: false } },
        { products: { $size: 0 } }
      ];
    }

    // Search filter across name, description, slug
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      const searchCondition = [
        { name: searchRegex },
        { description: searchRegex },
        { slug: searchRegex }
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    // Sorting
    let sortQuery = { sortOrder: 1, createdAt: -1 };
    if (sortBy === 'newest') {
      sortQuery = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortQuery = { createdAt: 1 };
    } else if (sortBy === 'name_asc') {
      sortQuery = { name: 1 };
    } else if (sortBy === 'name_desc') {
      sortQuery = { name: -1 };
    }

    let collections = await Collection.find(filter)
      .sort(sortQuery)
      .populate(collectionPopulation);

    // Array size sorting if requested
    if (sortBy === 'products_desc') {
      collections.sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0));
    } else if (sortBy === 'products_asc') {
      collections.sort((a, b) => (a.products?.length || 0) - (b.products?.length || 0));
    }

    // Tab counts
    const [allCount, activeCount, draftCount, hasProductsCount, emptyCount] = await Promise.all([
      Collection.countDocuments({}),
      Collection.countDocuments({ isActive: true }),
      Collection.countDocuments({ isActive: false }),
      Collection.countDocuments({ 'products.0': { $exists: true } }),
      Collection.countDocuments({
        $or: [{ products: { $exists: false } }, { products: { $size: 0 } }]
      }),
    ]);

    const tabCounts = {
      all: allCount,
      active: activeCount,
      draft: draftCount,
      has_products: hasProductsCount,
      empty: emptyCount,
    };

    return res.status(200).json({
      success: true,
      count: collections.length,
      tabCounts,
      data: collections
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid collection ID' });
    }

    const collection = await Collection.findById(req.params.id).populate(
      collectionPopulation
    );

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    return res.status(200).json({ success: true, data: collection });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid collection ID' });
    }

    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate(collectionPopulation);

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: collection
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid collection ID' });
    }

    const collection = await Collection.findByIdAndDelete(req.params.id);

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
