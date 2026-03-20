# MULTI_ACQUIRING_CONTEXT_AUDIT.md

## Overview
Audit of `AcquiringIntegrationContext` usage across `apps/condo`. 
The goal is to support multiple contexts:
- One `ONLINE_PROCESSING` type context per organization.
- Multiple `EXTERNAL_IMPORT` type contexts per organization (but linked to different integrations).

## Key Assumptions Found (To Be Fixed)

### 1. Schema Validation (AcquiringIntegrationContext.js)
- **Current Logic:** Prevents creating a new context if *any* active context exists for the organization.
- **Problem:** Needs to allow one `ONLINE_PROCESSING` and multiple `EXTERNAL_IMPORT` (one per integration).
- **File:** `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/acquiring/schema/AcquiringIntegrationContext.js:249-272`

### 2. Payment Processing (processor.js)
- **Current Logic:** Throws `MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS` if more than one integration is found for the organizations involved in `RegisterMultiPayment`.
- **Problem:** `RegisterMultiPayment` currently only supports `ONLINE_PROCESSING`. If multiple contexts exist, it might pick the wrong one or fail.
- **File:** `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/acquiring/utils/serverSchema/registerMultiPayment/processor.js:78-80`

### 3. Service Consumer Registration (RegisterServiceConsumerService.js)
- **Current Logic:** Uses `find(...)[0]` (destructuring) to pick the *first* available finished acquiring context.
- **Problem:** If an organization has both `ONLINE_PROCESSING` and `EXTERNAL_IMPORT`, it might pick the wrong one. Resident-facing logic usually needs `ONLINE_PROCESSING`.
- **File:** `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/resident/schema/RegisterServiceConsumerService.js:277`

### 4. Service Consumer Discovery (DiscoverServiceConsumersService.js)
- **Current Logic:** Picks the first context from the map: `const [acquiringContextId] = organizationsToAcquiringContextsMap[organizationId] ?? [null]`.
- **Problem:** Same as above, non-deterministic choice if multiple contexts exist.
- **File:** `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/resident/schema/DiscoverServiceConsumersService.js:455`

### 5. Resident Receipt Fee Calculation (AllResidentBillingReceiptsService.js)
- **Current Logic:** Relies on `ServiceConsumer.acquiringIntegrationContext` to calculate fees.
- **Problem:** If `ServiceConsumer` is linked to an `EXTERNAL_IMPORT` context, fee calculation might be irrelevant or wrong for "pay now" UI.
- **File:** `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/billing/schema/AllResidentBillingReceiptsService.js:192`

## Detailed Usage Map

### Acquiring Domain
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/acquiring/schema/AcquiringIntegrationContext.js`: Validation logic.
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/acquiring/utils/serverSchema/registerMultiPayment/processor.js`: `fetchRelatedEntitiesAndProcessReceipts` and `fetchRelatedEntitiesAndProcessInvoices` both assume a single integration.
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/acquiring/schema/GeneratePaymentLinkService.js`: Uses `acquiringIntegrationContext.id` from input, so it's explicit, but needs to ensure the provided ID is of type `ONLINE_PROCESSING` for link generation.

### Billing Domain
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/billing/schema/AllResidentBillingReceiptsService.js`: Uses `serviceConsumer.acquiringIntegrationContext` for fee calculation.

### Resident Domain
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/resident/schema/ServiceConsumer.js`: Has `acquiringIntegrationContext` field.
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/resident/schema/RegisterServiceConsumerService.js`: Automatically links context.
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/resident/schema/DiscoverServiceConsumersService.js`: Automatically links context.

## Frontend Usage Map

### Condo App (B2B)
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/billing/components/OnBoarding/SetupAcquiring.tsx`: Used during organization onboarding to set up the initial acquiring integration.
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/billing/components/OnBoarding/Verification.tsx`: Checks context status during the verification step of onboarding.
- `@/Users/vladimir/WebstormProjects/condo/apps/condo/domains/billing/components/BillingPageContent/ContextProvider.ts`: Provides context information to billing-related components.

### Resident App (B2C)
- `@/Users/vladimir/WebstormProjects/condo/apps/resident-app/domains/billing/hooks/useMultiPayableReceipts.ts`: Uses context to determine if receipts can be paid together and to calculate fees.
- `@/Users/vladimir/WebstormProjects/condo/apps/resident-app/domains/acquiring/components/pay-page/pages/ReceiptPayPage.tsx`: Main payment page, relies on context for integration details (hostUrl, etc.).
- `@/Users/vladimir/WebstormProjects/condo/apps/resident-app/domains/acquiring/components/pay-page/pages/SelectReceiptsPage.tsx`: Uses context to group receipts and show available payment methods.
