import { Typography } from 'antd'
import { gql } from 'graphql-tag'
import React from 'react'
import { getEmployeeSpecializationsMessage } from './Renders'

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query selectOrganizationEmployee ($value: String, $organizationId: ID) {
        objs: allOrganizationEmployees(where: {name_contains_i: $value, organization: { id: $organizationId }}) {
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
        }
    }
`

const GET_ALL_SPECIALIZATION_SCOPE_QUERY = gql`
    query selectSpecializationScope ($employeeIds: [ID]) {
        objs: allSpecializationScopes(where: {employee: { id_in: $employeeIds } }) {
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

    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, organizationId })

        const employees = data.objs

        const { data: specializationScopes, error: specializationScopesError } = await _search(client, GET_ALL_SPECIALIZATION_SCOPE_QUERY, {
            employeeIds: employees.map(employee => employee.id),
        })

        if (error || specializationScopesError) console.warn(error)

        return employees
            .filter(filter || Boolean)
            .map(employee => {
                const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, specializationScopes.objs)
                const EmployeeText = (
                    <Typography.Text>
                        {employee.name} {specializationsMessage && specializationsMessage}
                    </Typography.Text>
                )

                return { text: EmployeeText, title: employee.name, value: employee.id }
            })
    }
}

export function searchEmployeeUserWithSpecializations (intl, organizationId, specializationScopes, filter) {
    if (!organizationId) return

    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, organizationId })

        const employees = data.objs

        if (error) console.warn(error)

        return employees
            .filter(filter || Boolean)
            .filter(({ user }) => user)
    }
}