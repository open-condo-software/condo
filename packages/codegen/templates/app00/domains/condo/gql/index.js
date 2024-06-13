const clientGql = require('./gql.client')
const { CONDO_CONFIG } = clientGql
const serverGql = require('./gql.server')

module.exports = {
    clientGql,
    serverGql,
    CONDO_CONFIG,
}
