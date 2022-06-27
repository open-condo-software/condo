import map from 'lodash/map'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'

import { getTicketHintAddressesRender, getTicketHintRender } from '../utils/clientSchema/Renders'
import { ITicketHintUIState } from '../utils/clientSchema/TicketPropertyHint'
import { TicketHintProperty } from '../utils/clientSchema'

export function useTicketHintTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, ticketHints: ITicketHintUIState[]) {
    const intl = useIntl()
    const NameMessage  = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer(search), [search])

    const ticketHintIds = useMemo(() => map(ticketHints, 'id'), [ticketHints])
    const { objs: ticketHintsProperties } = TicketHintProperty.useObjects({
        where: {
            ticketHint: {
                id_in: ticketHintIds,
            },
        },
    })

    const renderTicketHintAddresses = useCallback((intl, ticketHint) => {
        const properties = ticketHintsProperties
            .filter(ticketHintProperty => ticketHintProperty.ticketHint.id === ticketHint.id)
            .map(ticketHintProperty => ticketHintProperty.property)

        return getTicketHintAddressesRender(search)(intl, properties)
    }, [search, ticketHintsProperties])

    return useMemo(() => {
        return [
            {
                title: BuildingsMessage,
                ellipsis: true,
                key: 'properties',
                render: (_, ticketHint) => renderTicketHintAddresses(intl, ticketHint),
                width: '35%',
            },
            {
                title: NameMessage,
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
    }, [NameMessage, BuildingsMessage, HintMessage, filterMetas, filters, intl, render, renderTicketHintAddresses, search])
}