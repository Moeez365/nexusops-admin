import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

const connectDatabase = async () => {
  const { MONGO_URI } = config;

  if (!MONGO_URI) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDatabase;
