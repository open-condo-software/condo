const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const CondoB2CAppGql = generateGqlQueries('B2CApp', '{ id }')
const CondoB2CAppBuildGql = generateGqlQueries('B2CAppBuild', '{ id }')
const CondoB2CAppPropertyGql = generateGqlQueries('B2CAppProperty', '{ id address deletedAt app { importId importRemoteSystem } }')
const CondoOIDCClientGql = generateGqlQueries('OidcClient', '{ id clientId payload name isEnabled }')
const CondoB2CAppAccessRightGql = generateGqlQueries('B2CAppAccessRight', '{ id app { id } user { id } }')

module.exports = {
    CondoB2CAppGql,
    CondoB2CAppBuildGql,
    CondoB2CAppPropertyGql,
    CondoOIDCClientGql,
    CondoB2CAppAccessRightGql,
}