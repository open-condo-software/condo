import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { isEmpty } from 'lodash'
import React from 'react'


export const getEmployeeSpecializationsMessage = (intl, employee, specializationScopes): React.ReactElement => {
    const AllSpecializationsMessage = intl.formatMessage({ id: 'employee.AllSpecializations' })
    const SpecializationsCountMessage = intl.formatMessage({ id: 'employee.SpecializationsCount' })

    const employeeSpecializations = specializationScopes
        .filter(scope => scope.employee.id === employee.id)
        .map(scope => scope.specialization.name)

    let SpecializationsMessage = <></>
    if (employee.hasAllSpecializations) {
        SpecializationsMessage = (
            <Typography.Text>
                ({AllSpecializationsMessage.toLowerCase()})
            </Typography.Text>
        )
    } else if (employeeSpecializations.length > 0){
        const firstSpecializationMessage = employeeSpecializations[0].toLowerCase()

        if (employeeSpecializations.length > 1) {
            SpecializationsMessage = (
                <Typography.Text>
                    ({firstSpecializationMessage}&nbsp;
                    <Typography.Text type='secondary'>
                        {SpecializationsCountMessage + employeeSpecializations.length})
                    </Typography.Text>
                </Typography.Text>
            )
        } else {
            SpecializationsMessage = <Typography.Text>({firstSpecializationMessage})</Typography.Text>
        }
    }

    return SpecializationsMessage
}

export const getManyEmployeesNameRender = (search: FilterValue) => {
    return function render (intl, employees, specializationScopes) {
        if (isEmpty(employees)) {
            return '—'
        }

        return employees.map(employee => {
            const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, specializationScopes)

            return (
                <Typography.Paragraph key={employee.id} style={{ margin: 0 }}>
                    {employee.name} {specializationsMessage && specializationsMessage}
                </Typography.Paragraph>
            )
        })
    }
}