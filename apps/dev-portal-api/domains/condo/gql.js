const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const OIDC_CLIENT_FIELDS = '{ id clientId name payload isEnabled importId deletedAt }'

const CondoB2BAppGql = generateGqlQueries('B2BApp', `{ id importId oidcClient ${OIDC_CLIENT_FIELDS} }`)
const CondoB2BAppContextGql = generateGqlQueries('B2BAppContext', '{ id status deletedAt organization { id name tin deletedAt } app { importId importRemoteSystem } }')

const CondoB2CAppGql = generateGqlQueries('B2CApp', `{ id importId appUrl oidcClient ${OIDC_CLIENT_FIELDS} }`)
const CondoB2CAppBuildGql = generateGqlQueries('B2CAppBuild', '{ id }')
const CondoB2CAppPropertyGql = generateGqlQueries('B2CAppProperty', '{ id address deletedAt app { importId importRemoteSystem } }')
const CondoOIDCClientGql = generateGqlQueries('OidcClient', `${OIDC_CLIENT_FIELDS}`)
const CondoB2CAppAccessRightGql = generateGqlQueries('B2CAppAccessRight', '{ id app { id } user { id } }')
const CondoB2CAppWithInfoGql = generateGqlQueries('B2CApp', '{ id currentBuild { id version importId importRemoteSystem } isGlobal }')

module.exports = {
    CondoB2BAppGql,
    CondoB2BAppContextGql,

    CondoB2CAppGql,
    CondoB2CAppWithInfoGql,
    CondoB2CAppBuildGql,
    CondoB2CAppPropertyGql,
    CondoOIDCClientGql,
    CondoB2CAppAccessRightGql,
}