import { Input, Space } from 'antd'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from './Button'
import { FilterFilled } from '@ant-design/icons'
import { colors } from '../constants/style'

interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
}

export const FilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })

    return (
        <div style={{ padding: 16 }}>
            <Space size={8} direction={'vertical'} align={'center'}>
                {props.children}
                {
                    props.showClearButton && (
                        <Button
                            size={'small'}
                            onClick={() => props.clearFilters()}
                            type={'inlineLink'}
                        >
                            {ResetLabel}
                        </Button>
                    )
                }
            </Space>
        </div>
    )
}

export const getFilterIcon = filtered => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />

export const getTextFilterDropdown = (columnName: string,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>) => {

    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                <Input
                    placeholder={columnName}
                    value={selectedKeys}
                    onChange={e => {
                        setSelectedKeys(e.target.value)
                        setFiltersApplied(true)
                        confirm({ closeDropdown: false })
                    }}
                />
            </FilterContainer>
        )
    }
}