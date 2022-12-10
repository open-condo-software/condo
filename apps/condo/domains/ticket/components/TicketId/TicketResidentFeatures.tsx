import { SortBillingReceiptsBy, Ticket } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { BillingReceipt } from '@condo/domains/billing/utils/clientSchema'
import { BankCardIcon } from '@condo/domains/common/components/icons/BankCardIcon'
import { MobileIcon } from '@condo/domains/common/components/icons/MobileIcon'
import { Tooltip } from '@condo/domains/common/components/Tooltip'


interface MobileAppInstalledIndicatorProps {
    isContactHasMobileApp: boolean
}

const MobileAppInstalledIndicator: React.FC<MobileAppInstalledIndicatorProps> = ({ isContactHasMobileApp }) => {
    const intl = useIntl()
    const MobileAppInstalledMessage = intl.formatMessage({ id: 'ticket.MobileAppInstalled' })
    const MobileAppNotInstalledMessage = intl.formatMessage({ id: 'ticket.MobileAppNotInstalled' })

    return (
        <Tooltip title={isContactHasMobileApp ? MobileAppInstalledMessage : MobileAppNotInstalledMessage}>
            <MobileIcon active={isContactHasMobileApp} />
        </Tooltip>
    )
}

interface PaymentsAvailableIndicatorProps {
    ticketOrganizationId: string
    propertyAddress: string
}

const LAST_MONTH_BEGINNING = dayjs().subtract(1, 'months').startOf('month').format('YYYY-MM-DD')

const PaymentsAvailableIndicator: React.FC<PaymentsAvailableIndicatorProps> = ({ ticketOrganizationId, propertyAddress }) => {
    const intl = useIntl()
    const PaymentsAvailableMessage = intl.formatMessage({ id: 'ticket.PaymentsAvailable' })
    const PaymentsNotAvailableMessage = intl.formatMessage({ id: 'ticket.PaymentsNotAvailable' })

    const { count: receiptsByProperty, loading: receiptsByPropertyLoading } = BillingReceipt.useCount({
        where: {
            context: { organization: { id: ticketOrganizationId } },
            property: {
                OR: [
                    { address: propertyAddress },
                    { normalizedAddress: propertyAddress },
                ],
            },
            period_gte: LAST_MONTH_BEGINNING,
        },
        sortBy: [SortBillingReceiptsBy.CreatedAtDesc],
    })

    const isPaymentsAvailable = !!receiptsByProperty
    const title = receiptsByProperty || isPaymentsAvailable ? PaymentsAvailableMessage : PaymentsNotAvailableMessage

    return (
        <Tooltip title={title}>
            <BankCardIcon active={isPaymentsAvailable} loading={receiptsByPropertyLoading} />
        </Tooltip>
    )
}

interface TicketResidentFeaturesProps {
    ticket: Ticket
}

const TICKET_RESIDENT_FEATURES_ROW_GUTTER: [Gutter, Gutter] = [8, 0]

export const TicketResidentFeatures: React.FC<TicketResidentFeaturesProps> = ({ ticket }) => {
    const isContactHasMobileApp = !!get(ticket, 'client')
    const ticketOrganizationId = get(ticket, ['organization', 'id'], null)
    const propertyAddress = get(ticket, ['property', 'address'], null)

    return (
        <Row gutter={TICKET_RESIDENT_FEATURES_ROW_GUTTER}>
            <Col>
                <MobileAppInstalledIndicator isContactHasMobileApp={isContactHasMobileApp} />
            </Col>
            <Col>
                <PaymentsAvailableIndicator
                    ticketOrganizationId={ticketOrganizationId}
                    propertyAddress={propertyAddress}
                />
            </Col>
        </Row>
    )
}