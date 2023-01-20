/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { Select, SelectProps } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useRef, useEffect } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Button } from '@condo/domains/common/components/Button'
import { colors, gradients } from '@condo/domains/common/constants/style'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'


import { ASSIGNED_TICKET_VISIBILITY } from '../constants/common'


const blackSelectCss = css`
  width: 200px;
  font-size: 16px;
  font-weight: 600;

  &.ant-select .ant-select-selector {
    background: ${colors.white};
  }

  &.ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
    height: 40px;
  }

  &.ant-select-single:not(.ant-select-customize-input) .ant-select-selection-item {
    line-height: 38px;
    transition: none;
  }
  
  & .ant-select-arrow {
    color: ${colors.black};
  }

  &.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector,
  &.ant-select:not(.ant-select-disabled):hover .ant-select-selector,
  &.ant-select.ant-select-single.ant-select-open .ant-select-selector,
  &.ant-select.ant-select-single.ant-select-focused .ant-select-selector {
    background: ${gradients.sberActionGradient};
    border: 1px solid transparent;
    box-shadow: none;
  }
  &.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selection-item,
  &.ant-select:not(.ant-select-disabled):hover .ant-select-selection-item,
  &.ant-select.ant-select-single.ant-select-open .ant-select-selection-item {
    color: ${colors.white};
  }
  &.ant-select:not(.ant-select-disabled):hover .ant-select-arrow,
  &.ant-select.ant-select-single.ant-select-open .ant-select-arrow {
    color: ${colors.white};
  }

  &.ant-select:not(.ant-select-disabled):active .ant-select-selector {
    background: ${gradients.sberActionInversed};
    border: 1px solid transparent;
  }

  &.ant-select.ant-select-single.ant-select-open .ant-select-selector {
    background: ${gradients.sberActionGradient};
    border: 1px solid transparent;
  }
`

// TODO(zuch): can't use emotion css here
const optionStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: colors.white,
}

const ORGANIZATION_SELECT_SHOW_ACTIONS: SelectProps<string>['showAction'] = ['focus', 'click']

export const OrganizationSelect: React.FC = () => {
    const intl = useIntl()
    const EmptyMessage = intl.formatMessage({ id: 'Select' })
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })

    const router = useRouter()
    const { user } = useAuth()
    const selectRef = useRef(null)
    const { link, selectLink, isLoading: organizationLoading } = useOrganization()

    const { objs: userOrganizations, loading: organizationLinksLoading } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isRejected: false, isBlocked: false } : {} }
    )

    const { setIsVisible: showCreateOrganizationModal, ModalForm: CreateOrganizationModalForm } = useCreateOrganizationModalForm({})

    const options = React.useMemo(() => {
        return userOrganizations.filter(link => link.isAccepted).map((employee) => {
            const organizationOption = OrganizationEmployee.convertGQLItemToFormSelectState(employee)

            if (!organizationOption)
                return false

            const { value, label } = organizationOption

            return (
                <Select.Option
                    data-cy='organization-select-item'
                    style={optionStyle}
                    key={value}
                    value={value}
                    title={label}
                >
                    {label}
                </Select.Option>
            )
        })
    }, [userOrganizations])

    // When user lost his cookies with chosen organization - he will see select opened
    useEffect(() => {
        if (!organizationLinksLoading && user && !link){
            if (userOrganizations.length && selectRef.current) {
                selectRef.current.focus()
            }
        }
    }, [userOrganizations, organizationLinksLoading, user, link])

    useEffect(() => {
        if (get(link, ['role', 'ticketVisibilityType']) === ASSIGNED_TICKET_VISIBILITY && !router.route.includes('ticket')) {
            router.push('/ticket')
        }
    }, [link, router])

    const chooseOrganizationByLinkId = React.useCallback((value) => {
        selectLink({ id: value })
    }, [selectLink])

    const isOptionsEmpty = !options.length
    const selectValue = isOptionsEmpty ? EmptyMessage : get(link, 'id')
    const selectOptionsProps = {
        value: selectValue,
        onChange: chooseOrganizationByLinkId,
        loading: organizationLinksLoading || organizationLoading,
    }

    return (
        <>
            {!(organizationLoading || organizationLinksLoading) && (
                <>
                    <Select
                        ref={selectRef}
                        css={blackSelectCss}
                        size='middle'
                        showAction={ORGANIZATION_SELECT_SHOW_ACTIONS}
                        dropdownRender={menu => (
                            <div>
                                {menu}
                                <Button
                                    type='inlineLink'
                                    style={{ marginLeft: '12px', padding: '8px 0', fontSize: '14px' }}
                                    onClick={() => showCreateOrganizationModal(true)}
                                    eventName='OrganizationSelectClickAddOrganization'
                                >{AddOrganizationTitle}</Button>
                            </div>
                        )}
                        {...selectOptionsProps}>
                        {options}
                    </Select>
                    <CreateOrganizationModalForm />
                </>
            )}
        </>
    )
}
