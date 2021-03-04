const gql = require('graphql-tag')
const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const USER_FIELDS = '{ id dv sender name avatar { publicUrl } meta importId v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt }'
const User = genTestGQLUtils('User', USER_FIELDS)
const UserAdmin = genTestGQLUtils('User', '{ id email phone }')

const SIGNIN_MUTATION = gql`
    mutation sigin($identity: String, $secret: String) {
        auth: authenticateUserWithPassword(email: $identity, password: $secret) {
            user: item ${USER_FIELDS}
        }
    }
`

const GET_MY_USERINFO = gql`
    query getUser {
        user: authenticatedUser ${USER_FIELDS}
    }
`

const REGISTER_NEW_USER_MUTATION = gql`
    mutation registerNewUser($data: RegisterNewUserInput!) {
        user: registerNewUser(data: $data) ${USER_FIELDS}
    }
`

module.exports = {
    User,
    UserAdmin,
    SIGNIN_MUTATION,
    GET_MY_USERINFO,
    REGISTER_NEW_USER_MUTATION,
}
