import express from 'express';
import upload from '../middleware/upload.js';
import { deleteImage, getImages, uploadImages } from '../controllers/imageController.js';

const uploadRouter = express.Router();

uploadRouter.get('/', getImages);
uploadRouter.post('/', upload.array('images', 10), uploadImages);
uploadRouter.delete('/:id', deleteImage);

export default uploadRouter;
