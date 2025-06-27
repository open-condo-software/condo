import {
    useCreateTicketCommentMutation,
    useGetOrganizationEmployeeByUserAndOrganizationQuery,
    useGetTicketByIdQuery,
    useGetTicketChangesQuery,
    useGetTicketCommentsFilesQuery,
    useGetTicketCommentsQuery,
    useGetTicketLastCommentsTimeQuery, useGetUserTicketCommentsReadTimeQuery,
    useUpdateTicketCommentMutation,
    useCreateUserTicketCommentReadTimeMutation,
    useUpdateUserTicketCommentReadTimeMutation, useGetTicketInvoicesQuery, GetIncidentsQuery,
} from '@app/condo/gql'
import { B2BAppGlobalFeature } from '@app/condo/schema'
import { Affix, Col, ColProps, notification, Row, RowProps, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { Link as LinkIcon } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { FormattedMessage } from '@open-condo/next/intl'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button } from '@open-condo/ui'

import { ChangeHistory } from '@condo/domains/common/components/ChangeHistory'
import { HistoricalChange } from '@condo/domains/common/components/ChangeHistory/HistoricalChange'
import { Comments } from '@condo/domains/common/components/Comments'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { PageComponentType } from '@condo/domains/common/types'
import { getObjectCreatedMessage } from '@condo/domains/common/utils/date.utils'
import { CopyButton } from '@condo/domains/marketplace/components/Invoice/CopyButton'
import { TicketInvoicesList } from '@condo/domains/marketplace/components/Invoice/TicketInvoicesList'
import { INVOICE_STATUS_CANCELED, INVOICE_STATUS_PUBLISHED } from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { useGlobalAppsFeaturesContext } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import {
    ASSIGNED_TICKET_VISIBILITY,
    MANAGING_COMPANY_TYPE,
    SERVICE_PROVIDER_TYPE,
} from '@condo/domains/organization/constants/common'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'
import { TicketAssigneeField } from '@condo/domains/ticket/components/TicketId/TicketAssigneeField'
import { TicketCallRecordHistory } from '@condo/domains/ticket/components/TicketId/TicketCallRecordHistory'
import { TicketClassifierField } from '@condo/domains/ticket/components/TicketId/TicketClassifierField'
import { TicketClientField } from '@condo/domains/ticket/components/TicketId/TicketClientField'
import { TicketDeadlineField } from '@condo/domains/ticket/components/TicketId/TicketDeadlineField'
import { TicketDetailsField } from '@condo/domains/ticket/components/TicketId/TicketDetailsField'
import { TicketExecutorField } from '@condo/domains/ticket/components/TicketId/TicketExecutorField'
import { TicketFeedbackFields } from '@condo/domains/ticket/components/TicketId/TicketFeedbackFields'
import { TicketFileListField } from '@condo/domains/ticket/components/TicketId/TicketFileListField'
import { TicketPropertyField } from '@condo/domains/ticket/components/TicketId/TicketPropertyField'
import { TicketQualityControlFields } from '@condo/domains/ticket/components/TicketId/TicketQualityControlFields'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { TicketStatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'
import { TicketTag } from '@condo/domains/ticket/components/TicketTag'
import { CLOSED_STATUS_TYPE, CANCELED_STATUS_TYPE } from '@condo/domains/ticket/constants'
import { STATUS_IDS } from '@condo/domains/ticket/constants/statusTransitions'
import { TICKET_TYPE_TAG_STYLE } from '@condo/domains/ticket/constants/style'
import { useActiveCall } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { FavoriteTicketsContextProvider } from '@condo/domains/ticket/contexts/FavoriteTicketsContext'
import {
    TicketQualityControlProvider,
    useTicketQualityControl,
} from '@condo/domains/ticket/contexts/TicketQualityControlContext'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { usePollTicketComments } from '@condo/domains/ticket/hooks/usePollTicketComments'
import { useTicketChangedFieldMessagesOf } from '@condo/domains/ticket/hooks/useTicketChangedFieldMessagesOf'
import { useTicketDocumentGenerationTask } from '@condo/domains/ticket/hooks/useTicketDocumentGenerationTask'
import { useTicketExportToPdfTask } from '@condo/domains/ticket/hooks/useTicketExportToPdfTask'
import {
    TicketCommentFile,
} from '@condo/domains/ticket/utils/clientSchema'
import { FavoriteTicketIndicator } from '@condo/domains/ticket/utils/clientSchema/Renders'
import {
    getTicketTitleMessage,
} from '@condo/domains/ticket/utils/helpers'
import { prefetchTicket } from '@condo/domains/ticket/utils/next/Ticket'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { RESIDENT } from '@condo/domains/user/constants/common'


const TICKET_CONTENT_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const BIG_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 20]
const BIG_HORIZONTAL_GUTTER: RowProps['gutter'] = [40, 0]

const TicketHeader = ({ ticket, handleTicketStatusChanged, organization, employee }) => {
    const intl = useIntl()
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const TicketAuthorMessage = intl.formatMessage({ id: 'Author' })
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const PayableMessage = intl.formatMessage({ id: 'Payable' })
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const ChangedMessage = intl.formatMessage({ id: 'Changed' })
    const TimeHasPassedMessage = intl.formatMessage({ id: 'TimeHasPassed' })
    const DaysShortMessage = intl.formatMessage({ id: 'DaysShort' })
    const HoursShortMessage = intl.formatMessage({ id: 'HoursShort' })
    const MinutesShortMessage = intl.formatMessage({ id: 'MinutesShort' })
    const LessThanMinuteMessage = intl.formatMessage({ id: 'LessThanMinute' })
    const ResidentCannotReadTicketMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.ResidentCannotReadTicket' })

    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [intl, ticket])
    const TicketCreationDate = useMemo(() => getObjectCreatedMessage(intl, ticket), [intl, ticket])

    const isEmergency = get(ticket, 'isEmergency')
    const isPayable = get(ticket, 'isPayable')
    const isWarranty = get(ticket, 'isWarranty')
    const statusReopenedCounter = get(ticket, 'statusReopenedCounter')
    const statusUpdatedAt = useMemo(() => get(ticket, 'statusUpdatedAt'), [ticket])

    const { breakpoints } = useLayoutContext()

    const isResidentTicket = useMemo(() => get(ticket, ['createdBy', 'type']) === RESIDENT, [ticket])
    const canReadByResident = useMemo(() => get(ticket, 'canReadByResident'), [ticket])

    const createdBy = useMemo(() => get(ticket, ['createdBy']), [ticket])
    const formattedStatusUpdatedAt = useMemo(() => dayjs(statusUpdatedAt).format('DD.MM.YY, HH:mm'), [statusUpdatedAt])
    const sourceName = useMemo(() => get(ticket, ['source', 'name'], '').toLowerCase(), [ticket])

    const canReadByResidentFormattedValue = useMemo(() => ({
        canReadByResident: (
            <Typography.Text type='danger'>
                {ResidentCannotReadTicketMessage}
            </Typography.Text>
        ),
    }), [ResidentCannotReadTicketMessage])

    const getTimeSinceCreation = useCallback(() => {
        const diffInMinutes = dayjs().diff(dayjs(statusUpdatedAt), 'minutes')
        const daysHavePassed = dayjs.duration(diffInMinutes, 'minutes').format('D')
        const hoursHavePassed = dayjs.duration(diffInMinutes, 'minutes').format('H')
        const minutesHavePassed = dayjs.duration(diffInMinutes, 'minutes').format('m')

        const timeSinceCreation = compact([
            Number(daysHavePassed) > 0 && DaysShortMessage.replace('{days}', daysHavePassed),
            Number(hoursHavePassed) > 0 && HoursShortMessage.replace('{hours}', hoursHavePassed),
            Number(minutesHavePassed) > 0 && MinutesShortMessage.replace('{minutes}', minutesHavePassed),
        ])

        if (isEmpty(timeSinceCreation)) {
            return LessThanMinuteMessage
        }

        return timeSinceCreation.join(' ')
    }, [DaysShortMessage, HoursShortMessage, LessThanMinuteMessage, MinutesShortMessage, statusUpdatedAt])

    return (
        <Col span={24}>
            <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                <Col span={24}>
                    <Row gutter={breakpoints.TABLET_LARGE ? BIG_VERTICAL_GUTTER : MEDIUM_VERTICAL_GUTTER}>
                        <Col xl={13} md={11} xs={24}>
                            <Row gutter={SMALL_VERTICAL_GUTTER} align='middle'>
                                <Col span={breakpoints.TABLET_LARGE ? 24 : 22}>
                                    <Typography.Title style={TITLE_STYLE}
                                        level={1}>{TicketTitleMessage}</Typography.Title>
                                </Col>
                                {
                                    !breakpoints.TABLET_LARGE && (
                                        <Col span={2}>
                                            <FavoriteTicketIndicator
                                                ticketId={ticket.id}
                                            />
                                        </Col>
                                    )
                                }
                                <Col id='ticket__create-info' span={24}>
                                    <Row>
                                        <Col span={24}>
                                            <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE}
                                                    type='secondary'>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                                                <UserNameField user={createdBy}>
                                                    {({ name, postfix }) => (
                                                        <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                            {name}
                                                            {postfix && <Typography.Text type='secondary'
                                                                ellipsis>&nbsp;{postfix}</Typography.Text>}
                                                        </Typography.Text>
                                                    )}
                                                </UserNameField>
                                            </Typography.Text>
                                        </Col>
                                        <Col span={24}>
                                            <Typography.Text type='secondary' style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                {SourceMessage} — {sourceName}
                                            </Typography.Text>
                                        </Col>
                                        <Col span={24}>
                                            {
                                                !isResidentTicket && !canReadByResident && (
                                                    <Typography.Text type='secondary' style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                        <FormattedMessage
                                                            id='pages.condo.ticket.title.CanReadByResident'
                                                            values={canReadByResidentFormattedValue}
                                                        />
                                                    </Typography.Text>
                                                )
                                            }
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                        <Col xl={11} md={13} xs={24}>
                            {
                                breakpoints.TABLET_LARGE ? (
                                    <Row justify='end' gutter={SMALL_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <Row justify='end' align='middle' gutter={BIG_HORIZONTAL_GUTTER}>
                                                <Col>
                                                    <FavoriteTicketIndicator
                                                        ticketId={ticket.id}
                                                    />
                                                </Col>
                                                <Col>
                                                    <TicketStatusSelect
                                                        organization={organization}
                                                        employee={employee}
                                                        ticket={ticket}
                                                        onUpdate={handleTicketStatusChanged}
                                                        data-cy='ticket__status-select'
                                                    />
                                                </Col>
                                            </Row>
                                        </Col>
                                        {
                                            statusUpdatedAt && (
                                                <Col>
                                                    <Typography.Paragraph style={TICKET_UPDATE_INFO_TEXT_STYLE}>
                                                        {ChangedMessage}: {formattedStatusUpdatedAt}
                                                    </Typography.Paragraph>
                                                    <Typography.Paragraph style={TICKET_UPDATE_INFO_TEXT_STYLE}
                                                        type='secondary'>
                                                        {TimeHasPassedMessage.replace('{time}', getTimeSinceCreation())}
                                                    </Typography.Paragraph>
                                                </Col>
                                            )
                                        }
                                    </Row>
                                ) : (
                                    <Row gutter={SMALL_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <TicketStatusSelect
                                                organization={organization}
                                                employee={employee}
                                                ticket={ticket}
                                                onUpdate={handleTicketStatusChanged}
                                                data-cy='ticket__status-select'
                                            />
                                        </Col>
                                        {
                                            statusUpdatedAt && (
                                                <Col>
                                                    <Typography.Paragraph style={TICKET_UPDATE_INFO_TEXT_STYLE}>
                                                        {ChangedMessage}: {formattedStatusUpdatedAt}
                                                    </Typography.Paragraph>
                                                    <Typography.Paragraph style={TICKET_CREATE_INFO_TEXT_STYLE}
                                                        type='secondary'>
                                                        {TimeHasPassedMessage.replace('{time}', getTimeSinceCreation())}
                                                    </Typography.Paragraph>
                                                </Col>
                                            )
                                        }
                                    </Row>
                                )
                            }
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row justify='space-between' align='middle' gutter={[0, 24]}>
                        <Col span={!breakpoints.TABLET_LARGE && 24}
                            hidden={!isEmergency && !isPayable && !isWarranty && statusReopenedCounter === 0}>
                            <Space id='ticket__field-status' direction='horizontal'>
                                {isEmergency && (
                                    <TicketTag
                                        style={TICKET_TYPE_TAG_STYLE.emergency}
                                    >
                                        {EmergencyMessage}
                                    </TicketTag>
                                )}
                                {isPayable && (
                                    <TicketTag
                                        style={TICKET_TYPE_TAG_STYLE.payable}
                                    >
                                        {PayableMessage}
                                    </TicketTag>
                                )}
                                {isWarranty && (
                                    <TicketTag
                                        style={TICKET_TYPE_TAG_STYLE.warranty}
                                    >
                                        {WarrantyMessage}
                                    </TicketTag>
                                )}
                                {
                                    statusReopenedCounter > 0 && (
                                        <TicketTag
                                            style={TICKET_TYPE_TAG_STYLE.returned}
                                        >
                                            {ReturnedMessage} {statusReopenedCounter > 1 && `(${statusReopenedCounter})`}
                                        </TicketTag>
                                    )
                                }
                            </Space>
                        </Col>
                        <Col span={!breakpoints.TABLET_LARGE && 24}>
                            <TicketResidentFeatures ticket={ticket}/>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}

const TicketContent = ({ ticket }) => {
    return (
        <Col span={24}>
            <Row gutter={[0, 16]}>
                <TicketQualityControlFields ticket={ticket}/>
                <TicketFeedbackFields ticket={ticket}/>
                <TicketDeadlineField ticket={ticket}/>
                <TicketPropertyField ticket={ticket}/>
                <TicketClientField ticket={ticket}/>
                <TicketDetailsField ticket={ticket}/>
                <TicketFileListField ticket={ticket}/>
                <TicketClassifierField ticket={ticket}/>
                <TicketExecutorField ticket={ticket}/>
                <TicketAssigneeField ticket={ticket}/>
            </Row>
        </Col>
    )
}

const TicketActionBar = ({
    invoices,
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

    const { user } = useAuth()

    const { breakpoints } = useLayoutContext()
    const { requestFeature } = useGlobalAppsFeaturesContext()
    const { isCallActive, connectedTickets } = useActiveCall()

    const id = get(ticket, 'id')
    const ticketOrganizationId = useMemo(() => get(ticket, 'organization.id'), [ticket])
    const canShareTickets = useMemo(() => get(employee, 'role.canShareTickets'), [employee])
    const canManageTickets = useMemo(() => get(employee, 'role.canManageTickets'), [employee])

    const ticketStatusType = useMemo(() => get(ticket, ['status', 'type']), [ticket])
    const isDeletedProperty = !ticket.property && ticket.propertyAddress
    const disabledEditTicketButton = ticketStatusType === CLOSED_STATUS_TYPE || ticketStatusType === CANCELED_STATUS_TYPE || isDeletedProperty
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
    })

    const hasValidInvoice = useMemo(() => Array.isArray(invoices) && !!invoices.find((invoice) => get(invoice, 'status') !== INVOICE_STATUS_CANCELED), [invoices])

    const { TicketDocumentGenerationButton } = useTicketDocumentGenerationTask({
        hasValidInvoice,
        ticketId: id || null,
        isPaidTicket: ticket?.isPayable || false,
        timeZone,
        userId: user?.id || null,
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
                            type='primary'
                            data-cy='ticket__update-link'
                        >
                            {UpdateMessage}
                        </Button>
                    </Link>
                ),
                <TicketDocumentGenerationButton key='generateDocument' />,
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

const TICKET_CREATE_INFO_TEXT_STYLE: CSSProperties = { margin: 0, fontSize: '12px' }
const TICKET_UPDATE_INFO_TEXT_STYLE: CSSProperties = { margin: 0, fontSize: '12px', textAlign: 'end' }
const HINT_CARD_STYLE: CSSProperties = { maxHeight: '3em ' }
const TITLE_STYLE: CSSProperties = { margin: 0 }
const HINTS_COL_PROPS: ColProps = { span: 24 }
const CopyMessageStyle: CSSProperties = { flexShrink: 1, whiteSpace: 'nowrap' }

const TicketInvoices = ({ invoices, invoicesLoading, refetchInvoices, ticket }) => {
    const intl = useIntl()
    const PaymentLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.paymentLink' })
    const CopyMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.paymentLink.copy' })
    const CopiedLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copiedLink' })

    const { breakpoints } = useLayoutContext()

    const [paymentLink, setPaymentLink] = useState<string>()
    const getPaymentLink = useInvoicePaymentLink()
    const publishedInvoiceIds = useMemo(
        () => invoices.filter(invoice => invoice.status === INVOICE_STATUS_PUBLISHED)
            .map(({ id }) => id),
        [invoices])

    useEffect(() => {
        if (!isEmpty(publishedInvoiceIds)) {
            getPaymentLink(publishedInvoiceIds)
                .then(({ paymentLink }) => setPaymentLink(paymentLink))
        }
    }, [getPaymentLink, publishedInvoiceIds])

    const ticketStatusType = get(ticket, 'status.type')
    const isAllFieldsDisabled = ticketStatusType === CLOSED_STATUS_TYPE || ticketStatusType === CANCELED_STATUS_TYPE
    const paymentLinkStyles: CSSProperties = useMemo(() => ({
        display: 'flex',
        flexDirection: breakpoints.TABLET_SMALL ? 'row' : 'column',
        gap: breakpoints.TABLET_SMALL ? '36px' : '20px',
    }), [breakpoints.TABLET_SMALL])

    if (!invoices && invoicesLoading) return <Loader />

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <TicketInvoicesList
                    organizationId={get(ticket, 'organization.id')}
                    existedInvoices={invoices}
                    refetchInvoices={refetchInvoices}
                    isAllFieldsDisabled={isAllFieldsDisabled}
                    ticketCreatedByResident={get(ticket, 'createdBy.type') === RESIDENT}
                />
            </Col>
            {
                publishedInvoiceIds.length > 0 && (
                    <PageFieldRow align='middle' title={PaymentLinkMessage}>
                        <div style={paymentLinkStyles}>
                            <Typography.Link href={paymentLink} title={paymentLink} ellipsis>
                                {paymentLink}
                            </Typography.Link>
                            <div style={CopyMessageStyle}>
                                <CopyButton
                                    textButton
                                    url={paymentLink}
                                    copyMessage={CopyMessage}
                                    copiedMessage={CopiedLinkMessage}
                                />
                            </div>
                        </div>
                    </PageFieldRow>
                )
            }
        </Row>
    )
}

export const TicketPageContent = ({ ticket, pollCommentsQuery, refetchTicket, organization, employee, TicketContent }) => {
    const intl = useIntl()
    const BlockedEditingTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.BlockedEditing.title' })
    const BlockedEditingDescriptionMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.BlockedEditing.description' })
    const TicketChangesMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketChanges' })

    const { user } = useAuth()
    const { breakpoints } = useLayoutContext()
    const { persistor } = useCachePersistor()

    const id = useMemo(() => ticket?.id, [ticket?.id])

    const {
        data: ticketChangesData,
        refetch: refetchTicketChanges,
        loading: ticketChangesLoading,
    } = useGetTicketChangesQuery({
        variables: {
            ticketId: id,
        },
        skip: !persistor,
    })
    const ticketChanges = useMemo(() => ticketChangesData?.ticketChanges?.filter(Boolean) || [], [ticketChangesData?.ticketChanges])
    const ticketChangesCount = useMemo(() => ticketChanges.length, [ticketChanges.length])

    const {
        data: ticketCommentsData,
        refetch: refetchTicketComments,
    } = useGetTicketCommentsQuery({
        variables: {
            ticketId: id,
        },
        skip: !persistor,
    })

    const comments = useMemo(() => ticketCommentsData?.ticketComments?.filter(Boolean) || [],
        [ticketCommentsData?.ticketComments])
    const commentsIds = useMemo(() => map(comments, 'id'), [comments])

    const {
        data: ticketCommentsFilesData,
        refetch: refetchCommentFiles,
    } = useGetTicketCommentsFilesQuery({
        variables: {
            ticketCommentsIds: commentsIds,
        },
        skip: isEmpty(commentsIds) || !persistor,
    })
    const ticketCommentFiles = useMemo(() => ticketCommentsFilesData?.files?.filter(Boolean) || [],
        [ticketCommentsFilesData?.files])

    const commentsWithFiles = useMemo(() => comments.map(comment => {
        return {
            ...comment,
            files: ticketCommentFiles.filter(file => file.ticketComment.id === comment.id),
        }
    }), [comments, ticketCommentFiles])

    const [updateComment] = useUpdateTicketCommentMutation({
        onCompleted: async () => {
            await refetchTicketComments()
            await refetchCommentFiles()
        },
    })
    const [createCommentAction] = useCreateTicketCommentMutation()

    const {
        data: ticketCommentTimesData,
        refetch: refetchTicketCommentTimes,
    } = useGetTicketLastCommentsTimeQuery({
        variables: {
            id,
        },
        skip: !persistor || isEmpty(comments),
    })
    const ticketCommentTimes = useMemo(() => ticketCommentTimesData?.ticketCommentTimes?.filter(Boolean)[0],
        [ticketCommentTimesData?.ticketCommentTimes])

    const {
        data: userTicketCommentsReadTimesData,
        refetch: refetchUserTicketCommentsReadTimes,
        loading: loadingUserTicketCommentsReadTimes,
    } = useGetUserTicketCommentsReadTimeQuery({
        variables: {
            userId: user.id,
            ticketIds: [id],
        },
        skip: !persistor || isEmpty(user),
    })
    const userTicketCommentsReadTimes = useMemo(() => userTicketCommentsReadTimesData?.objs?.filter(Boolean)[0],
        [userTicketCommentsReadTimesData?.objs])

    const [createUserTicketCommentReadTime] = useCreateUserTicketCommentReadTimeMutation({
        onCompleted: async () => {
            await refetchUserTicketCommentsReadTimes()
        },
    })
    const [updateUserTicketCommentReadTime] = useUpdateUserTicketCommentReadTimeMutation({
        onCompleted: async () => {
            await refetchUserTicketCommentsReadTimes()
        },
    })

    const ticketVisibilityType = get(employee, 'role.ticketVisibilityType')

    const refetchCommentsWithFiles = useCallback(async () => {
        await refetchTicketComments()
        await refetchCommentFiles()
        await refetchTicketCommentTimes()
        await refetchUserTicketCommentsReadTimes()
    }, [refetchCommentFiles, refetchTicketComments, refetchTicketCommentTimes, refetchUserTicketCommentsReadTimes])

    usePollTicketComments({
        ticket,
        refetchTicketComments: refetchCommentsWithFiles,
        pollCommentsQuery,
    })

    const ticketPropertyId = get(ticket, ['property', 'id'], null)
    const isDeletedProperty = !ticket.property && ticket.propertyAddress
    const canCreateComments = useMemo(
        () => user?.isAdmin || get(employee, ['role', 'canManageTicketComments']),
        [user, employee]
    )
    const isNoServiceProviderOrganization = useMemo(() => (get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE), [organization])

    const {
        data: invoicesData,
        loading: invoicesLoading,
        refetch: refetchInvoices,
    } = useGetTicketInvoicesQuery({
        variables: {
            ticketId: ticket.id,
        },
        skip: !persistor || !ticket?.id || !isNoServiceProviderOrganization,
    })
    const invoices = useMemo(() => invoicesData?.invoices?.filter(Boolean) || [],
        [invoicesData?.invoices])

    const refetchTicketAndRelatedObjs = useCallback(async () => {
        await refetchTicket()
        await refetchTicketChanges()
        await refetchInvoices()
    }, [refetchInvoices, refetchTicket, refetchTicketChanges])

    const [actualIncidents, setActualIncidents] = useState<GetIncidentsQuery['incidents']>([])

    const render = (
        <Row gutter={BIG_VERTICAL_GUTTER}>
            <Col lg={16} xs={24}>
                <Row gutter={TICKET_CONTENT_VERTICAL_GUTTER}>
                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                        <TicketHeader
                            ticket={ticket}
                            handleTicketStatusChanged={refetchTicketAndRelatedObjs}
                            organization={organization}
                            employee={employee}
                        />
                        {
                            isDeletedProperty && (
                                <Col span={24}>
                                    <Alert
                                        type='info'
                                        showIcon
                                        message={BlockedEditingTitleMessage}
                                        description={BlockedEditingDescriptionMessage}
                                    />
                                </Col>
                            )
                        }
                    </Row>
                    <TicketContent ticket={ticket}/>
                    {
                        isNoServiceProviderOrganization && ticket.isPayable && (
                            <Col span={24}>
                                <TicketInvoices
                                    invoices={invoices}
                                    refetchInvoices={refetchInvoices}
                                    invoicesLoading={invoicesLoading}
                                    ticket={ticket}
                                />
                            </Col>
                        )
                    }
                    {
                        ticketVisibilityType !== ASSIGNED_TICKET_VISIBILITY && (
                            <TicketPropertyHintCard
                                propertyId={ticketPropertyId}
                                hintContentStyle={HINT_CARD_STYLE}
                                colProps={HINTS_COL_PROPS}
                            />
                        )
                    }
                    <IncidentHints
                        organizationId={organization.id}
                        propertyId={ticketPropertyId}
                        classifier={ticket.classifier}
                        colProps={HINTS_COL_PROPS}
                        onActualIncidentsChange={setActualIncidents}
                    />
                    <TicketCallRecordHistory
                        ticketId={id}
                        ticketOrganizationId={organization.id}
                    />
                    <ChangeHistory
                        items={ticketChanges}
                        total={ticketChangesCount}
                        loading={ticketChangesLoading}
                        title={TicketChangesMessage}
                        useChangedFieldMessagesOf={useTicketChangedFieldMessagesOf}
                        HistoricalChange={HistoricalChange}
                        id='ticket__change-history'
                    />
                    <Col span={24}>
                        <TicketActionBar
                            invoices={invoices}
                            ticket={ticket}
                            organization={organization}
                            employee={employee}
                        />
                    </Col>
                </Row>
            </Col>
            <Col lg={7} xs={24} offset={breakpoints.DESKTOP_SMALL ? 1 : 0}>
                <Affix offsetTop={40}>
                    <Comments
                        ticketId={id}
                        ticket={ticket}
                        ticketCommentTimes={ticketCommentTimes}
                        userTicketCommentReadTime={userTicketCommentsReadTimes}
                        createUserTicketCommentReadTime={createUserTicketCommentReadTime}
                        updateUserTicketCommentReadTime={updateUserTicketCommentReadTime}
                        loadingUserTicketCommentReadTime={loadingUserTicketCommentsReadTimes}
                        FileModel={TicketCommentFile}
                        fileModelRelationField='ticketComment'
                        createAction={createCommentAction}
                        updateAction={updateComment}
                        refetchComments={refetchCommentsWithFiles}
                        comments={commentsWithFiles}
                        canCreateComments={canCreateComments}
                        actualIncidents={actualIncidents}
                    />
                </Affix>
            </Col>
        </Row>
    )

    return (
        <TicketQualityControlProvider ticketId={id} afterUpdate={refetchTicketAndRelatedObjs}>
            {render}
        </TicketQualityControlProvider>
    )
}

const TicketIdPage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const { persistor } = useCachePersistor()

    const { user } = useAuth()
    const { link, organization, selectEmployee } = useOrganization()
    const { query } = useRouter()
    const ticketId = typeof query?.id === 'string' ? query?.id : null

    const {
        data: ticketByIdData,
        loading: ticketLoading,
        refetch: refetchTicket,
        error,
    } = useGetTicketByIdQuery({
        variables: {
            id: ticketId,
        },
        skip: !persistor || !ticketId,
    })
    const ticket = useMemo(() => ticketByIdData?.tickets?.filter(Boolean)[0], [ticketByIdData?.tickets])

    const userId = user?.id || null
    const ticketOrganizationId = ticket?.organization?.id || null

    const {
        data,
    } = useGetOrganizationEmployeeByUserAndOrganizationQuery({
        variables: {
            userId,
            organizationId: ticketOrganizationId,
        },
        skip: !userId || !ticketOrganizationId || !persistor,
    })
    const ticketOrganizationEmployee = useMemo(() => data?.employees?.filter(Boolean)[0], [data?.employees])

    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [intl, ticket])

    const currentEmployeeOrganizationId = organization?.id

    useEffect(() => {
        if (
            !isEmpty(ticketOrganizationEmployee) &&
            ticketOrganizationId !== currentEmployeeOrganizationId
        ) {
            selectEmployee(ticketOrganizationEmployee?.id)
        }
    }, [ticketOrganizationId, currentEmployeeOrganizationId, ticketOrganizationEmployee, selectEmployee])

    const { canEmployeeReadTicket, ticketFilterQueryLoading } = useTicketVisibility()

    const pollCommentsQuery = useMemo(() => ({ ticket: { organization: { id: get(organization, 'id', null) } } }),
        [organization])

    if (!ticket || ticketFilterQueryLoading) {
        return (
            <LoadingOrErrorPage
                loading={ticketFilterQueryLoading || ticketLoading}
                error={error && ServerErrorMessage}
            />
        )
    }

    if (!canEmployeeReadTicket(ticket)) {
        return (
            <AccessDeniedPage/>
        )
    }

    return (
        <>
            <Head>
                <title>{TicketTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <FavoriteTicketsContextProvider
                        extraTicketsQuery={{ id: ticketId }}
                    >
                        <TicketPageContent
                            pollCommentsQuery={pollCommentsQuery}
                            ticket={ticket}
                            refetchTicket={refetchTicket}
                            organization={organization}
                            employee={link}
                            TicketContent={TicketContent}
                        />
                    </FavoriteTicketsContextProvider>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketIdPage.requiredAccess = TicketReadPermissionRequired

TicketIdPage.getPrefetchedData = async ({ context, apolloClient }) => {
    const { query } = context
    const { id: ticketId } = query as { id: string }

    await prefetchTicket({ client: apolloClient, ticketId })

    return {
        props: {},
    }
}

export default TicketIdPage
