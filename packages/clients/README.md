# Clients for local and external services
## Address service client
```js
const { createInstance } = require('@open-condo/clients/address-service-client')
// ...
const addressServiceClient = createInstance({ address })
```

### Address parser
```js
const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils')
// ...
const addressParser = new AddressFromStringParser()
// ...
const { address, unitType: ut, unitName: un } = addressParser.parse(s)
```
