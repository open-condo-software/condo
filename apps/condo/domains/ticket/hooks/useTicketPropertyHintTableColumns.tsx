import { TicketPropertyHint } from '@app/condo/schema'
import get from 'lodash/get'
import map from 'lodash/map'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { getManyPropertiesAddressRender } from '@condo/domains/property/utils/clientSchema/Renders'
import { TicketPropertyHintContent } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintContent'
import { TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'

const HINT_STYLES: CSSProperties = { maxHeight: '6.5em', maxWidth: '300px', overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'inherit' }

export function useTicketPropertyHintTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, ticketPropertyHints: TicketPropertyHint[]) {
    const intl = useIntl()
    const NameMessage  = intl.formatMessage({ id: 'property.section.form.name' })
    const HintMessage = intl.formatMessage({ id: 'hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'property.index.tableField.buildings' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const search = getFilteredValue(filters, 'search')

    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const ticketPropertyHintIds = useMemo(() => map(ticketPropertyHints, 'id'), [ticketPropertyHints])
    const { objs: ticketPropertyHintsProperties } = TicketPropertyHintProperty.useObjects({
        where: {
            ticketPropertyHint: {
                id_in: ticketPropertyHintIds,
            },
        },
    })

    const renderTicketPropertyHintAddresses = useCallback((intl, ticketPropertyHint) => {
        const properties = ticketPropertyHintsProperties
            .filter(ticketPropertyHintProperty => get(ticketPropertyHintProperty, 'ticketPropertyHint.id') === ticketPropertyHint.id)
            .map(ticketPropertyHintProperty => ticketPropertyHintProperty.property)

        return getManyPropertiesAddressRender(search)(intl, properties)
    }, [search, ticketPropertyHintsProperties])

    const renderTicketPropertyHint = useCallback((value, _) => {
        return (
            <TicketPropertyHintContent
                html={value}
                style={HINT_STYLES}
            />
        )
    }, [])

    return useMemo(() => {
        return [
            {
                title: BuildingsMessage,
                ellipsis: true,
                key: 'properties',
                render: (_, ticketPropertyHint) => renderTicketPropertyHintAddresses(intl, ticketPropertyHint),
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
                render: renderTicketPropertyHint,
            },
        ]
    }, [BuildingsMessage, NameMessage, filters, filterMetas, render, HintMessage, renderTicketPropertyHint, renderTicketPropertyHintAddresses, intl])
}