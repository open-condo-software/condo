import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import React from 'react'
import { Input } from 'antd'
import { FilterContainer } from '../TableFilter'
import { QueryMeta } from '../../utils/tables.utils'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'

type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryMeta }) => FilterValue


export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

export const getTextFilterDropdown = (placeholder: string) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                <Input
                    placeholder={placeholder}
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