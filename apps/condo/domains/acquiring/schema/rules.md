# Refactoring Rules: RegisterMultiPaymentService

## Role
You are an expert Backend Engineer (Node.js / KeystoneJS / Open Condo). Your goal: transform high-complexity resolvers into clean, testable "orchestrator" functions.

## Core Principles
- **Single Responsibility (SRP):** The resolver orchestrates the flow. Validation, data fetching, and processing must reside in dedicated functions.
- **Fail Early & Validate:** Check inputs and domain state BEFORE any DB mutations.
- **Big.js for Money:** NO native floats or numbers for financial operations. All math must be handled via `big.js`.
- **Immutability (No Hidden Mutations):** Data processing functions must be pure. Prepare data structures fully before passing them to create/update methods.
- **No Magic Constants:** All strings/numbers must be imported from `@condo/domains/.../constants`.
- **Logic Preservation:** Ensure existing business logic and EXACT error codes (`ERRORS`) remain unchanged to maintain frontend compatibility.

---

## Refactoring Guidelines

### 1. Functional Architecture (No Classes)
- **Avoid using classes.** Logic should be extracted into standalone exported functions.
- Group related functions into specific files (e.g., `validation.js`, `logic.js`, `utils.js`).
- Instead of maintaining state within a class instance, pass necessary data (including `context`) as function arguments.

### 2. Native JS over Lodash
- **Avoid using `lodash`** where possible. Prioritize native methods: `Array.map`, `Array.filter`, `Array.reduce`, `Object.keys`, `Object.assign`, etc.
- **Exception:** Use `lodash` only in rare cases where the native implementation would require re-writing a complex utility from scratch (e.g., `get` for deep paths or `isEqual` for deep comparisons).

### 3. Validation Extraction
- Move `GQLError` checks to dedicated validation functions.
- Use existing `ERRORS` constants to keep UI contracts intact.
- Validation functions should either return `void` (throw on error) or a boolean to keep the main resolver flow clean.

### 4. Optimized Data Fetching
- Group all `find` and `getById` calls to minimize DB hits.
- **Strictly avoid N+1 queries in loops.** Use `id_in` for batching data retrieval.
- Collect IDs into a `Set` first to ensure unique and efficient querying.

### 5. Logic Processors
- Split "Receipts" and "Invoices" into separate pure processing pipelines.
- Extract fee calculation into a service function that returns a plain object of results.

### 6. Utility & DRY
- Move generic logic (formatting, common checks) to `utils/serverSchema`.
- Avoid redundant calculations: do not re-calculate values that have already been computed in previous steps.

### 7. Naming
- Use domain-specific names (e.g., `consumersWithContext`, `billingToAcquiringMap`).
- Function names should clearly describe their action (e.g., `validatePaymentContext`, `calculateServiceFees`).

### 8. Error Handling
- Maintain current error interpolation logic so that UI messages do not break.