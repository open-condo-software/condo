import React, { useCallback } from 'react'
import { Row, Col, Typography, RowProps } from 'antd'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { SortTicketsBy } from '@app/condo/schema'
import { TicketOverview } from './TicketOverview'
import Link from 'next/link'
import qs from 'qs'
import pickBy from 'lodash/pickBy'
import groupBy from 'lodash/groupBy'
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

const AddressPartContainter = styled.div`
  border-bottom: 1px solid ${colors.inputBorderGrey};
  padding: 24px 24px 90px 24px;
  position: relative;
`

const TicketsPartContainer = styled.div`
    padding: 24px;
`

interface ITicketCardProps {
    organizationId: string
    contactPhone: string
    contactName: string
}

const TICKETS_ON_CARD = 2
const TICKET_CARD_GUTTER: RowProps['gutter'] = [0, 24]

const TicketCard: React.FC<ITicketCardProps> = ({
    organizationId,
    contactPhone,
    contactName,
}) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitShortMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const TicketsByContactMessage = intl.formatMessage({ id: 'TicketsByContact' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const NoTicketsOnAddressMessage = intl.formatMessage({ id: 'Contact.NoTicketOnAddress' })

    // const contactAddress = `${addressPrefix}${unitSuffix}`

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

    const hasMoreTickets = useCallback((tickets) => {
        return !loading || tickets >= TICKETS_ON_CARD ? tickets.length - TICKETS_ON_CARD : 0
    }, [loading])

    const addresses = Object.entries(groupBy(tickets, (ticket) => ticket.property.address))

    return (
        <Row gutter={TICKET_CARD_GUTTER} justify={'end'}>
            {
                addresses.map(([address,  tickets], key) => {
                    const addressPrefix = address ? address : DeletedMessage
                    // const unitSuffix = unitName ? `, ${UnitShortMessage} ${unitName}` : ''

                    const hasMore = hasMoreTickets(tickets)
                    const filters = { clientName: contactName, property: address }
                    const query = qs.stringify(
                        {
                            filters: JSON.stringify(pickBy(filters)),
                        },
                        { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                    )

                    return (
                        <Container key={key}>
                            <AddressPartContainter>
                                <Row gutter={[0, 8]}>
                                    <Col span={24}>
                                        <Typography.Text type='secondary'>
                                            {AddressLabel}
                                        </Typography.Text>
                                    </Col>
                                    <Col span={24}>
                                        <Typography.Title
                                            level={4}
                                            style={{ marginBottom: 0 }}>
                                            {addressPrefix}
                                        </Typography.Title>
                                    </Col>
                                </Row>
                            </AddressPartContainter>
                            <TicketsPartContainer>
                                <Row gutter={[0, 12]}>
                                    <Col span={24}>
                                        {loading
                                            ?
                                            <Typography.Text type='secondary'>
                                                {LoadingMessage}
                                            </Typography.Text>
                                            :
                                            <>
                                                {tickets.length > 0
                                                    ?
                                                    <Typography.Title
                                                        level={5}
                                                    >
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
                                                {hasMore > 0 && (
                                                    <Col span={24}>
                                                        <Link href={`/ticket/${query}`}>
                                                            <Typography.Link style={{ fontSize: 12, marginTop: 16, color: `${green[6]}` }}>
                                                                {intl.formatMessage({ id: 'MoreTicketsLeft' }, {
                                                                    ticketsLeft: hasMore,
                                                                })}
                                                            </Typography.Link>
                                                        </Link>
                                                    </Col>
                                                )}
                                            </>
                                        }
                                    </Col>
                                </Row>
                            </TicketsPartContainer>
                        </Container>
                    )
                })
            }
        </Row>
    )
}

export { TicketCard }
