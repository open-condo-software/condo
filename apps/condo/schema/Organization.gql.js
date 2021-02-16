const gql = require('graphql-tag')
const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const ORGANIZATION_FIELDS = '{ id country name description avatar { publicUrl } }'
const Organization = genTestGQLUtils('Organization', ORGANIZATION_FIELDS)

const ORGANIZATION_ROLE_FIELDS = '{ id name canManageOrganization canManageEmployees canManageRoles }'
const OrganizationEmployeeRole = genTestGQLUtils('OrganizationEmployeeRole', ORGANIZATION_ROLE_FIELDS)

const ORGANIZATION_EMPLOYEE_FIELDS = `{ id organization ${ORGANIZATION_FIELDS} user { id name } name email phone role ${ORGANIZATION_ROLE_FIELDS} isRejected isAccepted }`
const OrganizationEmployee = genTestGQLUtils('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS)

const GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY = gql`
    query getOrganizationEmployeeById($id: ID!) {
        obj: OrganizationEmployee (where: {id: $id}) ${ORGANIZATION_EMPLOYEE_FIELDS}
    }
`

const UPDATE_ORGANIZATION_BY_ID_MUTATION = gql`
    mutation updateOrganizationById($id: ID!, $data: OrganizationUpdateInput!) {
        obj: updateOrganization(id: $id, data: $data) ${ORGANIZATION_FIELDS}
    }
`

const GET_ALL_EMPLOYEE_ORGANIZATIONS_QUERY = gql`
    query getAllOrganizationEmployeesWithMeta($where: OrganizationEmployeeWhereInput) {
        meta: _allOrganizationEmployeesMeta { count }
        objs: allOrganizationEmployees (where: $where) ${ORGANIZATION_EMPLOYEE_FIELDS}
    }
`

const REGISTER_NEW_ORGANIZATION_MUTATION = gql`
    mutation registerNewOrganization($data: RegisterNewOrganizationInput!) {
        obj: registerNewOrganization(data: $data) ${ORGANIZATION_FIELDS}
    }
`

const ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION = gql`
    mutation acceptOrRejectOrganizationToUserLink($id: ID!, $data: AcceptOrRejectOrganizationInviteInput!){
        obj: acceptOrRejectOrganizationInviteById(id: $id, data: $data) { id }
    }
`

const INVITE_NEW_USER_TO_ORGANIZATION_MUTATION = gql`
    mutation inviteNewUserToOrganization($data: InviteNewUserToOrganizationInput!) {
        obj: inviteNewUserToOrganization(data: $data) ${ORGANIZATION_EMPLOYEE_FIELDS}
    }
`

module.exports = {
    Organization,
    OrganizationEmployeeRole,
    OrganizationEmployee,
    GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY,
    UPDATE_ORGANIZATION_BY_ID_MUTATION,
    GET_ALL_EMPLOYEE_ORGANIZATIONS_QUERY,
    REGISTER_NEW_ORGANIZATION_MUTATION,
    ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION,
    INVITE_NEW_USER_TO_ORGANIZATION_MUTATION,
}
