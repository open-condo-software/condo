import React, { useMemo } from 'react'
import { Select, SelectProps } from 'antd'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { Loader } from '../../common/components/Loader'
import { useEffect } from 'react'

interface IEmployeeRoleSelectProps extends SelectProps<string> {
    organizationId: string
}

export const EmployeeRoleSelect: React.FC<IEmployeeRoleSelectProps> = (props) => {
    const { organizationId, ...restProps } = props
    const { objs: employeeRoles, loading, error } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: organizationId } } })
    const options = useMemo(() => employeeRoles.map((status) => {
        const convertedOption = OrganizationEmployeeRole.convertGQLItemToFormSelectState(status)

        if (convertedOption) {
            const { value, label } = convertedOption
            return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
        }
    }), [employeeRoles, organizationId])

    useEffect(()=>{
        props.onSelect(options[0].props.value, options[0].props)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) {
        return <Loader />
    }
    return !error && (
        <Select
            loading={loading}
            allowClear={false}
            defaultValue={options[0].key}
            {...restProps}
        >
            {options}
        </Select>
    )
}
