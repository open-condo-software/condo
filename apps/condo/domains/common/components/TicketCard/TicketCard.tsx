import React from 'react'
import { Row, Col, Typography } from 'antd'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { SortTicketsBy } from '../../../../schema'
import { TicketOverview } from './TicketOverview'
import Link from 'next/link'
import qs from 'qs'
import { pickBy } from 'lodash'

const Container = styled.aside`
  border: 1px solid ${colors.inputBorderGrey};
  border-radius: 8px;
  
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
    contactId: string
    contactName: string
    address: string
    unitName: string
}

const TICKETS_ON_CARD = 2

const TicketCard: React.FC<ITicketCardProps> = ({
    organizationId,
    contactId,
    contactName,
    address,
    unitName,
}) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitShortMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const TicketsByContactMessage = intl.formatMessage({ id: 'TicketsByContact' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const NoTicketsOnAddressMessage = intl.formatMessage({ id: 'Contact.NoTicketOnAddress' })

    const unitSuffix = unitName ? `, ${UnitShortMessage} ${unitName}` : ''
    const addressPrefix = address ? address : DeletedMessage
    const contactAddress = `${addressPrefix}${unitSuffix}`

    const {
        loading,
        count: total,
        objs: tickets, 
    } = Ticket.useObjects({
        sortBy: ['createdAt_DESC'] as SortTicketsBy[],
        where: {
            organization: { id: organizationId },
            contact: { id: contactId },
            property: { address: address },
            unitName: unitName,
        },
        first: TICKETS_ON_CARD,
    }, {
        fetchPolicy: 'network-only',
    })

    const moreTickets = (loading || total <= TICKETS_ON_CARD) ? 0 : total - TICKETS_ON_CARD
    const MoreTicketsLeftMessage = intl.formatMessage({ id: 'MoreTicketsLeft' }, {
        ticketsLeft: moreTickets,
    })

    const filters = {
        clientName: contactName,
        property: address,
    }
    const query = qs.stringify(
        {
            filters: JSON.stringify(pickBy(filters)),
        },
        { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
    )

    return (
        <Container>
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
                            {contactAddress}
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
                                    <Typography.Text style={{ fontSize: 16 }}>
                                        {NoTicketsOnAddressMessage}
                                    </Typography.Text>
                                }

                                {
                                    tickets.map((ticket) => {
                                        return <TicketOverview
                                            key={ticket.id}
                                            id={ticket.id}
                                            details={ticket.details}
                                            createdAt={ticket.createdAt}
                                            number={ticket.number}
                                            status={ticket.status.name}/>
                                    })
                                }
                                {moreTickets > 0 &&
                                <Col span={24}>
                                    <Link href={`/ticket/${query}`}>
                                        <Typography.Link style={{ fontSize: 12, marginTop: 16, color: '#389E0D' }}>
                                            {MoreTicketsLeftMessage}
                                        </Typography.Link>
                                    </Link>
                                </Col> }
                            </>
                        }
                    </Col>
                </Row>
            </TicketsPartContainer>
        </Container>
    )
}

export { TicketCard }