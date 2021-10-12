/** @jsx jsx */
import styled from '@emotion/styled'
import { Select } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import React, { useRef } from 'react'
import { useOrganization } from '@core/next/organization'
import { useAuth } from '@core/next/auth'
import get from 'lodash/get'
import { jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { useEffect } from 'react'

const StyledSelect = styled(Select)`
  min-width: 200px;
  max-width: 270px;
  text-align: right;
  z-index: 100;
`

const AddOrganizationButtonContainer = styled.div`
    padding: 6px 12px;
`

export const OrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const EmptyMessage = intl.formatMessage({ id: 'Select' })
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })

    const { user } = useAuth()
    const selectRef = useRef<HTMLSelectElement>(null)
    const { link, selectLink, isLoading: organizationLoading } = useOrganization()

    const { objs: userOrganizations, loading: organizationLinksLoading } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isRejected: false, isBlocked: false } : {} },
        { fetchPolicy: 'cache-first' }
    )

    const { setIsVisible: showCreateOrganizationModal, ModalForm: CreateOrganizationModalForm } = useCreateOrganizationModalForm({})

    const options = React.useMemo(() => {
        return userOrganizations.filter(link => link.isAccepted).map((organization) => {
            const { value, label } = OrganizationEmployee.convertGQLItemToFormSelectState(organization)
            return (<Select.Option key={value} value={value} title={label}>{label}</Select.Option>)
        })
    }, [userOrganizations])

    const chooseOrganizationByLinkId = React.useCallback((value) => {
        selectLink({ id: value })
    }, [selectLink])

    // When user lost his cookies with chosen organization - he will see select opened
    useEffect(() => {
        if (!organizationLinksLoading && user && !link) {
            if (userOrganizations.length && selectRef.current) {
                selectRef.current.focus()
            }
        }
    }, [userOrganizations, organizationLinksLoading, user, link])

    const isOptionsEmpty = !options.length
    const selectValue = isOptionsEmpty ? EmptyMessage : get(link, 'id')
    const selectOptionsProps = {
        value: selectValue,
        onChange: chooseOrganizationByLinkId,
        loading: organizationLinksLoading || organizationLoading,
    }

    return !(organizationLoading || organizationLinksLoading) && (
        <>
            <StyledSelect
                ref={selectRef}
                size={'middle'}
                bordered={false}
                dropdownMatchSelectWidth
                showAction={['focus', 'click' ]}
                dropdownRender={menu => (
                    <div>
                        {menu}
                        <AddOrganizationButtonContainer>
                            <Button
                                size={'small'}
                                type={'inlineLink'}
                                onClick={() => showCreateOrganizationModal(true)}
                            >
                                {AddOrganizationTitle}
                            </Button>
                        </AddOrganizationButtonContainer>
                    </div>
                )}
                {...selectOptionsProps}>
                {options}
            </StyledSelect>
            <CreateOrganizationModalForm />
        </>
    )

}
