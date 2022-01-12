import { FilterValue } from 'antd/es/table/interface'
import { ITicketUIState } from './Ticket'
import get from 'lodash/get'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'

export const getTicketDetailsRender = (search: FilterValue) => {
    return function render(details: string, ticket: ITicketUIState) {
        const address = get(ticket, ['property', 'address'])
        const maxDetailsLength = address ? address.length : details.length
        const trimmedDetails = details.length > maxDetailsLength ? `${details.substring(0, maxDetailsLength)}…` : details

        return getTableCellRenderer(search, false, null, null, null, details)(trimmedDetails)
    }
}
