import { OrganizationEmployeeRole as IOrganizationEmployeeRole  } from '@app/condo/schema'
import { Select, SelectProps } from 'antd'
import React, { useMemo } from 'react'

import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'


interface IEmployeeRoleSelectProps extends SelectProps<string> {
    employeeRoles: Array<IOrganizationEmployeeRole>
}

export const EmployeeRoleSelect: React.FC<IEmployeeRoleSelectProps> = (props) => {
    const { employeeRoles, ...restProps } = props
    const options = useMemo(() => employeeRoles.map((role) => {
        const convertedOption = OrganizationEmployeeRole.convertGQLItemToFormSelectState(role)

        if (convertedOption) {
            const { value, label } = convertedOption
            return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
        }
    }), [employeeRoles])

    return (<Select
        allowClear={false}
        defaultValue={options[0].key}
        {...restProps}
    >
        {options}
    </Select>
    )
}
