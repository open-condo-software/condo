import { Input, Space } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import { createSorterMap, IFilters } from '../utils/helpers'
import { css } from '@emotion/core'

const getFilterIcon = filtered => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />

interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
}

const FilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })
    const FilterContainerDiv = css`padding: 16px`

    return (
        <div css={FilterContainerDiv}>
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

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

function getFilterDropdown (message: string) {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                <Input
                    placeholder={message}
                    value={selectedKeys}
                    onChange={e => {
                        setSelectedKeys(e.target.value)
                        confirm({ closeDropdown: false })
                    }}
                />
            </FilterContainer>
        )
    }
}

export const useTableColumns = (sort: Array<string>, filters: IFilters) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address' })

    const sorterMap = createSorterMap(sort)

    return useMemo(() => {
        return [
            {
                title: NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '25%',
                filterDropdown: getFilterDropdown(NameMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: AddressMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                dataIndex: ['property', 'address'],
                key: 'address',
                sorter: false,
                width: '35%',
                filterDropdown: getFilterDropdown(AddressMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '20%',
                filterDropdown: getFilterDropdown(PhoneMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: EmailMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'email'),
                filteredValue: getFilteredValue(filters, 'email'),
                dataIndex: 'email',
                key: 'email',
                sorter: true,
                width: '20%',
                filterDropdown: getFilterDropdown(EmailMessage),
                filterIcon: getFilterIcon,
            },
        ]
    }, [sort, filters])
}