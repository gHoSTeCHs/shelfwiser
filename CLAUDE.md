# ShelfWise Project Conventions

## Architecture

1. **Service Layer Architecture** - Keep controllers thin. Business logic belongs in Services.
2. **Form Requests** - All validation must use Laravel Form Request classes.
3. **Enums** - Define all enums as PHP Enums in `app/Enums/`. Never use database-level enums.
4. **UUID Primary Keys** - All models use UUID primary keys via the `HasUuid` trait.

## Multi-Tenancy (CRITICAL)

5. **Tenant Isolation** - Every database query MUST filter by `tenant_id`:
   ```php
   Product::query()->where('tenant_id', auth()->user()->tenant_id)->get();
   app(ProductService::class)->getAllProducts();
   ```

6. **Authorization Hierarchy** - 8-level role system:
   ```
   Super Admin (999) > Owner (100) > General Manager (80) > Store Manager (60)
   > Assistant Manager (50) > Sales Rep (40) > Inventory Clerk (30) > Cashier (30)
   ```

## Stock Management

7. **Stock Changes** - Always use `StockMovementService` for audit trail:
   ```php
   app(StockMovementService::class)->adjustStock($variant, $qty, $type, $reason);
   ```

## Frontend (Inertia + React)

8. **Forms** - Use the Inertia `<Form>` component with Wayfinder controllers.
9. **Complex Forms** - Use `useForm` hook only for forms the `<Form>` component can't handle.
10. **Routing** - Actions and routes come from Wayfinder. Do not hardcode routes.
11. **UI Design** - Use `/frontend-design` skill for any new UI components or pages.
12. **Single Source of Truth** - Extract reusable logic to `lib/` folder:
    - `lib/formatters.ts` - Currency, date, number formatting
    - `lib/status-configs.ts` - Status labels, colors, badges
    - `lib/calculations.ts` - Business calculations
    - `lib/utils.ts` - General utilities

## Database Queries

13. **Explicit Query Builder** - Always use `Model::query()->` instead of `Model::queryMethod()`:
    ```php
    Product::query()->where('tenant_id', $tenantId)->get();
    Order::query()->find($id);
    Shop::query()->create($data);
    ```

## Authorization

14. **Policy-Based Authorization** - Use Laravel Policies for all authorization checks:
    - Form Requests **always** return `true` in `authorize()`
    - Controllers use `Gate::authorize()` before service calls
    - Policies contain all authorization logic

    ```php
    public function store(StoreProductRequest $request)
    {
        Gate::authorize('create', Product::class);
        $product = $this->productService->createProduct($request->validated());
        return redirect()->route('products.index');
    }
    ```

## Code Style

15. **No single-line comments** - Only use PHPDoc or JSDoc where absolutely necessary.

## Type Definitions

16. **Single source of truth for types** - Organize types by domain in `resources/js/types/`:
    - `types/shop.ts` - Shop, ShopType, StorefrontSettings
    - `types/product.ts` - Product, ProductVariant, ProductCategory
    - `types/order.ts` - Order, OrderItem, OrderPayment
    - `types/payroll.ts` - Payslip, PayRun, WageAdvance, Deductions
    - `types/customer.ts` - Customer, CustomerCredit
    - `types/service.ts` - Service, ServiceVariant, ServiceCategory

## SVG Icons

17. **Icon Imports** - Use the named `ReactComponent` export pattern:
    ```typescript
    import { ReactComponent as IconName } from './icon.svg?react';
    ```

## Currency & Formatting

18. **Centralized Formatters** - Always use formatters from `lib/formatters.ts`:
    ```typescript
    import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
    formatCurrency(1000, shop.currency_symbol, shop.currency_decimals);
    ```

---

## Required Skills & Plugins

### CRITICAL: Always Use Appropriate Tools

**DO NOT "raw dog" implementations.** Always leverage available skills, plugins, and agents for:

| Task                 | Required Tool                                             |
|----------------------|-----------------------------------------------------------|
| New feature planning | `/feature-dev` skill                                      |
| UI/page design       | `/frontend-design` skill                                  |
| Code review          | `/code-review` skill OR `feature-dev:code-reviewer` agent |
| Architecture design  | `feature-dev:code-architect` agent                        |
| Codebase exploration | `Explore` agent (subagent_type)                           |
| TypeScript issues    | `javascript-typescript:typescript-pro` agent              |
| Backend patterns     | `backend-development:backend-architect` agent             |
| Git commits          | `/commit` skill                                           |
| PR creation          | `/commit-push-pr` skill                                   |

### Workflow by Task Type

#### 1. Implementing a New Feature

```
1. Use `/feature-dev` skill to plan architecture
2. Use `feature-dev:code-explorer` agent to understand existing patterns
3. Use `feature-dev:code-architect` agent to design approach
4. Use `/frontend-design` skill for any UI pages or component
5. After implementation, use `feature-dev:code-reviewer` agent
6. Use `/commit` skill to commit changes
```

#### 2. Building UI Components/Pages

```
1. ALWAYS invoke `/frontend-design` skill first
2. Follow the design system (TailAdmin, brand colors, Outfit font)
3. Ensure dark mode support
4. Use existing component library
```

#### 3. Code Review

```
1. Use `/code-review` skill for PR reviews
2. Use multiple `feature-dev:code-reviewer` agents in parallel for:
   - PHP backend code
   - React/TypeScript frontend
   - Migrations and database
   - Architecture patterns
```

#### 4. Exploring/Understanding Code

```
1. Use `Explore` agent (Task tool with subagent_type='Explore')
2. Never manually grep/glob repeatedly - let the agent do it
3. Request specific thoroughness: "quick", "medium", or "very thorough"
```

### Available Skills Reference

| Skill                          | When to Use                             |
|--------------------------------|-----------------------------------------|
| `/feature-dev`                 | Starting any new feature implementation |
| `/frontend-design`             | Creating ANY new UI page or component   |
| `/code-review`                 | Reviewing pull requests                 |
| `/commit`                      | Creating git commits                    |
| `/commit-push-pr`              | Commit, push, and create PR in one step |
| `/javascript-testing-patterns` | Writing tests for frontend code         |
| `/api-design-principles`       | Designing new API endpoints             |
| `/architecture-patterns`       | Backend architecture decisions          |

### Available Agents Reference

| Agent                                   | When to Use                          |
|-----------------------------------------|--------------------------------------|
| `feature-dev:code-architect`            | Designing implementation approach    |
| `feature-dev:code-explorer`             | Understanding existing code patterns |
| `feature-dev:code-reviewer`             | Reviewing code for bugs/security     |
| `javascript-typescript:typescript-pro`  | TypeScript type issues               |
| `backend-development:backend-architect` | Backend service patterns             |
| `Explore`                               | Quick codebase searches              |

### MCP Servers Available

| Server          | Tools                                                 |
|-----------------|-------------------------------------------------------|
| `laravel-boost` | Database schema, Artisan commands, Tinker, error logs |
| `playwright`    | Browser automation, E2E testing                       |
| `figma`         | Design-to-code workflows                              |

---

## Quality Checkpoints (Production Standards)

### Per-Feature Development Workflow

**1. BEFORE CODING**

- Use `/feature-dev` skill for architecture planning
- Use `feature-dev:code-architect` agent for design blueprints
- Define TypeScript types FIRST in `types/*.ts`

**2. DURING CODING**

- Use `/frontend-design` skill for any new UI pages
- Use `typescript-pro` agent for type safety issues
- Use `backend-architect` agent for service layer patterns
- Run `php artisan test` frequently
- Check Laravel logs via `laravel-boost` MCP
- Ensure all queries filter by `tenant_id`

**3. AFTER CODING**

- Use `/code-review` skill for PR review
- Use `feature-dev:code-reviewer` agent for bug/security scan
- Use `/javascript-testing-patterns` skill to write tests
- Run Playwright for E2E tests on critical flows

**4. BEFORE MERGE**

- Run full test suite (`php artisan test`, `npm run test`)
- Type check (`npm run types`)
- Check for N+1 queries
- Verify all Form Requests have validation rules
- Verify tenant isolation on new queries

### Production Standards

| Area            | Standard                                    | Enforcement                          |
|-----------------|---------------------------------------------|--------------------------------------|
| Type Safety     | No `any` types, strict TypeScript           | `typescript-pro` agent               |
| Validation      | All inputs via Form Requests                | `code-reviewer` agent                |
| Security        | OWASP Top 10, no SQL injection, no XSS      | `/code-review` skill                 |
| Architecture    | Service layer, thin controllers             | `/architecture-patterns` skill       |
| API Design      | Consistent responses, proper error handling | `/api-design-principles` skill       |
| Testing         | Coverage on critical paths                  | `/javascript-testing-patterns` skill |
| Performance     | No N+1 queries, use eager loading           | `laravel-boost` MCP                  |
| UI Design       | Follow design system, dark mode             | `/frontend-design` skill             |
| Multi-Tenancy   | All queries scoped to tenant_id             | Code review                          |
| Stock Tracking  | All changes via StockMovementService        | Code review                          |

### Code Review Triggers

Automatically invoke `/code-review` or `code-reviewer` agent after:

- Completing a new controller
- Adding a new service with business logic
- Creating database migrations
- Implementing payment/subscription logic
- Any security-sensitive code (auth, permissions, crypto)
- Creating new UI pages
- Any code touching inventory/stock

### Testing Requirements

| Layer                 | Tool         | Minimum Coverage                       |
|-----------------------|--------------|----------------------------------------|
| PHP Unit Tests        | Pest/PHPUnit | Services, Tax/Payroll calculations     |
| React Component Tests | Vitest/Jest  | Forms, complex components              |
| E2E Tests             | Playwright   | Auth flow, POS, Order creation         |
| API Tests             | Pest         | All public endpoints                   |

### Security Checklist

Before any PR involving user data:

- [ ] Input validation via Form Request
- [ ] Authorization via Policies
- [ ] No raw SQL queries (use Eloquent)
- [ ] Sensitive data encrypted at rest
- [ ] CSRF protection on forms
- [ ] Rate limiting on auth endpoints
- [ ] Tenant isolation verified

---

## ShelfWise Domain Model Reference

```
Tenant
├── User (staff members)
├── Customer (e-commerce buyers - SEPARATE from User)
├── Shop
│   ├── Product → ProductVariant → StockMovement
│   ├── Service → ServiceVariant
│   ├── Order → OrderItem → OrderPayment
│   └── StorefrontSettings
├── Supplier → SupplierCatalog
└── Payroll
    ├── PayRun → PayRunItem
    ├── Payslip
    └── WageAdvance
```
