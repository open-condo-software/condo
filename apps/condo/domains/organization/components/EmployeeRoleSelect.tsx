import React, { useMemo } from 'react'
import { Select, SelectProps } from 'antd'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployeeRole as IOrganizationEmployeeRole } from '@app/condo/schema'

interface IEmployeeRoleSelectProps extends SelectProps<string> {
    employeeRoles: Array<IOrganizationEmployeeRole>
}

export const EmployeeRoleSelect: React.FC<IEmployeeRoleSelectProps> = (props) => {
    const { employeeRoles, ...restProps } = props
    const options = useMemo(
        () =>
            employeeRoles.map((role) => {
                const convertedOption = OrganizationEmployeeRole.convertGQLItemToFormSelectState(role)

                if (convertedOption) {
                    const { value, label } = convertedOption
                    return (
                        <Select.Option key={value} value={value} title={label}>
                            {label}
                        </Select.Option>
                    )
                }
            }),
        [employeeRoles],
    )

    return (
        <Select allowClear={false} defaultValue={options[0].key} {...restProps}>
            {options}
        </Select>
    )
}
