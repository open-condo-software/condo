const botGql = require('./gql.bot')
const clientGql = require('./gql.client')
const { CONDO_CONFIG } = clientGql
const serverGql = require('./gql.server')

module.exports = {
    clientGql,
    serverGql,
    botGql,
    CONDO_CONFIG,
}
