import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import { get, isEmpty } from 'lodash'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { getAddressDetails } from '@condo/domains/common/utils/helpers'
import { TICKET_CARD_LINK_STYLE } from '@condo/domains/ticket/constants/style'

type TicketPropertyFieldProps = {
    ticket: Ticket
}

export const getTicketSectionAndFloorMessage = (ticket: Ticket, ticketUnitMessage: string, intl) => {
    const FloorName = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })

    const sectionName = get(ticket, 'sectionName')
    const sectionType = get(ticket, 'sectionType')
    const floorName = get(ticket, 'floorName')
    const sectionTypeMessage = intl.formatMessage({ id: `field.sectionType.${sectionType}` })
    const sectionAndFloorMessage = `${sectionTypeMessage.toLowerCase()} ${ticket.sectionName}, ${FloorName.toLowerCase()} ${ticket.floorName}`

    if (!isEmpty(ticketUnitMessage) && !isEmpty(sectionName) && !isEmpty(floorName)) {
        return `(${sectionAndFloorMessage})`
    } else if (isEmpty(ticketUnitMessage) && !isEmpty(sectionName)) {
        if (isEmpty(floorName)) {
            return `${sectionTypeMessage.toLowerCase()} ${ticket.sectionName}`
        } else {
            return sectionAndFloorMessage
        }
    }
}

export const TicketPropertyField: React.FC<TicketPropertyFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitTypePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${ticket.unitType}` })

    const propertyWasDeleted = !ticket.property
    const address = useMemo(() => get(ticket, ['property', 'address'], ticket.propertyAddress), [ticket])
    const addressMeta = useMemo(() => get(ticket, ['property', 'addressMeta'], ticket.propertyAddressMeta), [ticket])
    const { streetPart, renderPostfix } = getAddressDetails({ address, addressMeta })

    const ticketUnitMessage = ticket.unitName ? `${UnitTypePrefix.toLowerCase()} ${ticket.unitName} ` : ''
    const ticketSectionAndFloorMessage = getTicketSectionAndFloorMessage(ticket, ticketUnitMessage, intl)

    const TicketUnitMessage = useCallback(() => (
        <Typography.Paragraph style={{ margin: 0 }}>
            <Typography.Text strong>{ticketUnitMessage}</Typography.Text>
            <Typography.Text strong>{ticketSectionAndFloorMessage}</Typography.Text>
        </Typography.Paragraph>
    ), [ticketSectionAndFloorMessage, ticketUnitMessage])

    const DeletedPropertyAddressMessage = useCallback(() => (
        <>
            <Typography.Paragraph style={{ margin: 0 }} type='secondary'>
                {renderPostfix}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ margin: 0 }} type='secondary'>
                {streetPart}
            </Typography.Paragraph>
            <Typography.Text type='secondary'>
                <TicketUnitMessage />
            </Typography.Text>
            <Typography.Text type='secondary'>
                ({ DeletedMessage })
            </Typography.Text>
        </>
    ), [DeletedMessage, TicketUnitMessage, renderPostfix, streetPart])

    const PropertyAddressMessage = useCallback(() => (
        <>
            <Typography.Paragraph style={{ margin: 0 }} type='secondary'>
                {renderPostfix}
            </Typography.Paragraph>
            <Link href={`/property/${get(ticket, ['property', 'id'])}`}>
                <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                    {streetPart}
                </Typography.Link>
            </Link>
            <TicketUnitMessage />
        </>
    ), [TicketUnitMessage, renderPostfix, streetPart, ticket])

    return (
        <PageFieldRow title={AddressMessage} ellipsis>
            {
                propertyWasDeleted ? (
                    <DeletedPropertyAddressMessage />
                ) : <PropertyAddressMessage />
            }
        </PageFieldRow>
    )
}