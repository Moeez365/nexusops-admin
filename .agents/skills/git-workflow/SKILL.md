---
name: git-workflow
description: Use this skill to craft standardized conventional commit messages, branch naming strategies, and pull request descriptions tailored to the Lumina e-commerce repository.
---

# Git Workflow & Conventional Commits Protocol

This skill enforces consistent git version control practices across the **Lumina E-Commerce** repository. It standardizes branch names, commit formats, pre-commit quality gates, and Pull Request (PR) templates.

---

## 1. Conventional Commit Specification

All commits must follow the **Conventional Commits 1.0.0** standard:

```
<type>(<scope>): <short imperative description>

[optional body explaining motivation and details]

[optional footer(s) like Closes #123, BREAKING CHANGE: ...]
```

### Allowed Types

| Type | When to Use | Example |
| :--- | :--- | :--- |
| `feat` | Adding a new capability or endpoint | `feat(orders): add live order status update dropdown` |
| `fix` | Resolving a bug, crash, or regression | `fix(frontend): resolve SAMPLE_ORDERS_DATA ReferenceError in Orders.jsx` |
| `refactor` | Code restructuring with no behavior change | `refactor(backend): streamline syncProductCollections query logic` |
| `style` | Formatting, design token alignment, whitespace | `style(dashboard): update card backdrop-blur and border tokens` |
| `perf` | Optimizations improving runtime speed/memory | `perf(media): add shimmer placeholder for Cloudinary image loads` |
| `test` | Adding, updating, or correcting tests | `test(controllers): add unit tests for getOrderStats endpoint` |
| `docs` | Documentation updates (README, AGENTS.md) | `docs(skills): add git-workflow and unit-testing protocols` |
| `chore` | Dependency bumps, configs, build scripts | `chore(gitignore): ignore backend uploads and system logs` |

### Recognized Scopes in this Repository

Use the scope that best pinpoints the subsystem affected:
- `frontend` – Global frontend changes (e.g. `App.jsx`, `main.jsx`, `index.css`)
- `backend` – Global backend changes (e.g. `app.js`, `server.js`, `mongoose.js`)
- `orders` – Orders queue, order statistics, order creation
- `products` – Product inventory, create/edit product form, pricing
- `collections` – Collections management and hierarchy
- `media` – Cloudinary image uploads, gallery picker, preview modals
- `dashboard` – Executive overview, KPI metric cards, compose charts
- `inventory` – Stock monitoring, inventory filtering, bulk updates
- `settings` – Store configuration, fulfillment nodes, tax settings
- `analytics` – Telemetry, revenue metrics, performance charts
- `api` – Axios client layer or backend route definitions

---

## 2. Branch Naming Conventions

Branches should reflect the intent and scope:

- **Features**: `feat/<scope>-<kebab-case-description>`  
  *Example*: `feat/orders-status-filter`
- **Bug Fixes**: `fix/<scope>-<kebab-case-description>`  
  *Example*: `fix/dashboard-chart-dummy-data`
- **Refactoring**: `refactor/<scope>-<description>`  
  *Example*: `refactor/api-client-error-handling`
- **Chores / Maintenance**: `chore/<description>`  
  *Example*: `chore/oxlint-rule-updates`

---

## 3. Pre-Commit Quality Gate

Before staging and committing code, execute the pre-commit quality check:

```bash
# 1. Run Oxlint in frontend (must exit with 0 errors)
cd frontend && npm run lint

# 2. Verify git status to ensure untracked sensitive files (.env, raw uploads) are excluded
git status --short
```

> [!CAUTION]
> Never commit `.env`, `backend/images/*` (except `.gitkeep`), or API credentials. Confirm your `.gitignore` is intact before committing.

---

## 4. Pull Request (PR) Template

When preparing a Pull Request, use the standard Lumina PR template:

```markdown
## Summary
<!-- Concise 1-2 sentence description of what this PR achieves -->

## Problem & Motivation
<!-- Explain the bug being fixed or the business need for this feature -->

## Key Changes
### Frontend
- Added `[Component/Page]` implementing Lumina design tokens.
- Connected `[API function]` to fetch live data instead of mock constants.

### Backend
- Added `[Route/Controller]` handling `[Action]`.
- Implemented Mongoose validation and error envelope `{ success: true, data }`.

## Testing & Verification
- [ ] Ran `cd frontend && npm run lint` (0 errors, 0 warnings).
- [ ] Verified UI on desktop and mobile breakpoints.
- [ ] Tested endpoint with valid and invalid payloads.

## Checklist
- [ ] No hardcoded colors; all styles use `tailwind.config.js` design tokens.
- [ ] All props defined with `PropTypes`.
- [ ] No secret keys or `.env` files tracked.
- [ ] Conventional commit messages used throughout the branch.
```

