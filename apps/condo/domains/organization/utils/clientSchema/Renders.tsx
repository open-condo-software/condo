import { Typography } from 'antd'
import { isEmpty } from 'lodash'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { renderBlockedObject } from '@condo/domains/common/components/GraphQlSearchInput'


export const getEmployeeSpecializationsMessage = (intl, employee, organizationEmployeeSpecializations = []) => {
    const AllSpecializationsMessage = intl.formatMessage({ id: 'employee.AllSpecializations' })
    const SpecializationsCountMessage = intl.formatMessage({ id: 'employee.SpecializationsCount' })
    const AndMessage = intl.formatMessage({ id: 'And' })

    const employeeSpecializations = organizationEmployeeSpecializations
        .filter(scope => scope.employee && scope.employee.id === employee.id)
        .map(scope => scope.specialization.name)

    let SpecializationsMessage
    let title
    if (employee.hasAllSpecializations) {
        title = AllSpecializationsMessage.toLowerCase()
        SpecializationsMessage = (
            <Typography.Text>
                {title}
            </Typography.Text>
        )
    } else if (employeeSpecializations.length > 0){
        const firstSpecializationMessage = employeeSpecializations[0].toLowerCase()

        if (employeeSpecializations.length > 2) {
            title = `${firstSpecializationMessage} ${SpecializationsCountMessage + (employeeSpecializations.length - 1)}`
            SpecializationsMessage = (
                <Typography.Text>
                    {firstSpecializationMessage}&nbsp;
                    <Typography.Text type='secondary'>
                        {SpecializationsCountMessage + (employeeSpecializations.length - 1)}
                    </Typography.Text>
                </Typography.Text>
            )
        } else if (employeeSpecializations.length === 2) {
            const secondSpecializationMessage = employeeSpecializations[1].toLowerCase()
            title = `${firstSpecializationMessage} ${AndMessage} ${secondSpecializationMessage}`
            SpecializationsMessage = <Typography.Text>{title}</Typography.Text>
        } else {
            title = firstSpecializationMessage
            SpecializationsMessage = <Typography.Text>{title}</Typography.Text>
        }
    }

    return { SpecializationsMessage, title }
}

export const EmployeeNameAndSpecializations = ({ employee, organizationEmployeeSpecializations }) => {
    const intl = useIntl()
    const { SpecializationsMessage, title } = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations)
    const textTitle = `${employee.name} (${title})`

    return (
        <Typography.Paragraph key={employee.id} style={PARAGRAPH_STYLES} title={textTitle}>
            {employee.name} {SpecializationsMessage && (
                <Typography.Text>
                ({SpecializationsMessage})
                </Typography.Text>
            )}
        </Typography.Paragraph>
    )
}

const PARAGRAPH_STYLES = { margin: 0 }

export const getManyEmployeesNameRender = () => {
    return function render (intl, employees, organizationEmployeeSpecializations) {
        if (isEmpty(employees)) {
            return '—'
        }

        return employees.map(employee => {
            if (employee.isBlocked) {
                return renderBlockedObject(intl, employee.name)
            }

            return <EmployeeNameAndSpecializations
                key={employee.id}
                employee={employee}
                organizationEmployeeSpecializations={organizationEmployeeSpecializations}
            />
        })
    }
}

export const renderPhone = (value) => {
    if (value) {
        return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)} ${value.slice(8, 10)} ${value.slice(10, 12)}`
    }
}