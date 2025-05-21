import { gql } from 'graphql-tag'

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query selectOrganizationEmployee ($where: OrganizationEmployeeWhereInput, $first: Int = 300, $skip: Int) {
        objs: allOrganizationEmployees(first: $first, skip: $skip, where: $where) {
            name
            id
            user {
                id
            }
            role {
                id
                name
                canBeAssignedAsExecutor
                canBeAssignedAsResponsible
                ticketVisibilityType
            }
            hasAllSpecializations
            isBlocked
        }
    }
`

const GET_ALL_ORGANIZATION_EMPLOYEE_SPECIALIZATIONS_QUERY = gql`
    query selectOrganizationEmployeeSpecializations ($employeeIds: [ID], $first: Int = 300, $skip: Int) {
        objs: allOrganizationEmployeeSpecializations(first: $first, skip: $skip, where: {employee: { id_in: $employeeIds } }) {
            employee { id }
            specialization { id name }
        }
    }
`

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

export function searchEmployeeWithSpecializations (intl, organizationId, filter) {
    if (!organizationId) return

    return async function (client, value, query = {}, first = 300, skip = 0) {
        const where = {
            organization: { id: organizationId },
            name_contains_i: value,
            ...query,
        }
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { where, first, skip })

        const employees = data.objs.filter(Boolean)

        const {
            data: organizationEmployeeSpecializations,
            error: organizationEmployeeSpecializationsError,
        } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_SPECIALIZATIONS_QUERY, {
            employeeIds: employees.map(employee => employee.id),
        })

        if (error || organizationEmployeeSpecializationsError) console.warn({ msg: 'Error', error })

        return employees
            .filter(Boolean)
            .filter(filter || Boolean)
            .map(employee => ({
                value: employee.id,
                employee,
                specializations: organizationEmployeeSpecializations.objs,
            }))
    }
}

export function searchEmployeeUser (intl, organizationId, filter) {
    if (!organizationId) return

    return async function (client, value, query = {}, first = 300, skip = 0) {
        const where  = {
            organization: { id: organizationId },
            name_contains_i: value,
            ...query,
        }
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { where, first, skip })

        const employees = data.objs

        if (error) console.warn({ msg: 'Error', error })

        return employees
            .filter(Boolean)
            .filter(filter || Boolean)
            .filter(({ user }) => user)
            .map(employee => ({
                value: employee.id,
                employee,
            }))
    }
}
