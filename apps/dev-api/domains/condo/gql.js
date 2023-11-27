const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const CondoB2CAppGql = generateGqlQueries('B2CApp', '{ id }')
const CondoB2CAppBuildGql = generateGqlQueries('B2CAppBuild', '{ id }')

module.exports = {
    CondoB2CAppGql,
    CondoB2CAppBuildGql,
}