import {gql} from 'graphql-tag'

// Since field `inviteCode` is not exposed for OrganizationEmployee, we need to query it directly
export const GET_ORGANIZATION_EMPLOYEE_BY_ID_WITH_INVITE_CODE_QUERY = gql`
    query getOrganizationEmployeeByIdWithInviteCode (
        $id: ID!
    ) {
        objs: allOrganizationEmployees(
            where: {
                id: $id
            }
            first: 1
        ) {
            id
            inviteCode
        }
    }
`