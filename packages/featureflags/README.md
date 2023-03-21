Feature flags
==

If you need to hide some functionality or give access to it to a certain group of users, 
then you need to use feature flags.

Add `const { FeaturesMiddleware } = require('@open-condo/featureflags/FeaturesMiddleware')` to your `index.js`

## How to use feature flags in backend:
To manage features on the server, use `featureToggleManager` as follows:  
`await featureToggleManager.isFeatureEnabled(keystoneContext, featureName, featuresContext)`
where `keystoneContext` it's Keystone context object

**Example:** We want to allow some functionality on the server for certain organizations. 
Suppose we already have a created feature toggle called `test-feature`.

The logic for checking whether a feature is available for this organization will be as follows:  
```
const enabled = await featureToggleManager.isFeatureEnabled(
   context,
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
const { useFlag, updateContext } = useFeatureFlags()
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

## Use it locally:

1) 1) You can define a feature statically for local development only via adding following variables to `.env`

`FEATURE_TOGGLE_CONFIG='{"url":null,"apiKey":null,"static": {"sms-after-ticket-creation":{"defaultValue":false,"rules":[{"condition":{"organization":{"$in":[]}},"force":true}]},"refetch-tickets-in-control-room":{"defaultValue":false,"rules":[{"force":true}]},"ticket-import":{"defaultValue":false,"rules":[{"condition":{"isSupport":true},"force":true}]},"send-billing-receipts-notifications-task":{"defaultValue":true},"max-count-completed-ticket-to-close-for-organization-task":{"defaultValue":100}}'`

2) You can setup a GrowBook service locally:

   2.1) [Raise the GrowthBook locally](https://docs.growthbook.io/self-host) 

   2.2) Get API key from Settings -> API Keys in GrowthBook interface and pass it and API URL to `FEATURE_TOGGLE_CONFIG` in `.env`.
        (Example: `FEATURE_TOGGLE_CONFIG='{"url": "http://localhost:3100/api/features", "apiKey": "key_prod_1234abcd"}'`)

   2.3) Create a new feature toggle in GrowthBook interface
