import { Ticket } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { FiltersTooltipDataObject } from '@condo/domains/common/hooks/useMultipleFiltersModal'

export function useFiltersTooltipData (): FiltersTooltipDataObject<Ticket>[] {
    const intl = useIntl()
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const ClientPhoneMessage = intl.formatMessage({ id: 'ticket.filters.ClientPhone' })
    const AuthorMessage = intl.formatMessage({ id: 'ticket.filters.Author' })

    return useMemo(() => [
        { name: 'source', label: SourceMessage, getFilteredValue: (ticket) => ticket.source.id, getTooltipValue: (ticket) => ticket.source.name },
        { name: 'clientPhone', label: ClientPhoneMessage, getFilteredValue: (ticket) => ticket.clientPhone, getTooltipValue: (ticket) => ticket.clientPhone },
        { name: 'createdBy', label: AuthorMessage, getFilteredValue: (ticket) => ticket.createdBy.id, getTooltipValue: (ticket) => ticket.createdBy.name },
    ], [AuthorMessage, ClientPhoneMessage, SourceMessage])
}