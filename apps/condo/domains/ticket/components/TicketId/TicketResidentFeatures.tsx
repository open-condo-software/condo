import { useGetBillingReceiptsByPropertyCountQuery, GetTicketByIdQuery } from '@app/condo/gql'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'

import { BankCardIcon } from '@condo/domains/common/components/icons/BankCardIcon'
import { MobileIcon } from '@condo/domains/common/components/icons/MobileIcon'
import { Tooltip } from '@condo/domains/common/components/Tooltip'


interface MobileAppInstalledIndicatorProps {
    isContactHasMobileApp: boolean
}

const MobileAppInstalledIndicator: React.FC<MobileAppInstalledIndicatorProps> = ({ isContactHasMobileApp }) => {
    const intl = useIntl()
    const MobileAppInstalledMessage = intl.formatMessage({ id: 'pages.condo.ticket.MobileAppInstalled' })
    const MobileAppNotInstalledMessage = intl.formatMessage({ id: 'pages.condo.ticket.MobileAppNotInstalled' })

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
    const PaymentsAvailableMessage = intl.formatMessage({ id: 'pages.condo.ticket.PaymentsAvailable' })
    const PaymentsNotAvailableMessage = intl.formatMessage({ id: 'pages.condo.ticket.PaymentsNotAvailable' })

    const { persistor } = useCachePersistor()

    // TODO: We really need to use the account to understand if payments are available in MP?
    const { data: receiptsByPropertyData, loading: receiptsByPropertyLoading } = useGetBillingReceiptsByPropertyCountQuery({
        variables: {
            context: { organization: { id: ticketOrganizationId } },
            property: {
                OR: [
                    { address: propertyAddress },
                    { normalizedAddress: propertyAddress },
                ],
            },
            period_gte: LAST_MONTH_BEGINNING,
        },
        skip: !ticketOrganizationId || !propertyAddress || !persistor,
    })
    const receiptsByProperty = useMemo(() => receiptsByPropertyData?.count?.count || 0, [receiptsByPropertyData?.count?.count])

    const isPaymentsAvailable = !!receiptsByProperty
    const title = receiptsByProperty || isPaymentsAvailable ? PaymentsAvailableMessage : PaymentsNotAvailableMessage

    return (
        <Tooltip title={title}>
            <BankCardIcon active={isPaymentsAvailable} loading={receiptsByPropertyLoading} />
        </Tooltip>
    )
}

type TicketResidentFeaturesProps = {
    ticket: GetTicketByIdQuery['tickets'][number]
}

const TICKET_RESIDENT_FEATURES_ROW_GUTTER: [Gutter, Gutter] = [8, 0]

export const TicketResidentFeatures: React.FC<TicketResidentFeaturesProps> = ({ ticket }) => {
    const isContactHasMobileApp = !!ticket?.client
    const ticketOrganizationId = ticket?.organization?.id || null
    const propertyAddress = ticket?.property?.address || null

    return (
        <Row id='ticket_resident-features' gutter={TICKET_RESIDENT_FEATURES_ROW_GUTTER}>
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