# How to use

```js
const { ApolloServerClient } = require('@condo/apollo-server-client')
const { generateGqlQueries } = require('@condo/domains/common/utils/codegeneration/generate.gql')

const conf = require('@condo/config')
const { endpoint, authRequisites } = conf.BILLING_INTEGRATION ? JSON.parse(conf.BILLING_INTEGRATION) : {}

const BILLING_ACCOUNT_FIELDS = '{ id context { id } importId number unitName unitType }'
const BillingAccount = generateGqlQueries('BillingAccount', BILLING_ACCOUNT_FIELDS)

class BillingBot extends ApolloServerClient {

    async getAccounts ( where = {}) {
        return await this.loadByChunks({
            modelGql: BillingAccount,
            where,
        })
    }

}

async function bootstrap () {
    const billing = new BillingBot(endpoint, authRequisites, { clientName: 'billing-bot' })
    await billing.signIn()
    const accounts = await billing.getAccounts()
    console.log(accounts)
}

bootstrap().then(() => {
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})
```

Example output

```shell
[
  {
    id: '038111f0-8ed1-4556-b01c-7171e75ded3c',
    context: { id: 'ed974427-ebb7-48ff-b96c-bce74d2fd661' },
    importId: '4dfdb09f9584cd02bcff3af7b6ed247b',
    property: { id: 'be9a9dc4-66d5-4e4d-a5cd-9ac3766db9fd' },
    number: '420',
    unitName: '132',
    unitType: 'parking',
    raw: { dv: 1 },
    meta: { dv: 1 }
  },
...
]
```