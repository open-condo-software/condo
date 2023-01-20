import { FilterFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Space } from 'antd'
import { CheckboxOptionType } from 'antd/es'
import { FilterDropdownProps } from 'antd/lib/table/interface'
import isFunction from 'lodash/isFunction'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'

import { Button } from './Button'

import { colors } from '../constants/style'

export interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
    style?: CSSProperties
}

const FILTER_CONTAINER_STYLES: CSSProperties = { padding: 16 }

const handleStopPropagation = (e) => e.stopPropagation()

export const FilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const { showClearButton, clearFilters, children } = props
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })

    return (
        <div style={FILTER_CONTAINER_STYLES} onKeyDown={handleStopPropagation}>
            <Space size={8} direction='vertical' align='center'>
                {children}
                {
                    showClearButton && (
                        <Button
                            size='small'
                            onClick={clearFilters}
                            type='inlineLink'
                        >
                            {ResetLabel}
                        </Button>
                    )
                }
            </Space>
        </div>
    )
}

const StyledSelectFilterContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
`

export const SelectFilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const { showClearButton, clearFilters, style, children } = props
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })

    return (
        <StyledSelectFilterContainer style={style} onKeyDown={handleStopPropagation}>
            {children}
            {
                showClearButton && (
                    <Button
                        size='small'
                        onClick={clearFilters}
                        type='inlineLink'
                    >
                        {ResetLabel}
                    </Button>
                )
            }
        </StyledSelectFilterContainer>
    )
}

const STYLE_FILTERED: CSSProperties = { color: colors.sberPrimary[5] }
const STYLE_NO_COLOR: CSSProperties = { color: undefined }

export const getFilterIcon = filtered => <FilterFilled style={filtered ? STYLE_FILTERED : STYLE_NO_COLOR} />

export const getTextFilterDropdown = (columnName: string, setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>) => {
    const TextFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
        <FilterContainer
            clearFilters={clearFilters}
            showClearButton={selectedKeys && selectedKeys.length > 0}>
            <Input
                placeholder={columnName}
                // @ts-ignore
                value={selectedKeys}
                onChange={(e) => {
                    if (isFunction(setSelectedKeys)) setSelectedKeys(e.target.value)
                    if (isFunction(setFiltersApplied)) setFiltersApplied(true)
                    if (isFunction(confirm)) confirm({ closeDropdown: false })
                }}
            />
        </FilterContainer>
    )

    return TextFilterDropdown
}

type CheckboxOptions = (string | CheckboxOptionType)[]

const CHECKBOX_GROUP_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const getCheckboxFilterDropdown = (columnName: string, setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>, options: CheckboxOptions) => {
    const CheckboxFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
            >
                <Checkbox.Group
                    options={options}
                    style={CHECKBOX_GROUP_STYLES}
                    value={selectedKeys}
                    onChange={(e) => {
                        if (isFunction(setSelectedKeys)) setSelectedKeys(e)
                        if (isFunction(setFiltersApplied)) setFiltersApplied(true)
                        if (isFunction(confirm)) confirm({ closeDropdown: false })
                    }}
                />
            </FilterContainer>
        )
    }

    return CheckboxFilterDropdown
}
