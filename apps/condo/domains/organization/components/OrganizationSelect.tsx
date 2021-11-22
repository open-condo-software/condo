/** @jsx jsx */
import React, { useRef, useEffect } from 'react'
import { Select } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { useAuth } from '@core/next/auth'
import get from 'lodash/get'
import { css, jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { colors, gradients } from '@condo/domains/common/constants/style'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'

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
  &.ant-select.ant-select-single.ant-select-open .ant-select-selector {
    background: ${gradients.sberActionGradient};
    border: none;
    border-color: unset;
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
  }

  &.ant-select.ant-select-single.ant-select-open .ant-select-selector {
    background: ${gradients.sberActionGradient};
    border: none;
  }
`

// TODO(zuch): can't use emotion css here
const optionStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: colors.white,
}

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
            return (<Select.Option style={optionStyle} key={value} value={value} title={label}>{label}</Select.Option>)
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
                        size={'middle'}
                        showAction={['focus', 'click' ]}
                        dropdownRender={menu => (
                            <div>
                                {menu}
                                <Button
                                    type={'inlineLink'}
                                    style={{ marginLeft: '12px', padding: '8px 0', fontSize: '14px' }}
                                    onClick={() => showCreateOrganizationModal(true)}
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
