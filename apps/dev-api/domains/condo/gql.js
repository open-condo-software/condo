const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const CondoB2CAppGql = generateGqlQueries('B2CApp', '{ id }')

module.exports = {
    CondoB2CAppGql,
}