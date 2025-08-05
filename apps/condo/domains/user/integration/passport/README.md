# Passport.js integration

Condo backend supports authentication via different external providers using the protocol of [Passport.js](https://www.passportjs.org).

For now out of the box we support authorization via:
- [GitHub](strategies/github.js)
- [Generic OpenID Connect provider](strategies/oidc.js)
- [OIDC token exchange](strategies/oidcTokenUserInfo.js), where external frontend provider sends granular OIDC token from its service, and condo verifies it using OIDC userInfo endpoint



## How to add new strategy

> **NOTE 1**: by our design some strategies can authorize multiple providers on the same endpoint, 
> that's why we use not raw passport strategies, but [AuthStrategy](strategies/types.js) interface instead. 
> 
> AuthStrategy is a wrapper around passport strategy, that has:
> - `constructor` with strategy config and routes parameters, 
> - `build` method, that returns passport strategy,  
> - `getProviders` method, that returns list of identity providers implemented by this strategy.

```typescript
type StrategyConfig = {
    name: string
    strategy: keyof KNOWN_STRATEGIES
    trustPhone: boolean
    trustEmail: boolean
    options: any
}

type StrategyRoutes = {
    authURL: string
    callbackURL: string
}
```

> **NOTE 2**: We encapsulated the most heavy logic inside [syncUser](utils/user.js) util. 
> As a developer you should only receive profile from external service (Google, GitHub, etc.), 
> and call sync user with proper field mapping. For reference, explore the [strategies](strategies) folder.

To add new auth strategy you must:
1. First modify utils/config.js file to define options validation schema for new provider. It's also a good idea to add a test for that in config.spec.js
2. Then add a strategy in strategies folder by creating a class implementing AuthStrategy interface (stored in [strategies/types](strategies/types.js))
3. If its a not a simple passport wrapper, but a Custom strategy (like oidcTokenUserInfo), you must consider adding some strategy-specific tests in [strategyName].spec.js file.
4. All strategies must call syncUser to do the heavy user-syncing job. Check [utils/syncUser.js](utils/user.js) and [utils/syncUser.spec.js](utils/user.spec.js) for more details.
5. After finishing the strategy add it to KNOWN_STATEGIES in [strategies/index.js](strategies/index.js) and add some basic test, to ensure syncUser is called with right logic
6. Now you can enable provider by modifying `PASSPORT_CONFIG` env variable
