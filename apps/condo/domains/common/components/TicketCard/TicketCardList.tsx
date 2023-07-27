import { green } from '@ant-design/colors'
import { SortTicketsBy, Ticket as TicketSchema } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, RowProps, Space, Typography } from 'antd'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import pickBy from 'lodash/pickBy'
import Link from 'next/link'
import qs, { IStringifyOptions } from 'qs'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Loader } from '@condo/domains/common/components/Loader'
import { colors } from '@condo/domains/common/constants/style'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'


import { TicketOverview } from './TicketOverview'

import { useLayoutContext } from '../LayoutContext'

interface IContainerProps {
    isSmall: boolean
}

const Container = styled.div<IContainerProps>`
  &:last-child {
    margin-bottom: 24px;
  }

  border: 1px solid ${colors.inputBorderGrey};
  border-radius: 8px;
  width: 100%;
  max-width: ${({ isSmall }) => isSmall ? 'unset' : '310px'};
  display: flex;
  flex-flow: column nowrap;
  align-content: center;
`

const AddressPartContainer = styled.div`
  border-bottom: 1px solid ${colors.inputBorderGrey};
  padding: 24px 24px 90px 24px;
  position: relative;
`

const TicketsPartContainer = styled.div`
    padding: 24px;
`

interface ITicketCardListProps {
    contactId: string
}
interface ITicketCardProps {
    contactId: string
    address: string
    tickets: TicketSchema[]
}

const TICKETS_ON_CARD = 2
const TICKET_SORT_BY = [SortTicketsBy.CreatedAtDesc]
const TICKET_QUERY_STRINGIFY_OPTIONS: IStringifyOptions = { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true }
const TICKET_CARD_LIST_GUTTER: RowProps['gutter'] = [0, 24]
const TICKET_CARD_GUTTER: RowProps['gutter'] = [0, 12]
const TICKET_CARD_HAS_MORE_LINK_STYLE: React.CSSProperties = { fontSize: 12, marginTop: 16, color: `${green[6]}` }

const TicketCard: React.FC<ITicketCardProps> = ({ contactId, address, tickets }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.address' })
    const TicketsByContactMessage = intl.formatMessage({ id: 'ticketsByContact' })
    const NoTicketsOnAddressMessage = intl.formatMessage({ id: 'contact.noTicketOnAddress' })

    const { breakpoints } = useLayoutContext()
    const hasMoreTickets = tickets.length >= TICKETS_ON_CARD ? tickets.length - TICKETS_ON_CARD : 0

    const filters = { contact: [contactId], address }
    const query = qs.stringify({ filters: JSON.stringify(pickBy(filters)) }, TICKET_QUERY_STRINGIFY_OPTIONS)

    return (
        <Container isSmall={!breakpoints.DESKTOP_SMALL}>
            <AddressPartContainer>
                <Space size={8} direction='vertical'>
                    <Typography.Text type='secondary'>
                        {AddressLabel}
                    </Typography.Text>
                    <Typography.Title level={4}>
                        {address}
                    </Typography.Title>
                </Space>
            </AddressPartContainer>
            <TicketsPartContainer>
                <Row gutter={TICKET_CARD_GUTTER}>
                    <Col span={24}>
                        <>
                            {tickets.length > 0
                                ?
                                <Typography.Title level={5} >
                                    {TicketsByContactMessage}
                                </Typography.Title>
                                :
                                <Typography.Text>
                                    {NoTicketsOnAddressMessage}
                                </Typography.Text>
                            }
                            {
                                tickets.slice(0, TICKETS_ON_CARD).map((ticket) => {
                                    return <TicketOverview
                                        key={ticket.id}
                                        id={ticket.id}
                                        details={ticket.details}
                                        createdAt={ticket.createdAt}
                                        number={ticket.number}
                                        status={ticket.status.name}/>
                                })
                            }
                            {hasMoreTickets > 0 && (
                                <Col span={24}>
                                    <Link href={`/ticket/${query}`}>
                                        <Typography.Link style={TICKET_CARD_HAS_MORE_LINK_STYLE}>
                                            {intl.formatMessage({ id: 'moreTicketsLeft' }, {
                                                ticketsLeft: hasMoreTickets,
                                            })}
                                        </Typography.Link>
                                    </Link>
                                </Col>
                            )}
                        </>
                    </Col>
                </Row>
            </TicketsPartContainer>
        </Container>
    )
}

export const generateQueryVariables = (contactId: string) => ({
    sortBy: TICKET_SORT_BY,
    where: {
        contact: { id: contactId },
    },
})

const TicketCardList: React.FC<ITicketCardListProps> = ({ contactId }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'deleted' })

    const {
        loading,
        objs: tickets,
    } = Ticket.useObjects(generateQueryVariables(contactId), {
        fetchPolicy: 'cache-first',
    })
    const addresses = useMemo(() => {
        return Object.entries(groupBy(tickets, (ticket) => get(ticket, 'property.address', DeletedMessage)))
    }, [tickets])

    if (loading) {
        return <Loader size='large' spinning fill />
    }

    return (
        <Row gutter={TICKET_CARD_LIST_GUTTER} justify='end' align='top'>
            {
                addresses.map(([address, tickets], key) => (
                    <TicketCard
                        key={key}
                        contactId={contactId}
                        tickets={tickets}
                        address={address}
                    />
                ))
            }
        </Row>
    )
}

export { TicketCardList }
