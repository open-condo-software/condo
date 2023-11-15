/** @jsx jsx */
import {
    B2BAppGlobalFeature,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, ColProps, notification, Row, RowProps, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { compact, get, isEmpty } from 'lodash'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { Edit, Link as LinkIcon } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { FormattedMessage } from '@open-condo/next/intl'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { getObjectCreatedMessage } from '@condo/domains/common/utils/date.utils'
import { InvoiceStatusSelect } from '@condo/domains/marketplace/components/Invoice/InvoiceStatusSelect'
import { InvoiceReadPermissionRequired } from '@condo/domains/marketplace/components/PageAccess'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { useGlobalAppsFeaturesContext } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketStatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'
import { TicketTag } from '@condo/domains/ticket/components/TicketTag'
import { CLOSED_STATUS_TYPE } from '@condo/domains/ticket/constants'
import { STATUS_IDS } from '@condo/domains/ticket/constants/statusTransitions'
import { TICKET_TYPE_TAG_COLORS } from '@condo/domains/ticket/constants/style'
import { useActiveCall } from '@condo/domains/ticket/contexts/ActiveCallContext'
import {
    useTicketQualityControl,
} from '@condo/domains/ticket/contexts/TicketQualityControlContext'
import { useTicketExportToPdfTask } from '@condo/domains/ticket/hooks/useTicketExportToPdfTask'
import { FavoriteTicketIndicator } from '@condo/domains/ticket/utils/clientSchema/Renders'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { RESIDENT } from '@condo/domains/user/constants/common'


const INVOICE_CONTENT_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const BIG_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 20]
const BIG_HORIZONTAL_GUTTER: RowProps['gutter'] = [40, 0]

const InvoiceHeader = ({ invoice, title, refetchInvoice, organization, employee }) => {
    const intl = useIntl()
    const InvoiceAuthorMessage = intl.formatMessage({ id: 'Author' })

    const InvoiceCreationDate = useMemo(() => getObjectCreatedMessage(intl, invoice), [intl, invoice])

    const { breakpoints } = useLayoutContext()

    const handleInvoiceStatusChanged = useCallback(() => {
        refetchInvoice()
    }, [refetchInvoice])

    const createdBy = useMemo(() => get(invoice, ['createdBy']), [invoice])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER} justify='space-between'>
            <Col md={12} xs={24}>
                <Row gutter={SMALL_VERTICAL_GUTTER} align='middle'>
                    <Col span={breakpoints.TABLET_LARGE ? 24 : 22}>
                        <Typography.Title style={TITLE_STYLE}
                            level={1}>{title}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={24}>
                                <Typography.Text style={INVOICE_CREATE_INFO_TEXT_STYLE}>
                                    <Typography.Text
                                        style={INVOICE_CREATE_INFO_TEXT_STYLE}
                                        type='secondary'
                                    >
                                        {InvoiceCreationDate},&nbsp;{InvoiceAuthorMessage}
                                    </Typography.Text>
                                    <UserNameField user={createdBy}>
                                        {({ name, postfix }) => (
                                            <Typography.Text style={INVOICE_CREATE_INFO_TEXT_STYLE}>
                                                &nbsp;{name}
                                                {postfix && (
                                                    <Typography.Text type='secondary' ellipsis>&nbsp;{postfix}</Typography.Text>
                                                )}
                                            </Typography.Text>
                                        )}
                                    </UserNameField>
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
            <Col md={12} xs={24}>
                {
                    breakpoints.TABLET_LARGE ? (
                        <Row justify='end' gutter={SMALL_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row justify='end' align='middle' gutter={BIG_HORIZONTAL_GUTTER}>
                                    <Col>
                                        <InvoiceStatusSelect
                                            organization={organization}
                                            employee={employee}
                                            invoice={invoice}
                                            onUpdate={handleInvoiceStatusChanged}
                                            data-cy='invoice__status-select'
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    ) : (
                        <Row gutter={SMALL_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <InvoiceStatusSelect
                                    organization={organization}
                                    employee={employee}
                                    invoice={invoice}
                                    onUpdate={handleInvoiceStatusChanged}
                                    data-cy='invoice__status-select'
                                />
                            </Col>
                        </Row>
                    )
                }
            </Col>
        </Row>
    )
}


const InvoiceActionBar = ({
    ticket,
    organization,
    employee,
}) => {
    const intl = useIntl()
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const AttachCallToTicketMessage = intl.formatMessage({ id: 'ticket.callRecord.attachCallRecordToTicket' })
    const NotificationMessage = intl.formatMessage({ id: 'ticket.callRecord.attachCallRecordToTicket.notification.message' })
    const NotificationDescription = intl.formatMessage({ id: 'ticket.callRecord.attachCallRecordToTicket.notification.description' })

    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const auth = useAuth() as { user: { id: string } }
    const user = get(auth, 'user')

    const { breakpoints } = useLayoutContext()
    const { requestFeature } = useGlobalAppsFeaturesContext()
    const { isCallActive, connectedTickets } = useActiveCall()

    const id = get(ticket, 'id')
    const ticketOrganizationId = useMemo(() => get(ticket, 'organization.id'), [ticket])
    const canShareTickets = useMemo(() => get(employee, 'role.canShareTickets'), [employee])
    const canManageTickets = useMemo(() => get(employee, 'role.canShareTickets'), [employee])

    const ticketStatusType = useMemo(() => get(ticket, ['status', 'type']), [ticket])
    const isDeletedProperty = !ticket.property && ticket.propertyAddress
    const disabledEditTicketButton = ticketStatusType === CLOSED_STATUS_TYPE || isDeletedProperty
    const disabledEditQualityControlButton = ticket.status.id !== STATUS_IDS.COMPLETED && ticket.status.id !== STATUS_IDS.CLOSED
    const showAttachCallToTicketButton = isCallActive && !connectedTickets.find(ticketId => ticketId === id)

    const { TicketBlanksExportToPdfButton, TicketBlanksExportToPdfModal } = useTicketExportToPdfTask({
        ticketId: id,
        where: {
            id,
            organization: { id: organization.id },
            deletedAt: null,
        },
        sortBy: [],
        user,
        timeZone,
        locale: intl.locale,
        eventNamePrefix: 'TicketDetail',
    })

    const { EditButton: EditQualityControlButton } = useTicketQualityControl()

    const handleAttachCallRecordClick = useCallback(() => {
        requestFeature({
            feature: B2BAppGlobalFeature.AttachCallRecordToTicket,
            ticketId: id,
            ticketOrganizationId,
        })

        notification.info({ message: NotificationMessage, description: NotificationDescription })
    }, [NotificationDescription, NotificationMessage, id, requestFeature, ticketOrganizationId])

    return (
        <ActionBar
            actions={[
                showAttachCallToTicketButton && (
                    <Button
                        key='attachCallRecord'
                        id='TicketIndexAttachCallRecord'
                        icon={<LinkIcon size='medium'/>}
                        type='primary'
                        onClick={handleAttachCallRecordClick}
                    >
                        {AttachCallToTicketMessage}
                    </Button>
                ),
                canManageTickets && (
                    <Link key='update' href={`/ticket/${ticket.id}/update`}>
                        <Button
                            disabled={disabledEditTicketButton}
                            type='secondary'
                            icon={<Edit size='medium'/>}
                            data-cy='ticket__update-link'
                        >
                            {UpdateMessage}
                        </Button>
                    </Link>
                ),
                breakpoints.TABLET_LARGE && <>
                    <TicketBlanksExportToPdfButton/>
                    {TicketBlanksExportToPdfModal}
                </>,
                canShareTickets && (
                    <ShareTicketModal
                        key='share'
                        organization={organization}
                        date={get(ticket, 'createdAt')}
                        number={get(ticket, 'number')}
                        details={get(ticket, 'details')}
                        id={id}
                        locale={get(organization, 'country')}
                    />
                ),
                ticket.qualityControlValue && (
                    <EditQualityControlButton
                        key='editQuality'
                        disabled={disabledEditQualityControlButton}
                    />
                ),
            ]}
        />
    )
}

const INVOICE_CREATE_INFO_TEXT_STYLE: CSSProperties = { margin: 0, fontSize: '12px' }
const TITLE_STYLE: CSSProperties = { margin: 0 }

export const InvoicePageContent = ({ invoice, title, refetchInvoice, organization, employee }) => {
    const intl = useIntl()

    const auth = useAuth() as { user: { id: string } }
    const user = get(auth, 'user')
    const { breakpoints } = useLayoutContext()

    const id = get(invoice, 'id')

    return (
        <Row gutter={BIG_VERTICAL_GUTTER}>
            <Col md={18} xs={24}>
                <Row gutter={INVOICE_CONTENT_VERTICAL_GUTTER}>
                    <Col span={24}>
                        <InvoiceHeader
                            title={title}
                            invoice={invoice}
                            refetchInvoice={refetchInvoice}
                            organization={organization}
                            employee={employee}
                        />
                    </Col>
                    {/*<Col span={24}>*/}
                    {/*    <Row gutter={BIG_VERTICAL_GUTTER}>*/}
                    {/*        <TicketPropertyField ticket={ticket}/>*/}
                    {/*        <TicketClientField ticket={ticket}/>*/}
                    {/*    </Row>*/}
                    {/*</Col>*/}

                    {/*<Col span={24}>*/}
                    {/*    <InvoiceActionBar*/}
                    {/*        invoice={invoice}*/}
                    {/*        organization={organization}*/}
                    {/*        employee={employee}*/}
                    {/*    />*/}
                    {/*</Col>*/}
                </Row>
            </Col>
        </Row>
    )
}

const InvoiceIdPage = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const RawInvoiceTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.update.title' })

    const { link, organization, loading: employeeLoading } = useOrganization()
    const router = useRouter()
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchInvoice, loading: invoiceLoading, obj: invoice, error } = Invoice.useObject({
        where: { id },
    })

    const InvoiceTitleMessage = RawInvoiceTitle.replace('{number}', get(invoice, 'number'))
    const loading = invoiceLoading || employeeLoading

    if (!invoice || loading) {
        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    return (
        <>
            <Head>
                <title>{InvoiceTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <InvoicePageContent
                        invoice={invoice}
                        title={InvoiceTitleMessage}
                        refetchInvoice={refetchInvoice}
                        organization={organization}
                        employee={link}
                    />
                </PageContent>
            </PageWrapper>
        </>
    )
}

InvoiceIdPage.requiredAccess = InvoiceReadPermissionRequired

export default InvoiceIdPage
