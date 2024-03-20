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

const GET_USER_EMAIL_QUERY = gql`
    query getUserEmailById($id: ID!){
        user: User(where: { id: $id }) {
            email
        }
    }
`

module.exports = {
    SEND_MESSAGE_MUTATION,
    REGISTER_SERVICE_USER_MUTATION,
    GET_USER_EMAIL_QUERY,
}