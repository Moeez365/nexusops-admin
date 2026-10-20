import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dtr9ysiiz',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '593954798635638',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'B0t_J7qwdydloEiaz3j0qOcnGNI'
};


export default config;
