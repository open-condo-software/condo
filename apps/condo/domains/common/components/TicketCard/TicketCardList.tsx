import React from 'react'
import { useIntl } from '@core/next/intl'
import Link from 'next/link'
import qs from 'qs'
import { Row, Col, Typography, RowProps, Space } from 'antd'
import pickBy from 'lodash/pickBy'
import groupBy from 'lodash/groupBy'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { SortTicketsBy, Ticket as TicketSchema } from '@app/condo/schema'
import { Loader } from '@condo/domains/common/components/Loader'
import { TicketOverview } from './TicketOverview'
import { green } from '@ant-design/colors'

const Container = styled.div`
  &:last-child {
    margin-bottom: 24px;
  }

  border: 1px solid ${colors.inputBorderGrey};
  border-radius: 8px;
  width: 100%;
  max-width: 310px;
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
const TICKET_CARD_LIST_GUTTER: RowProps['gutter'] = [0, 24]
const TICKET_CARD_GUTTER: RowProps['gutter'] = [0, 12]
const TICKET_CARD_HAS_MORE_LINK_STYLE: React.CSSProperties = { fontSize: 12, marginTop: 16, color: `${green[6]}` }

const TicketCard: React.FC<ITicketCardProps> = ({
    address,
    tickets,
    contactName,
}) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const TicketsByContactMessage = intl.formatMessage({ id: 'TicketsByContact' })
    const NoTicketsOnAddressMessage = intl.formatMessage({ id: 'Contact.NoTicketOnAddress' })

    const addressPrefix = address ? address : DeletedMessage
    const hasMoreTickets = tickets.length >= TICKETS_ON_CARD ? tickets.length - TICKETS_ON_CARD : 0

    const filters = { clientName: contactName, address }
    const query = qs.stringify(
        {
            filters: JSON.stringify(pickBy(filters)),
        },
        { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
    )

    return (
        <Container >
            <AddressPartContainer>
                <Space size={8} direction={'vertical'}>
                    <Typography.Text type='secondary'>
                        {AddressLabel}
                    </Typography.Text>
                    <Typography.Title level={4}>
                        {addressPrefix}
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

const TicketCardList: React.FC<ITicketCardListProps> = ({ organizationId, contactPhone, contactName }) => {
    const {
        loading,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: ['createdAt_DESC'] as SortTicketsBy[],
        where: {
            organization: { id: organizationId },
            contact: { phone: contactPhone },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    if (loading) {
        return <Loader size={'large'} spinning fill />
    }

    const addresses = Object.entries(groupBy(tickets, (ticket) => ticket.property.address))
    return (
        <Row gutter={TICKET_CARD_LIST_GUTTER} justify={'end'}>
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
