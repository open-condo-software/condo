const { gql } = require('graphql-tag')

const SEND_MESSAGE_MUTATION = gql`
    mutation sendMessage ($data: SendMessageInput!) {
        result: sendMessage(data: $data) { status id isDuplicateMessage }
    }
`

module.exports = {
    SEND_MESSAGE_MUTATION,
}