---
name: unit-testing
description: Use this skill when writing, mocking, debugging, or running unit and integration tests for frontend React components/hooks and backend Express routes/controllers in nexusops-admin.
---

# Unit & Integration Testing Protocol for nexusops-admin (NexaOps Admin)

This skill defines the official testing framework, test directory structures, mocking strategies, and execution commands for both the **frontend** (React 19, Vite) and **backend** (Node.js ES Modules, Express, Mongoose).

---

## 1. Test Architecture & Directory Conventions

### Frontend Test Structure
- **Framework**: [Vitest](https://vitest.dev/) with `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`.
- **Location**: Co-located in `__tests__/` directories adjacent to the source, or named `*.test.jsx`:
  - Components: `frontend/src/components/**/__tests__/[ComponentName].test.jsx`
  - Pages: `frontend/src/pages/__tests__/[PageName].test.jsx`
  - Hooks: `frontend/src/hooks/__tests__/[HookName].test.js`
  - Utilities: `frontend/src/utils/__tests__/[UtilName].test.js`
- **Config**: Configured in `frontend/vite.config.js` with `test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js' }`.

### Backend Test Structure
- **Framework**: Vitest (or Node.js native test runner) with `supertest` for HTTP integration tests.
- **Location**:
  - Controller & API integration tests: `backend/tests/controllers/[controller].test.js`
  - Route tests: `backend/tests/routes/[route].test.js`
  - Utility/Service tests: `backend/tests/utils/[util].test.js`

---

## 2. Test Execution Commands

### Running Frontend Tests
```bash
# Run all frontend tests once
cd frontend && npx vitest run

# Run frontend tests in watch mode
cd frontend && npx vitest

# Run a specific component test
cd frontend && npx vitest run src/components/common/__tests__/StatusBadge.test.jsx

# Run tests with coverage report
cd frontend && npx vitest run --coverage
```

### Running Backend Tests
```bash
# Run all backend tests once
cd backend && npx vitest run

# Run a specific backend test suite
cd backend && npx vitest run tests/controllers/orderController.test.js
```

---

## 3. Mocking Protocols

### A. Mocking Frontend Axios API (`frontend/src/api/axios.js`)
Always mock the base Axios client or the domain API module to keep tests fast, deterministic, and isolated from live networks.

```jsx
import { vi } from 'vitest';
import api from '../api/axios.js';

vi.mock('../api/axios.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
```

### B. Mocking React Router Navigation
When testing components that rely on routing, wrap them in `MemoryRouter` or mock `useNavigate`:

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};
```

### C. Mocking Backend Mongoose Models & Cloudinary
Isolate controllers from MongoDB during unit tests by mocking Mongoose model methods:

```javascript
import { vi } from 'vitest';
import Product from '../../src/models/productModel.js';

vi.mock('../../src/models/productModel.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));
```

---

## 4. Standard Test Templates

### Template 1: Frontend Component Test (`StatusBadge.test.jsx`)
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge.jsx';

describe('StatusBadge Component', () => {
  it('renders active status with correct styling tokens', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText(/active/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-emerald-600');
  });

  it('renders fallback badge gracefully for unknown status', () => {
    render(<StatusBadge status="non_existent" />);
    const badge = screen.getByText(/non_existent/i);
    expect(badge).toBeInTheDocument();
  });
});
```

### Template 2: Custom Hook Test (`useImageLoader.test.js`)
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageLoader } from '../useImageLoader.js';

describe('useImageLoader Hook', () => {
  it('initializes in loading state and transitions on load', () => {
    const { result } = renderHook(() => useImageLoader('https://example.com/img.jpg'));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
  });
});
```

### Template 3: Backend Controller Integration Test (`orderController.test.js`)
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import ordersRouter from '../../src/routes/orders.js';
import Order from '../../src/models/orderModel.js';

vi.mock('../../src/models/orderModel.js');

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

describe('Order Controller - Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/orders returns list of orders', async () => {
    const mockOrders = [
      { _id: 'ord_1', orderNumber: 'ORD-101', totalAmount: 250, status: 'pending' },
    ];
    Order.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockOrders),
    });
    Order.countDocuments.mockResolvedValue(1);

    const res = await request(app).get('/api/orders');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.orders[0].orderNumber).toBe('ORD-101');
  });

  it('GET /api/orders/:id returns 404 when order is not found', async () => {
    Order.findById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });

    const res = await request(app).get('/api/orders/nonexistent_id');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
```

---

## 5. Edge Case Testing Checklist

Whenever authoring unit tests, ensure coverage for:
- [ ] **Empty States**: Data sets with 0 items return friendly UI messaging, not `Cannot read properties of undefined`.
- [ ] **Network Errors**: API rejections (`500 Internal Server Error`, network disconnect) display dismissable error banners.
- [ ] **Payload Sanitization**: Invalid characters, extreme numbers, negative prices, or missing required fields trigger validation warnings.
- [ ] **Async Cancellation**: Components unmounting while requests are in-flight do not cause memory leak warnings.

