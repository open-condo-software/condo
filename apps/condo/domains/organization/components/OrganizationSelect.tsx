import { Select } from 'antd'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import React from 'react'
import { useOrganization } from '@core/next/organization'

export const OrganizationSelect = () => {
    const { link, selectLink } = useOrganization()
    const { objs: userOrganizations } = OrganizationEmployee.useObjects(
        {},
        { fetchPolicy: 'network-only' }
    )
    console.log(userOrganizations)

    const options = userOrganizations.map((organization) => {
        const { value, label } = OrganizationEmployee.convertGQLItemToFormSelectState(organization)

        return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
    })

    const handleChange = (value) => {
        selectLink({ id: value })
    }

    return (
        link && (
            <Select value={link.id} size={'middle'} onChange={handleChange} style={{ width: '100%' }}>
                {options}
            </Select>
        )
    )
}
