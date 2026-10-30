---
name: architecture-scaffold
description: Use this skill to scaffold new full-stack features, Mongoose models, Express routes/controllers, React components, and dashboard pages matching the established Lumina e-commerce patterns.
---

# Architecture Scaffolding Protocol for Lumina E-Commerce

This skill provides step-by-step blueprints and boilerplate templates to scaffold new features, database entities, REST endpoints, and UI views. Every scaffolded module strictly adheres to the established architectural conventions of this repository.

---

## 1. Full-Stack Scaffolding Roadmap

When adding a new capability (e.g., `coupons`, `customers`, `reviews`), follow this sequential pipeline:

```
[Backend]
1. Model        -> backend/src/models/[entity]Model.js
2. Controller   -> backend/src/controllers/[entity]Controller.js
3. Route        -> backend/src/routes/[entity].js
4. Mount Route  -> backend/src/routes/index.js

[Frontend]
5. API Client   -> frontend/src/api/[entity].js
6. Constants    -> frontend/src/constants/[entity].js
7. Components   -> frontend/src/components/[domain]/[Component].jsx
8. Page View    -> frontend/src/pages/[Entity].jsx
9. App Route    -> frontend/src/App.jsx
10. Navigation  -> frontend/src/constants/navigation.js
```

---

## 2. Backend Scaffolding Blueprints

### A. Mongoose Model (`backend/src/models/[entity]Model.js`)
```javascript
import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'scheduled', 'draft', 'expired'],
    default: 'draft',
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

entitySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Entity = mongoose.models.Entity || mongoose.model('Entity', entitySchema);
export default Entity;
```

### B. Controller (`backend/src/controllers/[entity]Controller.js`)
```javascript
import Entity from '../models/entityModel.js';

const escapeRegex = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getEntities = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: escapeRegex(search), $options: 'i' };
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [entities, total] = await Promise.all([
      Entity.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Entity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        entities,
        pagination: {
          total,
          page: parseInt(page, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEntity = async (req, res) => {
  try {
    const entity = await Entity.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Created successfully',
      data: entity,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### C. Route (`backend/src/routes/[entity].js`) & Registration
```javascript
import express from 'express';
import { getEntities, createEntity } from '../controllers/entityController.js';

const router = express.Router();

router.get('/', getEntities);
router.post('/', createEntity);

export default router;
```
Register inside `backend/src/routes/index.js`:
```javascript
import entityRouter from './entity.js';
// ...
router.use('/entity', entityRouter);
```

---

## 3. Frontend Scaffolding Blueprints

### A. API Layer (`frontend/src/api/[entity].js`)
```javascript
import api from './axios.js';

export const getEntities = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  const response = await api.get('/entity', { params: cleanParams });
  return response.data;
};

export const createEntity = async (payload) => {
  const response = await api.post('/entity', payload);
  return response.data;
};
```

### B. UI Component (`frontend/src/components/[domain]/[Component].jsx`)
Always follow Lumina glassmorphism and PropTypes:

```jsx
import PropTypes from 'prop-types';
import StatusBadge from '../common/StatusBadge.jsx';

export default function EntityCard({ item, onSelect }) {
  return (
    <article className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl transition-all hover:border-primary/40">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-title-md text-on-surface">{item.name}</h3>
          <p className="font-label-mono text-xs text-on-surface-variant">{item.code}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
        >
          View Details
        </button>
      </div>
    </article>
  );
}

EntityCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    status: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};
```

### C. Page Component (`frontend/src/pages/[Entity].jsx`)
```jsx
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ListFilterToolbar from '../components/ListFilterToolbar.jsx';
import { getEntities } from '../api/entity.js';

export default function EntityPage() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    getEntities({ search })
      .then((res) => {
        if (res?.success) setEntities(res.data.entities || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search]);

  return (
    <>
      <PageHeader
        title="Entities"
        subtitle="Manage and oversee store entities"
        buttonLabel="Add Entity"
        buttonPath="/entities/new"
      />
      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <ListFilterToolbar
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search entities..."
          />
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                progress_activity
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {entities.map((item) => (
                <div key={item._id}>{item.name}</div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
```

### D. App & Navigation Registration
1. In `frontend/src/App.jsx`:
   ```jsx
   import EntityPage from './pages/Entity.jsx';
   // In Routes:
   <Route path="/entities" element={<EntityPage />} />
   ```
2. In `frontend/src/constants/navigation.js`:
   ```javascript
   {
     name: 'Entities',
     path: '/entities',
     icon: 'category', // Google Material Symbols Outlined name
   }
   ```

---

## 4. Scaffolding Verification Checklist
- [ ] Backend route responds to `GET /api/<entity>` with `{ success: true, data: [...] }`.
- [ ] Oxlint passes with 0 errors: `cd frontend && npx oxlint src`.
- [ ] Material Symbols icon exists in Google Material Symbols font set.
- [ ] Responsive behavior verified on mobile (`px-4`) and desktop (`md:px-8`).

