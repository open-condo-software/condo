# Refactoring Report: RegisterMultiPaymentService

## Overview
The refactoring aimed to decouple the heavy logic from the main resolver into a clean, modular structure while restoring linear execution and implementing lazy loading to prevent redundant database queries.

## Key Changes

### 1. Architectural Shift: Linear Flow & Lazy Loading
**Previous State:** The `loader.js` was fetching all possible related entities (receipts, billing contexts, integrations) upfront, regardless of whether they were needed or if the initial validation would have failed anyway.
**New State:** 
- `RegisterMultiPaymentService.js` now acts as a high-level orchestrator.
- Data fetching is split into two phases: **Initial Loading** (Consumers/Invoices) and **Related Entities Processing** (Lazy loading of related entities).

### 2. File-by-File Detailed Changes

#### `RegisterMultiPaymentService.js` (Orchestrator)
- **Lines 61-65:** Refactored to only call `fetchInitialEntities` for basic entities (Consumers, Invoices, RecurrentContext).
- **Lines 68-73:** Calls `validateInitialEntitiesState` for preliminary validation.
- **Lines 81-90:** Replaced the "batch-everything" approach with a conditional branch. Now it explicitly calls either `fetchRelatedEntitiesAndProcessInvoices` or `fetchRelatedEntitiesAndProcessReceipts`, passing only the basic data. These processors now return the results of their own lazy loading (like `acquiringIntegration`).
- **Line 107:** Currency code extraction now uses the results returned from the processor, ensuring consistency.

#### `loader.js` (Initial Data Fetcher)
- **Lines 8-32:** Stripped down `fetchInitialEntities` to only fetch `ServiceConsumer` (or `Invoice`) and `RecurrentPaymentContext`. 
- **Removed:** All logic for loading `AcquiringIntegrationContext`, `AcquiringIntegration`, `BillingReceipt`, `BillingIntegrationOrganizationContext`, and `BillingIntegration`. This logic moved to `processor.js` to enable lazy loading.

#### `validation.js` (Initial State Validator)
- **Lines 75-139:** `validateInitialEntitiesState` now only checks the integrity of the basic entities (existence of consumers, deleted status, invoices status).
- **Removed:** Detailed checks for billing integrations, receipts grouping, and acquiring integration types. These checks were moved into the processors to ensure they only run if the flow reaches that point.
- **Improved:** `DELETED_INVOICES` error now correctly interpolates IDs as a string.

#### `processor.js` (Logic & Lazy Loader)
- **Lines 63-215 (`fetchRelatedEntitiesAndProcessReceipts`):**
    - **Step 1 (Lazy Load):** Fetches `AcquiringIntegrationContext` based on `ServiceConsumer.organization` (not `acquiringIntegrationContext` field).
    - **Step 1a (Validation):** Ensures the `AcquiringIntegrationContext` is in `FINISHED` status (using `CONTEXT_FINISHED_STATUS`).
    - **Step 2 (Lazy Load):** Fetches `AcquiringIntegration` and validates its type (must be `ONLINE_PROCESSING`).
    - **Step 3 (Lazy Load):** Fetches `BillingReceipt`s only after confirming the integration is valid.
    - **Step 4 (Lazy Load):** Fetches `BillingIntegrationOrganizationContext` and `BillingIntegration`.
    - **Step 5 (Validation):** Performs detailed validation (grouping support, currency matching, deleted billing) that was previously in `validation.js`.
- **Lines 217-283 (`fetchRelatedEntitiesAndProcessInvoices`):**
    - Similar lazy loading logic implemented for Invoice-based flows, including organization-based context lookup, integration type validation, and `FINISHED` status validation for the context.

### 3. Business Logic Updates
- **Context Lookup:** The system no longer trusts `serviceConsumer.acquiringIntegrationContext`. It now looks up the context via `serviceConsumer.organization`, which is more robust and aligns with recent schema changes.
- **Integration Type Constraint:** Added a strict check that the `AcquiringIntegration` must have `type: 'ONLINE_PROCESSING'`. Any other type (like `EXTERNAL_IMPORT`) will throw `ACQUIRING_INTEGRATION_TYPE_MISMATCH`.

## Risk Assessment

| Risk | Mitigation |
| :--- | :--- |
| **N+1 Queries** | All lazy loading within processors is batched using `id_in`. No loops perform individual `find` calls. |
| **Logic Regression** | Preserved all existing `ERRORS` and `GQLError` structures. The sequence of checks remains logically identical, even if physically moved. |
| **Performance** | Performance is actually improved for failing requests, as the system "fails early" without loading hundreds of receipts or billing configs. |
| **Organization Context** | If an organization has multiple active contexts with different integrations, the system still enforces a "single integration" rule for the entire multi-payment. |

## Conclusion
The logic is now more "defensive" and efficient. By moving detailed loading into the processors, we've restored the linear "Check -> Load More -> Check -> Process" flow that was lost in the initial refactoring.
