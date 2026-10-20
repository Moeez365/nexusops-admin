import express from 'express';
import {
  createCollection,
  deleteCollection,
  getCollections,
  getCollectionById,
  updateCollection
} from '../controllers/collectionController.js';

const router = express.Router();

router.post('/', createCollection);
router.get('/', getCollections);
router.get('/:id', getCollectionById);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;
