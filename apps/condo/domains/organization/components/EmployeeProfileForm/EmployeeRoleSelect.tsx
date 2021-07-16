import React, { useMemo } from 'react'
import { Select, SelectProps } from 'antd'
import get from 'lodash/get'
import { OrganizationEmployee } from '../../../../schema'
import { OrganizationEmployeeRole } from '../../utils/clientSchema'
import { useEffect } from 'react'

interface IEmployeeRoleSelectProps extends SelectProps<string> {
    employee: OrganizationEmployee
}

export const EmployeeRoleSelect: React.FC<IEmployeeRoleSelectProps> = (props) => {
    const { employee, ...restProps } = props

    const employeeOrganizationId = get(employee, ['organization', 'id'])
    const { objs: employeeRoles, loading, error } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: employeeOrganizationId } } })
    const options = useMemo(() => employeeRoles.map((employeeRole) => {
        const convertedOption = OrganizationEmployeeRole.convertGQLItemToFormSelectState(employeeRole)
        console.log('convertedOption', convertedOption)
        console.log('hii')
        if (convertedOption) {
            const { value, label } = convertedOption

            return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
        }
    }), [employeeRoles, employee])
    useEffect(()=> console.log(options), [options])
    return !error && (
        <Select
            loading={loading}
            allowClear={true}
            defaultActiveFirstOption
            {...restProps}
        >{options}</Select>
    )
}
