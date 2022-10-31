import { Typography } from 'antd'
import { gql } from 'graphql-tag'
import React from 'react'

import { getEmployeeSpecializationsMessage } from './Renders'

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

    return async function (client, value, query = {}, first, skip) {
        const where = {
            organization: { id: organizationId },
            ...query,
        }
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, where, first, skip })

        const employees = data.objs

        const {
            data: organizationEmployeeSpecializations,
            error: organizationEmployeeSpecializationsError,
        } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_SPECIALIZATIONS_QUERY, {
            employeeIds: employees.map(employee => employee.id),
        })

        if (error || organizationEmployeeSpecializationsError) console.warn(error)

        return employees
            .filter(filter || Boolean)
            .map(employee => {
                const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations.objs)
                const EmployeeText = (
                    <Typography.Text>
                        {employee.name} {specializationsMessage && (
                            <Typography.Text>
                                ({specializationsMessage})
                            </Typography.Text>
                        )}
                    </Typography.Text>
                )

                return { text: EmployeeText, title: employee.name, value: employee.id }
            })
    }
}

export function searchEmployeeUserWithSpecializations (intl, organizationId, filter) {
    if (!organizationId) return

    return async function (client, value, query = {}, first, skip) {
        const where  = {
            organization: { id: organizationId },
            ...query,
        }
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, where, first, skip })

        const employees = data.objs

        if (error) console.warn(error)

        return employees
            .filter(filter || Boolean)
            .filter(({ user }) => user)
            .map(employee => ({
                value: employee.id,
                employee,
            }))
    }
}