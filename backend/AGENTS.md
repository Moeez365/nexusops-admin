# E-Commerce Backend - AGENTS.md

## Project Overview

Professional Node.js Express backend for the Lumina luxury e-commerce platform. Provides RESTful APIs for products, collections, and media management with MongoDB persistence and Cloudinary image storage.

### Tech Stack
- **Runtime**: Node.js with ES Modules
- **Framework**: Express 4.21.0
- **Database**: MongoDB with Mongoose 7.7.0
- **File Storage**: Cloudinary CDN
- **File Upload**: Multer with disk storage
- **Logging**: Morgan + custom logger
- **Security**: CORS, environment variables
- **Development**: Nodemon hot reload

## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.js      # Cloudinary SDK configuration
│   │   ├── env.js             # Environment variables loader
│   │   └── mongoose.js        # MongoDB connection handler
│   ├── controllers/
│   │   ├── collectionController.js  # Collection business logic
│   │   ├── imageController.js       # Image upload & retrieval
│   │   ├── orderController.js       # Order CRUD & KPI aggregations
│   │   └── productController.js     # Product CRUD operations
│   ├── middleware/
│   │   └── upload.js          # Multer file upload config
│   ├── models/
│   │   ├── collectionModel.js # Collection Mongoose schema
│   │   ├── imageModel.js      # Image Mongoose schema
│   │   ├── orderModel.js      # Order Mongoose schema
│   │   └── productModel.js    # Product Mongoose schema
│   ├── routes/
│   │   ├── collections.js     # Collection routes
│   │   ├── index.js           # Router aggregator
│   │   ├── orders.js          # Order routes
│   │   ├── products.js        # Product routes
│   │   └── upload.js          # Image upload routes
│   ├── utils/
│   │   ├── cloudinaryUpload.js # Cloudinary upload utility
│   │   └── logger.js          # Custom logging utility
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── package-lock.json
```

## Database Models

### Product (`src/models/productModel.js`)
**Schema Fields:**
- `name`: String, required, trimmed
- `slug`: String, required, unique, lowercase, trimmed
- `description`: String, required
- `price`: Number, required, minimum 0
- `comparePrice`: Number, default 0, minimum 0
- `category`: String, required, trimmed
- `brand`: String, default empty
- `stock`: Number, default 0, minimum 0
- `images`: Array of Image ObjectId references
- `isFeatured`: Boolean, default false
- `isActive`: Boolean, default true
- `tags`: Array of strings, default empty
- `createdBy`: String, default 'admin'
- `createdAt`: Date, auto-generated
- `updatedAt`: Date, auto-updated on save

**Features:**
- Virtual population of image references
- Automatic timestamp updates on save
- Slug generation on pre-validate hook

### Collection (`src/models/collectionModel.js`)
**Schema Fields:**
- `name`: String, required, unique, trimmed
- `thumbnail`: Image ObjectId reference
- `slug`: String, required, unique, lowercase, trimmed
- `description`: String, default empty, trimmed
- `image`: Image ObjectId reference, default null
- `products`: Array of Product ObjectId references
- `isActive`: Boolean, default true
- `sortOrder`: Number, default 0, minimum 0
- `createdBy`: String, default 'admin'
- `seoDescription`: String, trimmed, unique

**Virtuals:**
- `itemCount`: Returns products array length

**Features:**
- Automatic slug generation from name
- JSON serialization with virtuals enabled
- Timestamps with createdAt/updatedAt

### Image (`src/models/imageModel.js`)
**Schema Fields:**
- `publicId`: String, required, trimmed (Cloudinary public ID)
- `url`: String, required, trimmed (Cloudinary URL)
- `altText`: String, default empty
- `isPrimary`: Boolean, default false
- `_tempId`: String (temporary client-side ID)
- `createdAt`: Date, auto-generated

**Features:**
- Stores Cloudinary asset references
- Supports temporary IDs during upload
- Timestamped for sorting

## API Endpoints

### Products API (`/api/products`)

| Method | Endpoint | Controller Function | Description |
|--------|----------|-------------------|-------------|
| POST | `/` | `createProduct` | Create new product or update existing |
| GET | `/` | `getProducts` | List all active products (sorted by createdAt desc) |
| GET | `/:id` | `getProductById` | Get single product by ID |
| PUT | `/:id` | `updateProduct` | Update product fields |
| DELETE | `/:id` | `deleteProduct` | Delete product permanently |

**Create/Update Logic (`createProduct`):**
- Accepts both `id` and `_id` fields in request body
- If ID provided: attempts update via `findByIdAndUpdate`
- If no ID: creates new product via `create()`
- Auto-populates image references on response

**Response Format:**
```json
{
  "success": true,
  "message": "Product created/updated successfully",
  "data": { /* product object with populated images */ }
}
```

### Collections API (`/api/collections`)

| Method | Endpoint | Controller Function | Description |
|--------|----------|-------------------|-------------|
| POST | `/` | `createCollection` | Create new collection or update existing |
| GET | `/` | `getCollections` | List collections with optional isActive filter |
| GET | `/:id` | `getCollectionById` | Get single collection by ID |
| PUT | `/:id` | `updateCollection` | Update collection fields |
| DELETE | `/:id` | `deleteCollection` | Delete collection permanently |

**Query Parameters (GET /):**
- `?isActive=true` - Filter to active collections only
- `?isActive=false` - Filter to inactive collections only
- No param: returns all collections

**Population:**
- `image` - Populates thumbnail image
- `products` - Populates product with nested image population

### Upload API (`/api/upload`)

| Method | Endpoint | Controller Function | Description |
|--------|----------|-------------------|-------------|
| GET | `/?limit=N` | `getImages` | Retrieve uploaded images with pagination |
| POST | `/` | `uploadImages` | Upload multiple images to Cloudinary |

**GET Query Parameters:**
- `limit`: Required positive integer for pagination

**POST Configuration:**
- Accepts `multipart/form-data` with `images` field
- Maximum 10 files per upload (enforced in route)
- File size limit: 5MB per file
- Accepted types: image/* (PNG, JPG, WebP)

**Workflow:**
1. Files stored temporarily in `backend/images/`
2. Uploaded to Cloudinary folder 'ecommerce'
3. Image document created in MongoDB
4. Temporary file deleted from disk
5. Document returned with Cloudinary URL

## Middleware

### Upload Middleware (`src/middleware/upload.js`)
```javascript
{
  storage: diskStorage({
    destination: path.join(__dirname, '../../images'),
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname);
      callback(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}
```

## Utility Functions

### Cloudinary Upload (`src/utils/cloudinaryUpload.js`)
- Validates file path exists before upload
- Uploads to configurable folder (default: 'ecommerce')
- Resource type: image
- Returns `{ public_id, url }` object
- Error handling with descriptive messages

### Logger (`src/utils/logger.js`)
```javascript
logger.info(message)   // console.log with [INFO] prefix
logger.warn(message)   // console.warn with [WARN] prefix
logger.error(message)  // console.error with [ERROR] prefix
```

## Server Configuration

### Environment Variables (`.env`)
```
PORT=5000                          # Server port
NODE_ENV=development               # Environment mode
MONGO_URI=mongodb://localhost:27017/ecommerce  # MongoDB connection
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Server Startup (`src/server.js`)
1. Loads environment configuration
2. Connects to MongoDB (exits on failure)
3. Starts Express server on configured PORT
4. Logs startup message with environment mode

### Express App Setup (`src/app.js`)
```javascript
app.use(cors())                    // Enable CORS
app.use(express.json())            // Parse JSON bodies
app.use(express.urlencoded())      // Parse URL-encoded bodies
app.use(morgan('dev'))             // HTTP request logging
app.get('/health', ...)            // Health check endpoint
app.use('/api', routes)            // Mount API routes
```

## Error Handling

### Controller Error Pattern
```javascript
try {
  // database operation
} catch (error) {
  res.status(400|500).json({ 
    success: false, 
    message: error.message 
  });
}
```

### ID Validation
- Uses `mongoose.Types.ObjectId.isValid()` for ObjectId checking
- Returns 400 for invalid IDs before database query
- Returns 404 if document not found

## Development Commands

```bash
# Development (hot reload)
npm run dev

# Production start
npm start
```

## Dependencies

### Production
- `cloudinary@2.10.0` - Cloud image storage
- `cors@2.8.4` - Cross-origin resource sharing
- `dotenv@16.4.0` - Environment variable loading
- `express@4.21.0` - Web framework
- `mongoose@7.7.0` - MongoDB ODM
- `morgan@1.10.0` - HTTP request logging
- `multer@1.4.4` - File upload handling

### Development
- `nodemon@3.1.0` - Hot reload development server

## Common Patterns

### ID-Based Upsert (Create/Update)
```javascript
export const createOrUpdate = async (req, res) => {
  const { id, _id, ...data } = req.body;
  const targetId = id || _id;
  
  if (targetId) {
    const doc = await Model.findByIdAndUpdate(targetId, data, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: doc });
  }
  
  const newDoc = await Model.create(data);
  return res.status(201).json({ success: true, data: newDoc });
};
```

### Population Pattern
```javascript
// Single level
.populate('images')

// Multiple levels with nesting
.populate([
  { path: 'image' },
  { path: 'products', populate: { path: 'images' } }
])
```

### File Upload with Cleanup
```javascript
// Upload
const result = await cloudinary.uploader.upload(filePath);

// Cleanup temporary file
fs.unlink(filePath, (err) => {
  if (err) console.error('Failed to delete temp file:', err);
});

// Error cleanup
req.files.forEach(file => {
  if (file.path) fs.unlink(file.path, () => {});
});
```

## Database Connection

### MongoDB Connection (`src/config/mongoose.js`)
- Uses Mongoose 7 connection API
- Validates MONGO_URI presence
- Logs connection success/failure
- Exits process on connection failure

## Cloudinary Configuration

### Setup (`src/config/cloudinary.js`)
```javascript
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true
});
```

## Health Check

**Endpoint:** `GET /health`
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

## Best Practices

1. **ID Validation**: Always validate ObjectId before database operations
2. **Error Handling**: Return consistent `{ success, message, data? }` responses
3. **Population**: Populate related documents in responses for frontend convenience
4. **File Cleanup**: Always delete temporary files after Cloudinary upload
5. **Mongoose Options**: Use `new: true` for update operations to return updated document
6. **Environment Security**: Never commit `.env` files; use `.env.example` as template
7. **Logging**: Use custom logger for consistent output format
8. **CORS**: Configure for specific origins in production

## Troubleshooting

### Common Issues
1. **MongoDB Connection Failed**: Verify MONGO_URI in `.env`, check MongoDB running
2. **Cloudinary Upload Errors**: Verify API credentials, check file size limits
3. **Multer File Not Found**: Ensure `backend/images/` directory exists
4. **CORS Errors**: Check frontend proxy configuration in `vite.config.js`
5. **Population Not Working**: Verify model references match Schema definitions

### Debug Steps
1. Check server logs for error messages
2. Verify environment variables loaded correctly
3. Test MongoDB connection independently
4. Validate Cloudinary credentials in dashboard
5. Check network tab for failed API requests

## API Integration Notes

- Base URL: `http://localhost:5000` (development)
- All responses include `success` boolean
- Error responses include `message` string
- Successful create/update responses include `data` object
- Frontend should proxy through `/api` to avoid CORS issues
- Use consistent error codes (400 for bad input, 404 for not found, 500 for server errors)

## Project Goals

- Provide clean, predictable REST API for e-commerce operations
- Enable efficient image management via Cloudinary CDN
- Support complex document relationships via MongoDB
- Maintain separation of concerns (controllers, routes, models)
- Simplify frontend integration with consistent response formats