
const { ApolloServerClient } = require('@open-condo/apollo-server-client')


class CondoClient extends ApolloServerClient {
    constructor ({ endpoint, authRequisites, opts }) {
        super(endpoint, authRequisites, opts)
    }

    // AUTO_GENERATED: use needed methods here
}

module.exports = { CondoClient }
