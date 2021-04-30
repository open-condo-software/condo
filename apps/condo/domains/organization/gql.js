const { gql } = require('graphql-tag')
const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const ORGANIZATION_FIELDS = '{ id dv sender v country name description avatar { publicUrl } statusTransitions defaultEmployeeRoleStatusTransitions }'
const Organization = genTestGQLUtils('Organization', ORGANIZATION_FIELDS)

const ORGANIZATION_ROLE_FIELDS = '{ id dv sender v name statusTransitions canManageOrganization canManageEmployees canManageRoles canManageProperties canManageTickets }'
const OrganizationEmployeeRole = genTestGQLUtils('OrganizationEmployeeRole', ORGANIZATION_ROLE_FIELDS)

const ORGANIZATION_EMPLOYEE_FIELDS = `{ id dv sender v organization ${ORGANIZATION_FIELDS} user { id name } name email phone role ${ORGANIZATION_ROLE_FIELDS} isRejected isAccepted }`
const OrganizationEmployee = genTestGQLUtils('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS)

// TODO(pahaz): rename autocomplete queries

const GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY = gql`
    query getOrganizationEmployeeById($id: ID!) {
        obj: OrganizationEmployee(where: {id: $id}) ${ORGANIZATION_EMPLOYEE_FIELDS}
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
        objs: allOrganizationEmployees(where: $where) ${ORGANIZATION_EMPLOYEE_FIELDS}
    }
`

const REGISTER_NEW_ORGANIZATION_MUTATION = gql`
    mutation registerNewOrganization($data: RegisterNewOrganizationInput!) {
        obj: registerNewOrganization(data: $data) ${ORGANIZATION_FIELDS}
    }
`

const INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION = gql`
    mutation inviteNewOrganizationEmployee($data: InviteNewOrganizationEmployeeInput!) {
        obj: inviteNewOrganizationEmployee(data: $data) ${ORGANIZATION_EMPLOYEE_FIELDS}
    }
`

const ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION = gql`
    mutation acceptOrRejectOrganizationInviteById($id: ID!, $data: AcceptOrRejectOrganizationInviteInput!){
        obj: acceptOrRejectOrganizationInviteById(id: $id, data: $data) ${ORGANIZATION_EMPLOYEE_FIELDS}
    }
`

const ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_CODE_MUTATION = gql`
    mutation acceptOrRejectOrganizationInviteByCode($inviteCode: String!, $data: AcceptOrRejectOrganizationInviteInput!){
        obj: acceptOrRejectOrganizationInviteByCode(inviteCode: $inviteCode, data: $data) ${ORGANIZATION_EMPLOYEE_FIELDS}
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
    INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION,
    ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION,
    ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_CODE_MUTATION,
}
