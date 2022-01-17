import { green } from '@ant-design/colors'
import { SortTicketsBy, Ticket as TicketSchema } from '@app/condo/schema'
import { Loader } from '@condo/domains/common/components/Loader'
import { colors } from '@condo/domains/common/constants/style'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { Col, Row, RowProps, Space, Typography } from 'antd'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import pickBy from 'lodash/pickBy'
import Link from 'next/link'
import qs, { IStringifyOptions } from 'qs'
import React, { useEffect, useMemo } from 'react'
import { Ticket as TicketGQL } from '../../../ticket/gql'
import { useLayoutContext } from '../LayoutContext'
import { TicketOverview } from './TicketOverview'
import { useApolloClient } from '@core/next/apollo'

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
    organizationId: string
    contactPhone: string
    contactName: string
}
interface ITicketCardProps {
    address: string
    tickets: TicketSchema[]
    contactName: string
}

const TICKETS_ON_CARD = 2
const TICKET_SORT_BY = ['createdAt_DESC'] as SortTicketsBy[]
const TICKET_QUERY_STRINGIFY_OPTIONS: IStringifyOptions = { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true }
const TICKET_CARD_LIST_GUTTER: RowProps['gutter'] = [0, 24]
const TICKET_CARD_GUTTER: RowProps['gutter'] = [0, 12]
const TICKET_CARD_HAS_MORE_LINK_STYLE: React.CSSProperties = { fontSize: 12, marginTop: 16, color: `${green[6]}` }

const TicketCard: React.FC<ITicketCardProps> = ({ address, tickets, contactName }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const TicketsByContactMessage = intl.formatMessage({ id: 'TicketsByContact' })
    const NoTicketsOnAddressMessage = intl.formatMessage({ id: 'Contact.NoTicketOnAddress' })

    const { isSmall } = useLayoutContext()
    const hasMoreTickets = tickets.length >= TICKETS_ON_CARD ? tickets.length - TICKETS_ON_CARD : 0

    const filters = { clientName: contactName, address }
    const query = qs.stringify({ filters: JSON.stringify(pickBy(filters)) }, TICKET_QUERY_STRINGIFY_OPTIONS)

    return (
        <Container isSmall={isSmall}>
            <AddressPartContainer>
                <Space size={8} direction={'vertical'}>
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
                                            {intl.formatMessage({ id: 'MoreTicketsLeft' }, {
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

export const generateQueryVariables = (organizationId: string, contactPhone: string) => ({
    sortBy: TICKET_SORT_BY,
    where: {
        organization: { id: organizationId },
        contact: { phone: contactPhone },
    },
})

const TicketCardList: React.FC<ITicketCardListProps> = ({ organizationId, contactPhone, contactName }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const {
        loading,
        objs: tickets,
    } = Ticket.useObjects(generateQueryVariables(organizationId, contactPhone), {
        fetchPolicy: 'cache-first',
    })
    const addresses = useMemo(() => {
        return Object.entries(groupBy(tickets, (ticket) => get(ticket, 'property.address', DeletedMessage)))
    }, [tickets])

    if (loading) {
        return <Loader size={'large'} spinning fill />
    }

    return (
        <Row gutter={TICKET_CARD_LIST_GUTTER} justify={'end'} align={'top'}>
            {
                addresses.map(([address, tickets], key) => (
                    <TicketCard
                        key={key}
                        contactName={contactName}
                        tickets={tickets}
                        address={address}
                    />
                ))
            }
        </Row>
    )
}

export { TicketCardList }
