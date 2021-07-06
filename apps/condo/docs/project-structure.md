Project structure
=====
We use Domain Driven Design to distribute logic into the domain folders.
Read details [here](../domains/README.md).

Main folders:
- `./<domain>/constants` -- contains various constants. Used on the client and server side
- `./<domain>/gql` -- contains all GraphQL queries. Used on the server and client side
- `./<domain>/components` -- contains react components. Used on the client side
- `./<domain>/schema` -- keystone.js based domain models. The GQL API is formed based on these models. Used on the server side
- `./<domain>/access` -- contains keystone.js access check logic. Used on the server side
- `./<domain>/utils` -- some utilities functions for the client and server side
- `./<domain>/utils/clientSchema` -- client side domain logic utilities
- `./<domain>/utils/serverSchema` -- server side domain logic utilities
- `./<domain>/utils/testSchema` -- server side test used domain logic utilities
- `/lang` -- translations. Used on the client and server side
- `/pages` -- next.js pages. Used on the client side
- `/public` -- next.js static files like design images, icons