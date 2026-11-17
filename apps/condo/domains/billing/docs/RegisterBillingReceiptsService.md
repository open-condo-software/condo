# RegisterBillingReceiptsService

## Purpose

`registerBillingReceipts` imports or updates billing receipts for a single
`BillingIntegrationOrganizationContext`.

This document describes the current mutation contract and runtime behavior. The
implementation and its tests remain the source of truth:

- `domains/billing/schema/RegisterBillingReceiptsService.js`;
- `domains/billing/schema/resolvers/`;
- `domains/billing/schema/RegisterBillingReceiptsService.test.js`;
- `domains/billing/schema/resolvers/*.spec.js`.

## GraphQL contract

The mutation signature is:

```graphql
registerBillingReceipts(data: RegisterBillingReceiptsInput!): [BillingReceipt]
```

`RegisterBillingReceiptsInput` contains:

- `dv` and `sender`, used when updating the billing context report;
- `context.id`, identifying the billing context;
- `receipts`, containing at most 1,000 receipts.

Each receipt requires:

- `address`;
- `accountNumber`;
- `toPay`;
- `month` and `year`;
- `tin`, `routingNumber`, and `bankAccount`.

The following receipt data is optional:

- external receipt `importId`;
- `addressMeta` with `globalId`, `unitName`, `unitType`, and the ignored
  compatibility field `importId`;
- `accountMeta` with `globalId`, `importId`, `fullName`, `isClosed`, and
  `ownerType`;
- `toPayDetails`;
- `services`;
- an explicit billing `category`;
- integration-specific `raw` data.

The top-level receipt fields `unitName`, `unitType`, `normalizedAddress`,
`fullName`, `tinMeta`, and `routingNumberMeta` are deprecated and are not used by
the resolver pipeline.

### Result and partial errors

The result is a nullable list with nullable elements. Its order matches the
input order.

Each successfully processed input position contains a `BillingReceipt`. A
receipt-specific error produces `null` at the same position and a GraphQL error
with `inputIndex` in its extensions. Other valid receipts in the request
continue through the pipeline. For example, one invalid receipt in a request of
50 does not prevent the other 49 receipts from being saved.

An infrastructure error that cannot be attributed to one receipt rejects the
whole mutation. The mutation is not transactional, so entities saved by an
earlier resolver may remain in the database when a later resolver or external
service fails.

## Access control

The mutation first resolves a context that is valid for receipt publishing. A
deleted organization, deleted context, unfinished context, or deleted billing
integration is rejected.

Access is granted to:

- administrators;
- service users with a `BillingIntegrationAccessRight` for the context's
  integration;
- B2B application service users when the context's billing integration points
  to that B2B application and the user may execute the service for the context's
  organization.

Anonymous users, regular users, organization employees, and support users do
not have access through this mutation.

## Processing pipeline

The complete receipt array is validated before external lookups and database
writes. After validation, every input receipt is stored in an index keyed by its
original position. It is initialized with an empty `problems` array and no
critical error, then passed through these resolvers in order:

1. `resolvePeriods`;
2. `resolveRecipients`;
3. `resolveProperties`;
4. `resolveAccounts`;
5. `resolveCategories`;
6. `resolveReceipts`.

After each stage, receipts with a critical error are removed from subsequent
stages. Non-critical problems remain attached to the internal receipt and are
included in the saved `raw` snapshot.

Each stage records its duration and successful create, update, and no-op counters. The
mutation writes the combined data to the structured
`register-receipts-profiler` log entry.

## Validation

Validation runs before external lookups or database writes.
An invalid receipt rejects the complete mutation with `BAD_USER_INPUT`; no
receipt from that request is processed. This validation extends the structural
validation provided by the GraphQL input schema.

### Period input

`month` must be an integer from 1 through 12.

`year` must be an integer from 1000 through 9999.

For a valid input, the period is stored as the first day of the requested month
in `YYYY-MM-01` format.

### Money input

Money values must be strings matching:

```text
^-?\d+(?:\.\d+)?$
```

This accepts integers and dot-separated decimals with an optional leading
minus. It rejects commas, exponent notation, a leading plus, whitespace, empty
strings, `NaN`, and `Infinity`.

The validator checks:

- receipt `toPay`;
- receipt `toPayDetails.charge`, `balance`, `recalculation`, `privilege`,
  `penalty`, and `paid`;
- every service's `toPay`;
- the same six amount fields in every service's `toPayDetails`.

Optional amount fields may be `null` or omitted. A `null` service array element
is rejected as an invalid amount value. Service `volume` and `tariff` are not
validated as money by this mutation.

An invalid value produces `WRONG_AMOUNT_FORMAT`. The error contains the exact
field path, including the service index, and the string representation of the
rejected value.

## Recipient resolution

The recipient stage loads all active `BillingRecipient` records in the billing
context. Inputs are deduplicated by `bankAccount` for the duration of the
request. If multiple inputs use the same bank account, the first input's TIN and
routing number are used for the shared lookup and recipient synchronization.

For each unique bank account, the stage:

1. requests bank data by `routingNumber` from finance info service;
2. requests organization data by `tin` from finance info service;
3. finds an existing recipient by `bankAccount`;
4. creates or updates the recipient with the returned data.

The recipient cache is intentionally keyed only by `bankAccount`: the whole
mutation operates within one billing context, which belongs to one
organization.

Known finance input errors and missing suggestions are converted into
receipt-specific errors. The error text includes the rejected `routingNumber`
or `tin`. Other finance client errors are treated as infrastructure failures and
abort the mutation.

Both receipt fields are populated:

- `receiver` references `BillingRecipient`;
- deprecated `recipient` stores a snapshot of the payment details for backward
  compatibility.

Recipient approval is computed by `BillingRecipient.isApproved`. A recipient is
approved when either:

- its TIN equals the billing context organization's TIN; or
- that organization has an active approved `BankAccount` with the recipient's
  routing number and account number.

An unapproved recipient does not block receipt creation. It adds the
`RECIPIENT_IS_NOT_APPROVED` problem with `tin`, `routingNumber`, and
`bankAccount` parameters.

## Address and property resolution

The input address represents a house and may also contain a unit type and unit
number. Only house candidates are sent to address service; unit data is retained
for `BillingAccount`.

### Address candidates and unit metadata

The resolver builds candidates from `addressMeta.globalId` and `address`:

- a FIAS-looking value passed as `address` is treated as `globalId`;
- a valid FIAS `globalId` becomes a `fiasId:<value>` lookup;
- a FIAS value with a comma-separated unit suffix is parsed and only its house
  part is used in the `fiasId` lookup;
- the textual address is parsed into house and unit parts.

Non-empty `addressMeta.unitName` and `addressMeta.unitType` take precedence over
unit values parsed from the FIAS suffix or textual address. An unknown explicit
unit type is normalized through the address parser. If several parsed unit types
exist, a non-flat type is preferred over the default flat type.

When both explicit unit metadata fields are present, the textual address is
treated as the complete house address and is not parsed for a unit. This keeps
house components such as `корп. 2` intact. When either metadata field is absent,
the parser extracts the missing unit data and the house candidate from the
textual address.

### Address service and candidate selection

Unique house candidates are sent to address service in sequential chunks of ten.
The organization TIN is passed as a search helper. A transport failure from
address service aborts the mutation.

All normalized address keys are checked against organization properties in one
batch query. Candidate selection then follows these rules:

1. prefer the first candidate matching an active `Property` in the context's
   organization;
2. otherwise use the first normalized candidate and add
   `NO_PROPERTY_IN_ORGANIZATION`.

FIAS candidates are added before textual address candidates, so this order also
determines the fallback when neither candidate belongs to the organization.
Failure to normalize any candidate produces a receipt-specific
`ADDRESS_NOT_RECOGNIZED_VALUE` error containing the original input address.

### BillingProperty synchronization

`BillingProperty` is identified by `(context, addressKey)` in application code.
Existing rows are loaded in batches and ordered by `createdAt`, then `id`; if
historical duplicates exist, the oldest row is reused.

The resolver creates a property when no matching row exists. For UUID-shaped
test address keys, the stored address is `key:<addressKey>`; otherwise, the
normalized address is stored. The house FIAS value is saved in `globalId`.

`addressMeta.importId` is ignored. `BillingProperty.importId` remains in the
public model as a deprecated compatibility field, but this mutation neither
uses it for identity nor writes it.

Property save errors affect only the corresponding receipt and include its
original address. Properties created by earlier receipts in the request are
cached and reused.

## Account resolution

The account number is normalized by removing `л/с`, `лс`, and `№`
case-insensitively, then trimming leading and trailing whitespace.

`BillingAccount` identity in this mutation is:

```text
(billing context, normalized account number)
```

The property is deliberately not part of account identity. The same normalized
number in one context reuses one account, even when a later receipt contains a
different property or unit. In that case, the existing account is updated with
the later receipt's property and unit data. Inputs are processed in input order,
and the in-request account cache makes the last successful update observable to
subsequent receipts.

Existing accounts are batch-loaded and ordered by `createdAt`, then `id`. If the
database contains active duplicates, the oldest account is reused. The mutation
does not itself enforce a database uniqueness constraint.

### Account metadata

An ELS `globalId` is accepted when it consists of two digits, two Russian
letters, six digits, and optional non-empty hyphen-separated suffixes. For
example, `50РО078840-01-6101` is valid and is stored unchanged. A non-null
invalid ELS is ignored: it is omitted on create and does not overwrite an
existing value.

When `fullName` is provided and `ownerType` is omitted, the resolver classifies
the owner as a person or company using Russian name and company-name heuristics.

Updates distinguish `undefined` from `null` for nullable metadata:

- an omitted or `undefined` value preserves the stored value;
- `null` clears `globalId`, `importId`, or `fullName`;
- a non-null value updates it.

`isClosed` and `ownerType` are non-nullable model fields. Explicit `null` is
therefore treated as omitted and preserves the current value.

Account save errors affect only the corresponding receipt and include the
normalized account number.

## Category resolution

All active `BillingCategory` records are loaded before processing. Category
selection uses this priority:

1. an explicitly supplied existing category;
2. a category whose service-name set contains every input service name;
3. the category mapped from the unit type, currently parking;
4. the default billing category.

Service name comparison is case-insensitive. If several categories match the
services, the last matching category in the loaded category order wins. With no
services, service-based detection returns the default category and allows unit
type detection to take precedence over that default.

An explicit category that does not exist produces a receipt-specific
`BILLING_CATEGORY_NOT_FOUND` error.

## Receipt resolution

### Identity

When a non-empty external `importId` is supplied, the mutation looks for an
active receipt by `(context, importId)`.

When `importId` is `null` or omitted, it looks for an active receipt with:

- the same context;
- the same period;
- the same account; and
- either the same receiver or the same category.

Property is not an additional lookup condition. This is consistent with the
account rule: an account number identifies one account inside the context, and
an address correction updates that account and the matched receipt.

No synthetic `importId` is generated. New receipts without an external ID store
`null` in `BillingReceipt.importId`. An empty string is rejected by the model.

The `receiver OR category` rule has these consequences for receipts without an
external ID:

- changing only the receiver updates the existing receipt;
- changing only the category updates the existing receipt;
- changing both creates a new receipt;
- changing the address, property, services, or amounts updates the matched
  receipt.

If a lookup returns multiple historical matches, an exact `importId` match is
preferred when applicable; otherwise the first returned row is updated.

### Create and update behavior

The mutation writes these receipt fields:

- `services` and `toPayDetails`;
- deprecated `recipient` and the `receiver` relationship;
- `period`, `category`, `account`, and `property`;
- external `importId`;
- `toPay`;
- the complete internal receipt state as `raw`.

`toPay` is normalized to two decimal places when an existing receipt is
compared with incoming data. If none of the writable fields changes, the update
is skipped, the receipt version is not incremented, and `raw` is not refreshed.

`balanceUpdatedAt` is set on update when either `toPay` or
`toPayDetails.paid` changes. Changes to other `toPayDetails` fields do not
change it. It is not set merely because a receipt is created.

Service objects preserve their optional `id`. The service-level
`toPayDetails.formula` input and stored value remain supported for compatibility;
the return field is deprecated. Service `volume`, `tariff`, and `measure` are
stored as supplied.

Receipt save errors affect only the corresponding input position. Their public
message contains the external `importId`, or an internal identity description
when no external ID exists. The underlying error is logged and attached as the
original GraphQL error without exposing database details in the public message.

## Error model

Input-format errors reject the complete request with `BAD_USER_INPUT` and the
corresponding `inputIndex`. Errors found during receipt resolution remain
receipt-specific. Domain data errors use `BAD_USER_INPUT`, and entity save
failures use `INTERNAL_ERROR`. They include `inputIndex` and, where applicable,
interpolate the rejected or identifying input value:

- original address;
- routing number;
- TIN;
- money field path and value;
- normalized account number;
- recipient bank account;
- receipt identity.

The resolver that records a critical error removes that receipt from all later
stages. Independent errors can therefore produce several `null` result elements
and several GraphQL errors in one response.

Unexpected resolver exceptions and infrastructure failures are not converted
to per-receipt errors. They reject the mutation immediately.

## `lastReport`

After receipt resolution, successfully created or updated receipts are loaded
from the database and used to update
`BillingIntegrationOrganizationContext.lastReport`. If no receipt succeeded,
the report is left unchanged.

All `lastReport` fields are optional, and the whole field may be `null`. This
allows other producers to store partial reports, including an object containing
only `categories`.

The mutation uses these fields:

- `period`: newest successfully processed receipt period, unless the database
  or the current report already contains a newer period;
- `totalReceipts`: total active receipt count for `period` in the context;
- `categories`: category IDs represented in the report period;
- `lastSyncAt`: time of the latest mutation call that successfully processed at
  least one receipt;
- `lastAddedReceiptsAt`: time when this mutation most recently created at least
  one receipt;
- `finishTime`: deprecated compatibility field mirroring
  `lastAddedReceiptsAt`.

For a newer period, categories are replaced with categories from receipts in
that newest period only. Categories from older periods in the same request are
ignored. For the same period, they are merged with existing report categories.
If an old report has no `categories` field, categories from the newest period
in the current batch are used.

When older receipts are processed while newer receipts or a newer report period
exist, the period summary is preserved. Synchronization timestamps are still
updated. This also means a missing report may be recreated with timestamps only
when the database already contains newer receipts.

Updating an existing receipt changes `lastSyncAt` but preserves
`lastAddedReceiptsAt` and `finishTime`. Creating any receipt changes all three
timestamps, including when the created receipt belongs to an older period.

The report is re-read immediately before the update to reduce stale snapshot
overwrites. `lastSyncAt`, `lastAddedReceiptsAt`, and deprecated `finishTime`
preserve a later stored value, so concurrent registrations do not move these
timestamps backwards. There is still no transaction or row lock around the
complete report summary update.

## Side effects and batching

The mutation does not wrap the request or an individual receipt in a database
transaction. Recipient, property, and account writes occur before receipt
writes. A downstream error can therefore leave synchronized shared entities
without a corresponding receipt.

Batching and caching behavior includes:

- finance lookups deduplicated by bank account and executed in concurrent
  chunks of 50;
- address lookups deduplicated by house candidate and sent in chunks of ten;
- organization properties batch-loaded for all normalized address keys;
- existing properties batch-loaded by address key;
- existing accounts batch-loaded by normalized number;
- shared property and account writes serialized where input order affects the
  final shared entity;
- recipient preparation and saving performed concurrently for distinct bank
  accounts.

## Compatibility fields

The mutation currently maintains these compatibility contracts:

- `BillingProperty.importId` exists but is deprecated and ignored here;
- receipt `recipient` is written together with `receiver`;
- `BillingReceipt.importId` remains an optional external integration ID;
- service `toPayDetails.formula` is accepted and stored, while its return field
  is deprecated;
- `lastReport.finishTime` is written together with
  `lastAddedReceiptsAt`;
- deprecated top-level address, name, TIN metadata, and routing-number metadata
  inputs remain in the GraphQL schema but are not used by the pipeline.
