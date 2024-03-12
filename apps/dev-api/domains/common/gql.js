const { gql } = require('graphql-tag')

const SEND_MESSAGE_MUTATION = gql`
    mutation sendMessage ($data: SendMessageInput!) {
        result: sendMessage(data: $data) { status id isDuplicateMessage }
    }
`

const REGISTER_SERVICE_USER_MUTATION = gql`
    mutation registerNewServiceUser ($data: RegisterNewServiceUserInput!) {
        result: registerNewServiceUser(data: $data) {
            id
        }
    }
`

module.exports = {
    SEND_MESSAGE_MUTATION,
    REGISTER_SERVICE_USER_MUTATION,
}