---
name: clean-mern
description: Senior MERN refactoring skill enforcing clean architecture, guard clauses, modern JS, and predictable naming.
user_invocable: true
---

# Senior Full-Stack MERN Clean Code Skill

When invoked or reviewing/refactoring JavaScript code in this MERN project (`nexusops-admin`), apply these rules:

---

## 1. Architecture & Separation of Concerns

### Backend: Thin Controllers & Dedicated Service Layer
- **Keep Express route controllers thin**: Controllers should only parse request parameters, call a service/model method, and format the HTTP response.
- **Move queries and domain logic into services**: Place database operations, aggregation pipelines, and business calculations in `backend/src/services/[feature]Service.js` or Mongoose static methods.

```javascript
// ❌ Anti-pattern: Bloated controller with queries and business logic inline
export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: 'Not found' });
  order.status = req.body.status;
  await order.save();
  // Complex tax, notifications, and stock calculation code mixed in...
  res.json({ success: true, data: order });
};

//  Clean Pattern: Thin controller delegating to a dedicated service
// backend/src/controllers/orderController.js
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const updatedOrder = await orderService.changeOrderStatus({ orderId: id, status, note });
  return res.status(200).json({ success: true, data: updatedOrder });
});
```

### Frontend: UI Decoupled from Data Fetching & Side Effects
- Separate UI markup from data fetching, polling, and side effects.
- Extract complex `useEffect` flows, abort controllers, error handling, and state transitions into custom hooks inside `frontend/src/hooks/`.

```jsx
// ❌ Anti-pattern: Page component clogged with network requests and error states
export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // 50 lines of fetch logic, abort controllers, error alerts...
  }, []);
  return <div>{/* markup */}</div>;
}

//  Clean Pattern: Clean custom hook consumption
export default function OrderList() {
  const { orders, isLoading, errorMessage, reloadOrders } = useOrdersList({ status: 'active' });
  if (isLoading) return <LoadingSpinner />;
  if (errorMessage) return <ErrorBanner message={errorMessage} onRetry={reloadOrders} />;
  return <OrderTable orders={orders} />;
}
```

---

## 2. Control Flow & Flat Logic (Guard Clauses)

- **Eliminate nested `if/else` ladders**: Check for edge cases, missing data, and invalid preconditions early.
- **Keep the main happy path flat** at the base indentation level.

```javascript
// ❌ Anti-pattern: Deep nesting and else branching
async function processDiscount(order, couponCode) {
  if (couponCode) {
    const coupon = await findCoupon(couponCode);
    if (coupon) {
      if (coupon.isValid) {
        if (order.total >= coupon.minOrderValue) {
          return applyDiscount(order, coupon);
        } else {
          throw new Error('Minimum order amount not met');
        }
      } else {
        throw new Error('Coupon expired');
      }
    } else {
      throw new Error('Coupon not found');
    }
  }
  return order;
}

//  Clean Pattern: Flat control flow with guard clauses
async function processDiscount(order, couponCode) {
  if (!couponCode) return order;

  const coupon = await findCoupon(couponCode);
  if (!coupon) {
    throw new Error('Coupon not found');
  }

  if (!coupon.isValid) {
    throw new Error('Coupon expired');
  }

  if (order.total < coupon.minOrderValue) {
    throw new Error('Minimum order amount not met');
  }

  return applyDiscount(order, coupon);
}
```

---

## 3. Modern JavaScript (ES6+ Only — No TypeScript)

- **Async/Await Only**: Never chain `.then()/.catch()` promises. Always write modern `async/await`.
- **Destructure Context**: Destructure `req.body`, `req.params`, `req.query`, and component props directly at function signatures or module entries.
- **Pure / Non-Mutating Operations**:
  - Use `map`, `filter`, `reduce`, `toSorted`, and spread syntax (`[...items]`, `{ ...entity }`).
  - Never use direct mutations (e.g. `array.push()`, `delete obj.property`, `obj.field = value` on shared objects).

```javascript
// ❌ Anti-pattern: Mutation and promise chaining
function updateTags(product, newTag) {
  product.tags.push(newTag);
  return api.post('/tags', product).then(res => res.data);
}

//  Clean Pattern: Non-mutating modern async/await
async function updateTags(product, newTag) {
  const updatedProduct = {
    ...product,
    tags: [...product.tags, newTag],
  };
  const { data } = await api.post('/tags', updatedProduct);
  return data;
}
```

---

## 4. Predictable Naming & Constants

- **Functions & Handlers**: Use active `verbNoun` format (e.g., `fetchActiveOrders`, `calculateInvoiceTotal`, `handleStatusChange`, `removeProductImage`).
- **Booleans**: Always prefix with `is`, `has`, `should`, or `can` (e.g., `isPaymentVerified`, `hasActiveSubscription`, `shouldAutoFulfill`, `canEditCatalog`).
- **Module-Level Constants**: Extract magic numbers, status codes, and configuration keys into `UPPER_SNAKE_CASE` constants at module scope.
- **Prohibit vague variable names**: Replace `data`, `res2`, `val`, `temp`, `item` with semantic names like `productPayload`, `orderSummary`, `selectedCategory`.

```javascript
//  Clean Pattern: Constants & semantic naming
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_PAGE_LIMIT = 20;
const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

function calculateOrderDiscount(activeOrder, discountPercentage) {
  const isEligible = activeOrder.totalAmount > 100;
  if (!isEligible) return 0;
  return (activeOrder.totalAmount * discountPercentage) / 100;
}
```

---

## 5. Centralized Error Handling

### Backend Global Error Architecture
- Wrap asynchronous controller methods with an `asyncHandler` wrapper so unhandled rejections automatically forward to global error middleware via `next(error)`.
- Never let bare `try/catch` blocks silently swallow errors or return ambiguous status codes.

```javascript
// backend/src/utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### Frontend State Machine in Hooks
- Expose explicit flags: `isLoading`, `isSuccess`, `hasError`, `errorMessage`.
- Never leave components in indefinite pending states upon network failure.

```javascript
// frontend/src/hooks/useAsyncAction.js
export function useAsyncAction(actionFunction) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const executeAction = async (...args) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await actionFunction(...args);
      return result;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Operation failed';
      setErrorMessage(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { executeAction, isLoading, errorMessage, hasError: Boolean(errorMessage) };
}
```

