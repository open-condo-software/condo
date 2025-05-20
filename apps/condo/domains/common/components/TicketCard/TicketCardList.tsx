import { useGetTicketsByContactQuery } from '@app/condo/gql'
import { SortTicketsBy, Ticket as TicketSchema } from '@app/condo/schema'
import { Row, RowProps, Space } from 'antd'
import pickBy from 'lodash/pickBy'
import qs, { IStringifyOptions } from 'qs'
import React from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Card } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'

import { TicketOverview } from './TicketOverview'

import { useLayoutContext } from '../LayoutContext'


interface ITicketCardListProps {
    contactId: string
}
interface ITicketCardProps {
    contactId: string
    tickets: TicketSchema[]
}

const TICKETS_ON_CARD = 3
const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]
const TICKET_QUERY_STRINGIFY_OPTIONS: IStringifyOptions = { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true }
const TICKET_CARD_LIST_GUTTER: RowProps['gutter'] = [0, 24]
const TICKET_CARD_WIDTH = '308px'

const TicketCard: React.FC<ITicketCardProps> = ({ contactId, tickets }) => {
    const intl = useIntl()

    const TicketsByContactMessage = intl.formatMessage({ id: 'TicketsByContact' })
    const AllTickets = intl.formatMessage({ id: 'AllTickets' })

    const { breakpoints } = useLayoutContext()
    const hasMoreTickets = tickets.length >= TICKETS_ON_CARD ? tickets.length - TICKETS_ON_CARD : 0

    const query = qs.stringify({ filters: JSON.stringify(pickBy({ contact: [contactId] })) }, TICKET_QUERY_STRINGIFY_OPTIONS)

    return (
        <Card width={breakpoints.DESKTOP_SMALL ? TICKET_CARD_WIDTH : '100%'}>
            <Space direction='vertical' size={20}>
                <Typography.Title level={4}>
                    {TicketsByContactMessage}
                </Typography.Title>
                {
                    tickets.slice(0, TICKETS_ON_CARD).map(ticket => (
                        <TicketOverview
                            key={ticket.id}
                            id={ticket.id}
                            details={ticket.details}
                            createdAt={ticket.createdAt}
                            number={ticket.number}
                            status={ticket.status.name}
                            statusColor={ticket.status.colors.primary}
                        />
                    ))
                }
                {hasMoreTickets > 0 && (
                    <Typography.Link href={`/ticket/${query}`}>
                        {AllTickets}
                    </Typography.Link>
                )}
            </Space>
        </Card>
    )
}

export const generateQueryVariables = (contactId: string) => ({
    sortBy: TICKET_SORT_BY,
    where: {
        contact: { id: contactId },
    },
})

const TicketCardList: React.FC<ITicketCardListProps> = ({ contactId }) => {
    const { persistor } = useCachePersistor()
    const {
        loading,
        data: ticketsData,
    } = useGetTicketsByContactQuery({
        variables: { contactId },
        skip: !persistor || !contactId,
    })
    const tickets = ticketsData?.tickets

    if (loading) {
        return <Loader size='large' spinning fill />
    }

    return (
        <Row gutter={TICKET_CARD_LIST_GUTTER} justify='end' align='top'>
            <TicketCard
                contactId={contactId}
                tickets={tickets}
            />
        </Row>
    )
}

export { TicketCardList }
