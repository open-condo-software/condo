import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { getTicketHintAddressesRender, getTicketHintRender } from '../utils/clientSchema/Renders'

export function useTicketHintTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const ApartmentComplexNameMessage  = intl.formatMessage({ id: 'ApartmentComplexName' })
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer(search), [search])
    const renderTicketHintAddresses = getTicketHintAddressesRender(search)

    return useMemo(() => {
        return [
            {
                title: BuildingsMessage,
                ellipsis: true,
                dataIndex: 'properties',
                key: 'properties',
                render: (value) => renderTicketHintAddresses(intl, value),
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
                render: getTicketHintRender(search),
            },
        ]
    }, [ApartmentComplexNameMessage, BuildingsMessage, HintMessage, filterMetas, filters, render, search])
}