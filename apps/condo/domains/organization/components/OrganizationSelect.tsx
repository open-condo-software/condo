import { Select } from 'antd'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useAuth } from '@core/next/auth'

export const OrganizationSelect = () => {
    // @ts-ignore
    const { user } = useAuth()
    const { link, selectLink, isLoading } = useOrganization()
    const { objs: userOrganizations, loading } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isAccepted: true } : {} },
        { fetchPolicy: 'network-only' }
    )

    const options = userOrganizations.map((organization) => {
        const { value, label } = OrganizationEmployee.convertGQLItemToFormSelectState(organization)

        return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
    })

    const handleChange = (value) => {
        selectLink({ id: value })
    }

    return (
        !isLoading && link && (
            <Select value={link.id} size={'middle'} onChange={handleChange} style={{ width: '100%' }} loading={loading || isLoading}>
                {options}
            </Select>
        )
    )
}
