---
name: code-review
description: Use this skill to audit code diffs, pull requests, or proposed modifications for correctness, edge cases, React 19 / Node.js ES Modules best practices, and security vulnerabilities across the Lumina e-commerce frontend and backend.
---

# Code Review Protocol for Lumina E-Commerce

This skill provides an automated, rigorous protocol to audit code changes across the **Lumina** luxury e-commerce platform. It ensures adherence to the repository's architectural standards, design token integrity, security controls, and high-performance React 19 / Express ES Modules conventions.

---

## 1. Scope & Tech Stack Alignment

When auditing code, verify compliance against the detected stack:

- **Frontend**:
  - React 19 (`react: ^19.2.7`, `react-dom: ^19.2.7`) with Functional Components and React Hooks.
  - React Router DOM v7 (`react-router-dom: ^7.18.1`).
  - Tailwind CSS v4 (`@tailwindcss/vite: ^4.3.3`) with Lumina Design Tokens (`tailwind.config.js`).
  - Linting: Oxlint (`oxlint: ^1.71.0`) with 0 errors and 0 warnings requirement.
  - UI Icons: Google Material Symbols Outlined (with `.icons-loaded` CSS fallback).
  - API Client: Axios (`frontend/src/api/axios.js`) configured with base `/api`.
- **Backend**:
  - Node.js native ES Modules (`"type": "module"` in `package.json`).
  - Express v4 (`express: ^4.21.0`) modular routing (`backend/src/routes/`).
  - MongoDB via Mongoose v7 (`mongoose: ^7.7.0`).
  - File upload pipeline: Multer (`backend/src/middleware/upload.js`) + Cloudinary (`backend/src/utils/cloudinaryUpload.js`).
  - Centralized logger (`backend/src/utils/logger.js`) and environment config (`backend/src/config/env.js`).

---

## 2. Review Checklist

### A. Frontend Verification (React 19 & Lumina UI)

1. **React 19 & Hook Rules**:
   - [ ] No hook calls inside conditionals, loops, or nested functions.
   - [ ] `useEffect` hooks declare all external dependencies or pass exhaustive dependency arrays.
   - [ ] Asynchronous calls in hooks/effects support `AbortController` signals to prevent state updates after unmount.
   - [ ] No state mutations (always use functional state updates or pure transformations).
   - [ ] No duplicate default exports or broken export statements (e.g., duplicate `export default App;`).

2. **PropTypes & Static Validation**:
   - [ ] All reusable components in `frontend/src/components/` define comprehensive `Component.propTypes`.
   - [ ] Required props explicitly use `.isRequired`.
   - [ ] `defaultProps` or ES6 default parameter values provided for non-required props.
   - [ ] Code passes Oxlint cleanly:
     ```bash
     cd frontend && npx oxlint src
     ```

3. **Lumina Design System & Token Integrity**:
   - [ ] Adheres to tokens in `DESIGN_SYSTEM.md` and `tailwind.config.js`.
   - [ ] **No arbitrary hardcoded colors** (e.g. avoid `#6d3bd7`, `rgb(...)` in inline classes; use `bg-primary`, `text-on-surface`, `bg-surface-container/70`).
   - [ ] Cards implement standard elevation:
     ```jsx
     className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl"
     ```
   - [ ] Status badges utilize `StatusBadge.jsx` or tokens (`bg-primary-container`, `text-primary`, `bg-error-container`).
   - [ ] Font classes respect typography scale (`font-display-lg`, `font-headline-lg`, `font-title-md`, `font-body-md`, `font-label-mono`).

4. **API Integration & Data Handling**:
   - [ ] All HTTP calls route through dedicated functions in `frontend/src/api/`.
   - [ ] Query parameters are sanitized (empty strings, null, undefined are stripped before dispatch).
   - [ ] URL parameters are escaped with `encodeURIComponent(id)`.
   - [ ] Loading indicators, error banners, and empty data states are provided for all async views.

---

### B. Backend Verification (Express & Mongoose)

1. **Controller & Route Conventions**:
   - [ ] All controller handlers are `async (req, res)` wrapped in `try/catch` blocks.
   - [ ] Responses return standardized JSON envelopes:
     - Success: `res.status(200|201).json({ success: true, message?: string, data?: any })`
     - Error: `res.status(400|404|500).json({ success: false, message: error.message })`
   - [ ] Appropriate HTTP status codes used:
     - `200` OK for reads/updates.
     - `201` Created for resource creation.
     - `400` Bad Request for validation errors.
     - `404` Not Found when resource does not exist.
     - `500` Internal Server Error for unhandled exceptions.

2. **Mongoose Models & Query Hygiene**:
   - [ ] Schema fields validate constraints (`required`, `trim`, `min`, `enum`).
   - [ ] Search queries using regex escape user input using `escapeRegex` to prevent ReDoS attacks:
     ```javascript
     const escapeRegex = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     ```
   - [ ] ObjectId checks: Verify valid MongoDB ObjectId before querying (`mongoose.Types.ObjectId.isValid(id)`).
   - [ ] Proper relationship management: Relational updates (e.g., adding a product to collections) update both sides or clean up orphaned references.

3. **Upload & Media Pipelines**:
   - [ ] Multer upload limits enforce max file size (5MB per image) and image MIME types.
   - [ ] Temporary disk buffers or files are properly uploaded to Cloudinary and cleared.
   - [ ] Cloudinary public IDs and URLs are safely stored in `Image` collection.

---

### C. Security & Environment Checks

- [ ] **No Hardcoded Secrets**: MongoDB connection strings, Cloudinary API keys/secrets, and tokens must only be loaded via `backend/src/config/env.js`.
- [ ] **CORS Configuration**: Requests from frontend client are properly permitted without wildcard vulnerabilities in production.
- [ ] **No Sensitive Data Leaks**: Passwords, server paths, or internal stack traces are never exposed in JSON responses.

---

## 3. Review Output Format

When conducting a code review, structure your audit output using the following template:

```markdown
### 📋 Code Review Summary
- **Target Files / Diffs**: `<file list>`
- **Overall Verdict**: `APPROVED` | `NEEDS WORK` | `CRITICAL BLOCKERS`

#### 🔴 Critical Issues (Blockers)
- *File:Line*: Description of bug, crash hazard, or security flaw.
  - *Recommendation*: Exact code fix.

#### 🟡 Warnings & Best Practice Suggestions
- *File:Line*: Performance, Oxlint warning, or design token misalignment.
  - *Recommendation*: Preferred alternative.

#### 🟢 Positive Highlights
- Clean architectural patterns, effective memoization, or robust error handling observed.

#### 🧪 Verification Steps
1. Run `cd frontend && npm run lint`
2. Test affected endpoints/pages
```

