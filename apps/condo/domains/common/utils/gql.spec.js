const { buildSchema, graphqlSync } = require('graphql')

const { isFieldRequested } = require('./gql')

const schema = buildSchema(`
    type Receipt { id: ID, distribution: Breakdown }
    type Breakdown { amount: String }
    type Query { receipts: [Receipt] }
`)

test.each([
    ['absent', '{ receipts { id } }', false],
    ['direct', '{ receipts { distribution { amount } } }', true],
    ['aliased', '{ invoices: receipts { grouped: distribution { amount } } }', true],
    ['unrelated alias', '{ receipts { distribution: id } }', false],
    ['named fragment', '{ receipts { ...ReceiptFields } } fragment ReceiptFields on Receipt { distribution { amount } }', true],
    ['inline fragment', '{ receipts { ... on Receipt { distribution { amount } } } }', true],
    ['merged selections', '{ receipts { id } receipts { distribution { amount } } }', true],
    ['skipped', '{ receipts { ... @skip(if: true) { distribution { amount } } id } }', false],
    ['excluded', 'query ($show: Boolean!) { receipts { id ...ReceiptFields @include(if: $show) } } fragment ReceiptFields on Receipt { distribution { amount } }', false],
    ['included after exclusion', 'query ($show: Boolean!) { receipts { ...ReceiptFields @include(if: $show) ...ReceiptFields } } fragment ReceiptFields on Receipt { distribution { amount } }', true],
])('checks field selection: %s', (name, source, expected) => {
    const receipts = jest.fn((args, context, info) => {
        expect(isFieldRequested(info, 'distribution')).toBe(expected)
        return []
    })
    const result = graphqlSync({ schema, source, rootValue: { receipts }, variableValues: { show: false } })

    expect(result.errors).toBeUndefined()
    expect(receipts).toHaveBeenCalledTimes(1)
})
