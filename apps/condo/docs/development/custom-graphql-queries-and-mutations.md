Custom GraphQL queries and mutations implementation guide
=====

Use `createschema` utility to generate a scaffold for custom GraphQL query or mutation.
See [createschema](../utils/createschema.md) documentation for how to generate it.

Depending on a task in question, you should pay attention to following:
- Checking data version in `dv` field
- Compatibility issues of existing consumers of our GraphQL API, when you're going to change input/output data format

If something is unclear, please, discuss with colleagues from appropriate department or open an issue.

## Input validation

Validation should be performed in resolver.
Don't validate input in access control modules.

## Returning result

**When an instance of a Keystone list is to be returned, you should use data-access utils, that using Keystone database adapter under the hood.**

Example of using `getById` from `@open-condo/keystone/schema`:

```js
const SyncRemoteClientService = new GQLCustomSchema('SyncRemoteClientService', {
    types: [
        // some declarations ...
    ],

    mutations: [
        {
            // some other fields ...
            schema: 'syncRemoteClient(data: SyncRemoteClientInput!): RemoteClient',
            resolver: async (parent, args, context) => {
                // some logic
                // ...
                
                const data = await RemoteClient.updateOrCreate(context, where, attrs)
                const result = await getById('RemoteClient', data.id)

                return result
            },
        },
    ],
})
```

Wrong usage, that will get you some weird effects (read below):

```js
return await Ticket.create(/*...*/)
```

This way from resolver we can query any set of fields for given Keystone list with any nesting.

For example, consider a `Property` schema and following custom Query: `customPropertyQuery( id: ID! ): Property`.
Suppose, that we have declared only `id name` fields in `apps/condo/domains/property/gql.js`. This will be the only fields, that utils from `generateServerUtils` will return.
Suppose, that we are using this custom query in a following way — `customPropertyQuery('asdf-123') { id name unitsCount organization { id name } }`.
This way we will get an error in resolver, because set of queried fields mismatches to what we have manually declared in `apps/condo/domains/property/gql.js`.

So, to avoid this side effect, use wrappers around Keystone database adapter.

## Debugging

### `null` is returned for some fields, that have a value in DB

Probably, you're not using wrappers from `@open-condo/keystone/schema` to query data for returning result.
You're having a mismatch between what you're querying and what is actually returned.
Read "Returning result" section above.

## Testing

Pay attention to cover following cases:
- Catch all exceptions, supposed to be explicitly thrown in internal logic of custom query or mutation
- Execution of custom query or mutation from all roles

Following cases may not be a subject of testing, **when they are already covered** in tests for appropriate Keystone list schema:
- Violations of database constraints
- Side effects, implemented in hooks of some Keystone list schema