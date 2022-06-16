import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { getAddressRender } from '@condo/domains/division/utils/clientSchema/Renders'

export function useTicketHintsTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const ApartmentComplexNameMessage  = intl.formatMessage({ id: 'ApartmentComplexName' })
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer(search), [search])
    const renderAddress = useCallback(
        (properties) => properties.map((property) => getAddressRender(property, DeletedMessage, search)),
        [DeletedMessage, search])

    const renderHintContent = useCallback((value) => {
        return (
            <div
                dangerouslySetInnerHTML={{
                    __html: value,
                }}
                style={{ maxHeight: '100px', maxWidth: '200px', overflow: 'hidden' }}
            />
        )
    }, [])

    return useMemo(() => {
        return [
            {
                title: BuildingsMessage,
                ellipsis: true,
                dataIndex: 'properties',
                key: 'properties',
                render: renderAddress,
                width: '35%',
            },
            {
                title: ApartmentComplexNameMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                render,
                ellipsis: true,
            },
            {
                title: HintMessage,
                ellipsis: true,
                dataIndex: 'content',
                key: 'content',
                render: renderHintContent,
            },
        ]
    }, [ApartmentComplexNameMessage, BuildingsMessage, HintMessage, filterMetas, filters, render, renderAddress])
}