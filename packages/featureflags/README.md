Feature flags
==

If you need to hide some functionality or give access to it to a certain group of users, 
then you need to use feature flags.

***

## How to use feature flags in backend:
To manage features on the server, use `featureToggleManager` as follows:  
`await featureToggleManager.isFeatureEnabled(featureName, context)`

**Example:** We want to allow some functionality on the server for certain organizations. 
Suppose we already have a created feature toggle called `test-feature`.

The logic for checking whether a feature is available for this organization will be as follows:  
```
const enabled = await featureToggleManager.isFeatureEnabled(
   'test-feature', 
   { organization: organization.id }
)

if (endbled) {
   ...
}
```

## How to use feature flags in frontend:
To manage features on the client, use `useFlag` hook and `updateContext` function from `FeatureFlagsContext`.

**Example:** The case is the same as above.
```
const enabled = useFlag('test-feature')

...

useEffect(() => {
   updateContext({ organization: orgainzation.id })
}, [...])

...

if (enabled) {
   ...
}
```

***

## Test it locally:
1) [Raise the GrowthBook locally](https://docs.growthbook.io/self-host)
2) Get API key from Settings -> API Keys in GrowthBook interface and pass it and API URL to `FEATURE_TOGGLE_CONFIG` in `.env`.

   (Example: `FEATURE_TOGGLE_CONFIG='{"url": "http://localhost:3100/api/features", "apiKey": "key_prod_1234abcd"}'`)
3) Create a new feature toggle in GrowthBook interface
4) Use `featureToggleManager` for feature flags on the server and `FeatureFlagsContext` for feature flags on the client


