import React, { useMemo } from 'react'
import { Select, SelectProps } from 'antd'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployeeRole as IOrganizationEmployeeRole } from '../../../schema'
import { Loader } from '@condo/domains/common/components/Loader'

interface IEmployeeRoleSelectProps extends SelectProps<string> {
    employeeRoles: Array<IOrganizationEmployeeRole>
    error: boolean
}

export const EmployeeRoleSelect: React.FC<IEmployeeRoleSelectProps> = (props) => {
    const { employeeRoles, loading, error, ...restProps } = props
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

    if (loading) {
        return <Loader />
    }
    return (
        !error && (
            <Select loading={loading} allowClear={false} defaultValue={options[0].key} {...restProps}>
                {options}
            </Select>
        )
    )
}
