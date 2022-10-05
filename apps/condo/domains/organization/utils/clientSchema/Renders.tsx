import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { isEmpty } from 'lodash'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'

export const getEmployeeSpecializationsMessage = (intl, employee, specializationScopes) => {
    const AllSpecializationsMessage = intl.formatMessage({ id: 'employee.AllSpecializations' })
    const SpecializationsCountMessage = intl.formatMessage({ id: 'employee.SpecializationsCount' })

    const employeeSpecializations = specializationScopes
        .filter(scope => scope.employee.id === employee.id)
        .map(scope => scope.specialization.name)

    let specializationsMessage
    if (employee.hasAllSpecializations) {
        specializationsMessage = AllSpecializationsMessage
    } else if (employeeSpecializations.length > 1) {
        specializationsMessage = SpecializationsCountMessage + employeeSpecializations.length
    } else if (employeeSpecializations.length === 1) {
        specializationsMessage = employeeSpecializations[0]
    }

    return specializationsMessage
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
                    {employee.name} {specializationsMessage && `(${specializationsMessage})`}
                </Typography.Paragraph>
            )
        })
    }
}