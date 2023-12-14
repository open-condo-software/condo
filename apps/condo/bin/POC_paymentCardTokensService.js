const { ApolloServerClient } = require('@open-condo/apollo-server-client')
const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { v4: uuid } = require('uuid')
const PaymentCardTokenGql = generateGqlQueries('PaymentCardTokens', '{ id deletedAt }')

const client = new ApolloServerClient('http://localhost:3000/admin/api', { phone: '+79068888888', password: '3a74b3f07978' })
await client.signIn()

const paymentCards = await client.getModels({
    modelGql: PaymentCardTokenGql,
})
console.log(paymentCards)
const deletedCard = await client.updateModel({
    modelGql: PaymentCardTokenGql,
    id: uuid(),
    updateInput: {
        deletedAt: new Date().toISOString(),
    },
})
console.log(deletedCard)