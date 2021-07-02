/** @jsx jsx */

import { Select, Divider, Input } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { useRouter } from 'next/router'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useAuth } from '@core/next/auth'
import get from 'lodash/get'
import { css, jsx } from '@emotion/core'
import { useIntl } from '@core/next/intl'
import { colors } from '@condo/domains/common/constants/style'


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
  &.ant-select:not(.ant-select-disabled):hover .ant-select-selector{
      border-color: ${colors.sberGrey[6]};
  }
  &.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector{
    box-shadow: 0 0 0 1px ${colors.sberGrey[6]};
  }
  &.ant-select-single.ant-select-open .ant-select-selection-item{
    color: ${colors.white};
  }
  & .ant-select-item-option-selected:not(.ant-select-item-option-disabled){
      background: ${colors.white};
  }
`
const blackSelectOptionsStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '24px',
    backgroundColor: 'white',
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '12px',
}

export const OrganizationSelect = () => {
    // @ts-ignore
    const { user } = useAuth()
    const intl = useIntl()
    const router = useRouter()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const AddOrganizationTitle = 'Добавить организацию'

    const { link, selectLink, isLoading } = useOrganization()
    const { objs: userOrganizations, loading, refetch } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isAccepted: true } : {} },
        { fetchPolicy: 'network-only' }
    )

    const options = React.useMemo(() => {
        return userOrganizations.map((organization) => {
            const { value, label } = OrganizationEmployee.convertGQLItemToFormSelectState(organization)
            return (<Select.Option style={blackSelectOptionsStyle} key={value} value={value} title={label}>{label}</Select.Option>)
        })
    }, [userOrganizations])

    const handleChange = React.useCallback((value) => {
        selectLink({ id: value })
        refetch().then(() => {
            router.push('/')
        })
    }, [])

    const isOptionsEmpty = !options.length
    const selectValue = isOptionsEmpty ? LoadingMessage : get(link, 'id')

    const selectOptionsProps = {
        value: selectValue,
        onChange: handleChange,
        loading: loading || isLoading,
        disabled: loading || isLoading,
    }


    return (
        !isLoading && (
            <Select
                css={blackSelectCss}
                size={'middle'}
                dropdownRender={menu => (
                    <div>
                        {menu}
                        <Button
                            type={'inlineLink'}
                            style={{ marginLeft: '12px', paddingBottom: '8px' }}
                            onClick={
                                () => alert()
                            }
                        >{AddOrganizationTitle}</Button>
                    </div>
                )}
                {...selectOptionsProps}>
                {options}
            </Select>
        )
    )
}
