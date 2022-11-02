Address service client
==

The client for condo address service

***

## How to use:

```
const { createInstance } = require('@condo/address-service-client')
const client = createInstance('<service url>')
```

The 2nd argument is parameters for the client ()
```javascript
const client = createInstance('<service url>', { geo: '', count: 10, context: 'some-context' })
```
See `AddressServiceParams` type definition
