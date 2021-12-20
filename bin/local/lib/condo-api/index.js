const { gql } = require('graphql-tag')
const { ApolloClient, InMemoryCache, HttpLink, ApolloLink } = require('apollo-boost')
const fetch = require('cross-fetch/polyfill').fetch

const INTEGRATION_INFO = {
    dv: 1,
    sender: {
        dv: 1,
        fingerprint: 'new-integration-name',
    },
}

const SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN = gql`
    mutation signin ($phone: String!, $password: String!) {
        obj: authenticateUserWithPhoneAndPassword(data: { phone: $phone, password: $password }) {
            item {
                id
            }
            token
        }
    }
`

class CondoApi {
    sender = INTEGRATION_INFO
    client = null
    authToken = null

    constructor ({ endpoint, ...user }) {
        this.endpoint = endpoint
        this.user = user
    }

    async signIn () {
        this.client = new ApolloClient({
            link: this.authLink().concat(this.httpLink()),
            cache: new InMemoryCache(),
        })

        try {
            const { data: { obj: { token } } } = await this.client.mutate({
                mutation: SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN,
                variables: { ...this.user },
            })

            if (!token) throw new Error('Unable to sign in')

            this.authToken = token
        } catch (err) {
            throw new Error(err)
        }

        return this
    }

    authLink () {
        return new ApolloLink((operation, forward) => {
            operation.setContext({
                headers: {
                    authorization: 'Bearer ' + this.authToken,
                },
            })

            return forward(operation)
        })
    }

    httpLink () {
        return new HttpLink({ uri: this.endpoint, fetch })
    }

}

module.exports = {
    CondoApi,
}
