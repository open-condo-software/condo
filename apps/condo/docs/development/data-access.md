Data access techniques
=====

Dig dipper to implementation of each utility, mentioned above to understand what's going on under the hood.

## GraphQL data layer implementation

### GraphQL server

Will be automatically initialized by Keystone and get it's standard set of GraphQL queries and mutations, based on schemas, declared in `domains/*/schemas/*`

### GraphQL client

For each schema we have a series of utils (wrappers) to query data on client, server and test environment.
These utils will be initialized in following sub-folders of `domains/*/utils`:
- `clientSchema` – React hooks to use in front-end
- `serverSchema` – server-side querying utils
- `testSchema` - querying utils for test environment

## Custom mutations

Implemented in `domains/*/schemas/*Service.js` modules.
Can have custom GraphQL data types for input and output.

## Utils for specific use-cases

- `GqlWithKnexLoadList` solves "N+1" problem
- `getByCondition`, `getById`, `find` from `@open-condo/keystone/schema` module:
  - returning data from database adapter
  - skipping access control checks on Keystone level
  - should be used in:
    - mutations to resolve results
    - in access control queries to look up for records, not exposed to public API
- `loadListByChunks` should be used when number of records to load, exceeds GLOBAL_QUERY_LIMIT
- `context.executeGraphQL` can execute any kind of GraphQL query and mutation with skipping access control
  - useful in cases when we deviate from the conventional approach with fixed set of fields and need only some of them
