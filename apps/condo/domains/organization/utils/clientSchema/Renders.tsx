import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { isEmpty } from 'lodash'
import React from 'react'


export const getEmployeeSpecializationsMessage = (intl, employee, organizationEmployeeSpecializations): React.ReactElement => {
    const AllSpecializationsMessage = intl.formatMessage({ id: 'employee.AllSpecializations' })
    const SpecializationsCountMessage = intl.formatMessage({ id: 'employee.SpecializationsCount' })
    const AndMessage = intl.formatMessage({ id: 'And' })

    const employeeSpecializations = organizationEmployeeSpecializations
        .filter(scope => scope.employee && scope.employee.id === employee.id)
        .map(scope => scope.specialization.name)

    let SpecializationsMessage
    if (employee.hasAllSpecializations) {
        SpecializationsMessage = (
            <Typography.Text>
                {AllSpecializationsMessage.toLowerCase()}
            </Typography.Text>
        )
    } else if (employeeSpecializations.length > 0){
        const firstSpecializationMessage = employeeSpecializations[0].toLowerCase()

        if (employeeSpecializations.length > 2) {
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
            SpecializationsMessage = <Typography.Text>{firstSpecializationMessage} {AndMessage} {secondSpecializationMessage}</Typography.Text>
        } else {
            SpecializationsMessage = <Typography.Text>{firstSpecializationMessage}</Typography.Text>
        }
    }

    return SpecializationsMessage
}

const PARAGRAPH_STYLES = { margin: 0 }

export const getManyEmployeesNameRender = (search: FilterValue) => {
    return function render (intl, employees, organizationEmployeeSpecializations) {
        if (isEmpty(employees)) {
            return '—'
        }

        return employees.map(employee => {
            const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations)

            return (
                <Typography.Paragraph key={employee.id} style={PARAGRAPH_STYLES}>
                    {employee.name} {specializationsMessage && (
                        <Typography.Text>
                        ({specializationsMessage})
                        </Typography.Text>
                    )}
                </Typography.Paragraph>
            )
        })
    }
}

export const renderPhone = (value) => {
    if (value) {
        return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)} ${value.slice(8, 10)} ${value.slice(10, 12)}`
    }
}