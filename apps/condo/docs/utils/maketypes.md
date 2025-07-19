maketypes script
=====

Keeps declarations of TypeScript entities in sync with current GraphQL schema. 

The command below creates `./schema.ts` file with all GraphQL types:

```shell
yarn workspace @app/condo maketypes
```

## When should you call this util?

When you change something in GraphQL API:
- Keystone schemas
- Keystone custom queries
- Keystone custom mutations
- Custom GraphQL-types declarations

## Why not `schema.d.ts`?

Because `enum` types are used in GraphQL and some of them are imported into project files.
Enum-types, declared in TypeScript declaration files are not transpiled into JavaScript.

When we try to import an enum-type, we get an error:

> Type error: Module '"../../../../schema"' has no exported member…

Read more on that at https://lukasbehal.com/2017-05-22-enums-in-declaration-files/