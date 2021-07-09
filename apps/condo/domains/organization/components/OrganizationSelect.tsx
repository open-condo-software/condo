/** @jsx jsx */

import { Select } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import React, { useRef } from 'react'
import { useOrganization } from '@core/next/organization'
import { useAuth } from '@core/next/auth'
import get from 'lodash/get'
import { css, jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { colors } from '@condo/domains/common/constants/style'
import { useCreateOrganizationModalForm } from '@condo/domains/organization/hooks/useCreateOrganizationModalForm'
import { useEffect } from 'react'

const blackSelectCss = css`
  width: 200px;
  color: ${colors.white};
  &.ant-select:not(.ant-select-customize-input) .ant-select-selector {
    border: 1px solid ${colors.black};
    border-radius: 4px;
  }
  &.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
    border-color: ${colors.sberGrey[6]};
    background-color: ${colors.black};
    color: ${colors.white};
  }
  &.ant-select:not(.ant-select-customize-input) .ant-select-selector {
    background-color: ${colors.black};
  }
  & .ant-select-arrow{
    color: ${colors.white};
  }
  &.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector,
  &.ant-select:not(.ant-select-disabled):hover .ant-select-selector{
    border-color: ${colors.sberGrey[6]};
    box-shadow: 0 0 0 1px ${colors.sberGrey[6]};
  }
  &.ant-select-single.ant-select-open .ant-select-selection-item{
    color: ${colors.white};
  }
  & .ant-select-item-option-selected:not(.ant-select-item-option-disabled){
      background: ${colors.white};
  }
`
// TODO(zuch): can't use emotion css here
const optionStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '20px',
    backgroundColor: colors.white,
}

export const OrganizationSelect: React.FC = () => {
    const { user } = useAuth()
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const AddOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })
    const selectRef = useRef<HTMLSelectElement>(null)
    const { link, selectLink, isLoading: organizationLoading } = useOrganization()
    const { objs: userOrganizations, loading: organizationLinksLoading, fetchMore } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isRejected: false, isBlocked: false } : {} },
        { fetchPolicy: 'network-only' }
    )
    const chooseOrganizationByLinkId = React.useCallback((value) => {
        selectLink({ id: value })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const { setVisible: showCreateOrganizationModal, ModalForm: CreateOrganizationModalForm } = useCreateOrganizationModalForm({
        onFinish: (createResult) => {
            const id = get(createResult, 'data.obj.id')
            fetchMore({
                where: { organization: { id }, user: { id: user.id } },
            }).then((data) => {
                const userLinks = get(data, 'data.objs', [])
                if (id) {
                    const newLink = userLinks.find(link => link.organization.id === id)
                    if (newLink) {
                        chooseOrganizationByLinkId(newLink.id)
                    }
                }
            })
            return null
        },
    })
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
    // User without invites and organizations will be forced to create one
    useEffect(() => {
        if (!organizationLinksLoading && user){
            if (!userOrganizations.length) {
                showCreateOrganizationModal(true)
            }
        }
    }, [userOrganizations, organizationLinksLoading, showCreateOrganizationModal, user])

    const isOptionsEmpty = !options.length
    const selectValue = isOptionsEmpty ? LoadingMessage : get(link, 'id')
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
