import { Select, SelectProps } from 'antd'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { useRouter } from 'next/router'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useAuth } from '@core/next/auth'
import get from 'lodash/get'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'

// @ts-ignore
const StyledSelect = styled<SelectProps<string>>(Select)`
  min-width: 120px;
`

export const OrganizationSelect = () => {
    // @ts-ignore
    const { user } = useAuth()
    const intl = useIntl()
    const router = useRouter()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { link, selectLink, isLoading } = useOrganization()
    const { objs: userOrganizations, loading, refetch } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isAccepted: true } : {} },
        { fetchPolicy: 'network-only' }
    )

    const options = React.useMemo(() => {
        return userOrganizations.map((organization) => {
            const { value, label } = OrganizationEmployee.convertGQLItemToFormSelectState(organization)

            return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
        })
    }, [userOrganizations])

    const handleChange = React.useCallback((value) => {
        selectLink({ id: value })
        refetch().then(() => {
            router.push('/')
        })
    }, [])

    const isSelectOptionsVisible = userOrganizations.length > 1 && get(link, 'isBlocked')
    const isOptionsEmpty = !options.length
    const selectValue = isOptionsEmpty ? LoadingMessage : get(link, 'id')

    const selectOptionsProps = {
        value: selectValue,
        size: 'middle',
        onChange: handleChange,
        lading: loading || isLoading,
        disabled: loading || isLoading || isOptionsEmpty,
        ...isSelectOptionsVisible && { open: isSelectOptionsVisible },
    }


    return (
        !isLoading && (
            <StyledSelect {...selectOptionsProps}>
                {options}
            </StyledSelect>
        )
    )
}
