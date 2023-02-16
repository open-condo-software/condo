/** @jsx jsx */
import { EditFilled } from '@ant-design/icons'
import {
    SortTicketChangesBy,
    SortTicketCommentFilesBy,
    SortTicketCommentsBy,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Affix, Col, Row, RowProps, Space, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import { compact, get, isEmpty, map } from 'lodash'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { FormattedMessage } from '@open-condo/next/intl'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert } from '@open-condo/ui'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { Comments } from '@condo/domains/common/components/Comments'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ASSIGNED_TICKET_VISIBILITY } from '@condo/domains/organization/constants/common'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'
import { TicketChanges } from '@condo/domains/ticket/components/TicketChanges'
import { TicketAssigneeField } from '@condo/domains/ticket/components/TicketId/TicketAssigneeField'
import { TicketClassifierField } from '@condo/domains/ticket/components/TicketId/TicketClassifierField'
import { TicketClientField } from '@condo/domains/ticket/components/TicketId/TicketClientField'
import { TicketDeadlineField } from '@condo/domains/ticket/components/TicketId/TicketDeadlineField'
import { TicketDetailsField } from '@condo/domains/ticket/components/TicketId/TicketDetailsField'
import { TicketExecutorField } from '@condo/domains/ticket/components/TicketId/TicketExecutorField'
import { TicketFileListField } from '@condo/domains/ticket/components/TicketId/TicketFileListField'
import { TicketPropertyField } from '@condo/domains/ticket/components/TicketId/TicketPropertyField'
import { TicketResidentFeatures } from '@condo/domains/ticket/components/TicketId/TicketResidentFeatures'
import { TicketReviewField } from '@condo/domains/ticket/components/TicketId/TicketReviewField'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { TicketStatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'
import { TicketTag } from '@condo/domains/ticket/components/TicketTag'
import { CLOSED_STATUS_TYPE } from '@condo/domains/ticket/constants'
import { TICKET_TYPE_TAG_COLORS } from '@condo/domains/ticket/constants/style'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { useTicketExportToPdfTask } from '@condo/domains/ticket/hooks/useTicketExportToPdfTask'
import {
    Ticket,
    TicketChange,
    TicketComment,
    TicketCommentFile,
    TicketCommentsTime,
    UserTicketCommentReadTime,
} from '@condo/domains/ticket/utils/clientSchema'
import {
    getTicketCreateMessage,
    getTicketTitleMessage,
} from '@condo/domains/ticket/utils/helpers'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { RESIDENT } from '@condo/domains/user/constants/common'

const COMMENT_RE_FETCH_INTERVAL = 5 * 1000
const TICKET_CONTENT_VERTICAL_GUTTER: RowProps['gutter'] = [0, 60]
const BIG_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 20]

const TicketContent = ({ ticket }) => {
    return (
        <Col span={24}>
            <Row gutter={BIG_VERTICAL_GUTTER}>
                <Col span={24}>
                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                        <TicketReviewField ticket={ticket} />
                        <TicketDeadlineField ticket={ticket} />
                        <TicketPropertyField ticket={ticket} />
                        <TicketClientField ticket={ticket} />
                        <TicketDetailsField ticket={ticket} />
                        <TicketFileListField ticket={ticket} />
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                        <TicketClassifierField ticket={ticket} />
                        <TicketExecutorField ticket={ticket} />
                        <TicketAssigneeField ticket={ticket} />
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}

const TICKET_CREATE_INFO_TEXT_STYLE: CSSProperties = { margin: 0, fontSize: '12px' }
const TICKET_UPDATE_INFO_TEXT_STYLE: CSSProperties = { margin: 0, fontSize: '12px', textAlign: 'end' }
const TAGS_ROW_STYLE: CSSProperties = { marginTop: '1.6em ' }
const TAGS_ROW_GUTTER: [Gutter, Gutter] = [0, 10]
const HINT_CARD_STYLE: CSSProperties = { maxHeight: '3em ' }
const TITLE_STYLE: CSSProperties = { margin: 0 }

export const TicketPageContent = ({ ticket, refetchTicket, loading, organization, employee, TicketContent }) => {
    const intl = useIntl()
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const TicketAuthorMessage = intl.formatMessage({ id: 'Author' })
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' })
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const ChangedMessage = intl.formatMessage({ id: 'Changed' })
    const TimeHasPassedMessage = intl.formatMessage({ id: 'TimeHasPassed' })
    const DaysShortMessage = intl.formatMessage({ id: 'DaysShort' })
    const HoursShortMessage = intl.formatMessage({ id: 'HoursShort' })
    const MinutesShortMessage = intl.formatMessage({ id: 'MinutesShort' })
    const LessThanMinuteMessage = intl.formatMessage({ id: 'LessThanMinute' })
    const ResidentCannotReadTicketMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.ResidentCannotReadTicket' })
    const BlockedEditingTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.BlockedEditing.title' })
    const BlockedEditingDescriptionMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.BlockedEditing.description' })

    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const auth = useAuth() as { user: { id: string } }
    const user = get(auth, 'user')
    const { isSmall } = useLayoutContext()

    const id = get(ticket, 'id')

    // TODO(antonal): get rid of separate GraphQL query for TicketChanges
    const ticketChangesResult = TicketChange.useObjects({
        where: { ticket: { id } },
        sortBy: [SortTicketChangesBy.CreatedAtDesc],
    }, {
        fetchPolicy: 'network-only',
    })

    const { objs: comments, refetch: refetchComments } = TicketComment.useObjects({
        where: { ticket: { id } },
        sortBy: [SortTicketCommentsBy.CreatedAtDesc],
    })

    const commentsIds = useMemo(() => map(comments, 'id'), [comments])

    const { objs: ticketCommentFiles, refetch: refetchCommentFiles } = TicketCommentFile.useObjects({
        where: { ticketComment: { id_in: commentsIds } },
        sortBy: [SortTicketCommentFilesBy.CreatedAtDesc],
    })

    const commentsWithFiles = useMemo(() => comments.map(comment => {
        return {
            ...comment,
            files: ticketCommentFiles.filter(file => file.ticketComment.id === comment.id),
        }
    }), [comments, ticketCommentFiles])

    const updateComment = TicketComment.useUpdate({}, () => {
        refetchComments()
        refetchCommentFiles()
    })
    const deleteComment = TicketComment.useSoftDelete(() => refetchComments())

    const createCommentAction = TicketComment.useCreate({
        ticket: { connect: { id: id } },
        user: { connect: { id: auth.user && auth.user.id } },
    })

    const { obj: ticketCommentsTime, refetch: refetchTicketCommentsTime } = TicketCommentsTime.useObject({
        where: {
            ticket: { id: id },
        },
    })
    const {
        obj: userTicketCommentReadTime, refetch: refetchUserTicketCommentReadTime, loading: loadingUserTicketCommentReadTime,
    } = UserTicketCommentReadTime.useObject({
        where: {
            user: { id: user.id },
            ticket: { id },
        },
    })
    const createUserTicketCommentReadTime = UserTicketCommentReadTime.useCreate({
        user: { connect: {  id: user.id } },
        ticket: { connect: { id } },
    }, () => refetchUserTicketCommentReadTime())
    const updateUserTicketCommentReadTime = UserTicketCommentReadTime.useUpdate({
        user: { connect: {  id: user.id } },
        ticket: { connect: { id } },
    }, () => refetchUserTicketCommentReadTime())

    const canShareTickets = get(employee, 'role.canShareTickets')
    const ticketVisibilityType = get(employee, 'role.ticketVisibilityType')
    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [ticket])
    const TicketCreationDate = useMemo(() => getTicketCreateMessage(intl, ticket), [ticket])

    const refetchCommentsWithFiles = useCallback(async () => {
        await refetchComments()
        await refetchCommentFiles()
        await refetchTicketCommentsTime()
        await refetchUserTicketCommentReadTime()
    }, [refetchCommentFiles, refetchComments, refetchTicketCommentsTime, refetchUserTicketCommentReadTime])

    const actionsFor = useCallback(comment => {
        const isAuthor = comment.user.id === auth.user.id
        const isAdmin = get(auth, ['user', 'isAdmin'])
        return {
            updateAction: isAdmin || isAuthor ? updateComment : null,
            deleteAction: isAdmin || isAuthor ? deleteComment : null,
        }
    }, [auth, deleteComment, updateComment])

    useEffect(() => {
        const handler = setInterval(refetchCommentsWithFiles, COMMENT_RE_FETCH_INTERVAL)
        return () => {
            clearInterval(handler)
        }
    })

    const isEmergency = get(ticket, 'isEmergency')
    const isPaid = get(ticket, 'isPaid')
    const isWarranty = get(ticket, 'isWarranty')
    const statusReopenedCounter = get(ticket, 'statusReopenedCounter')

    const handleTicketStatusChanged = () => {
        refetchTicket()
        ticketChangesResult.refetch()
    }

    const ticketPropertyId = get(ticket, ['property', 'id'], null)
    const ticketStatusType = useMemo(() => get(ticket, ['status', 'type']), [ticket])
    const isDeletedProperty = !ticket.property && ticket.propertyAddress
    const disabledEditButton = ticketStatusType === CLOSED_STATUS_TYPE || isDeletedProperty
    const statusUpdatedAt = useMemo(() => get(ticket, 'statusUpdatedAt'), [ticket])
    const isResidentTicket = useMemo(() => get(ticket, ['createdBy', 'type']) === RESIDENT, [ticket])
    const canReadByResident = useMemo(() => get(ticket,  'canReadByResident'), [ticket])
    const canCreateComments = useMemo(() => get(auth, ['user', 'isAdmin']) || get(employee, ['role', 'canManageTicketComments']),
        [auth, employee])
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

    return (
        <Row gutter={BIG_VERTICAL_GUTTER}>
            <Col lg={15} xxl={16} xs={24}>
                <Row gutter={TICKET_CONTENT_VERTICAL_GUTTER}>
                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Row gutter={BIG_VERTICAL_GUTTER}>
                                <Col xl={13} md={11} xs={24}>
                                    <Row gutter={SMALL_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <Typography.Title style={TITLE_STYLE} level={1}>{TicketTitleMessage}</Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Row>
                                                <Col span={24}>
                                                    <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                        <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE} type='secondary'>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                                                        <UserNameField user={createdBy}>
                                                            {({ name, postfix }) => (
                                                                <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                                    {name}
                                                                    {postfix && <Typography.Text type='secondary' ellipsis>&nbsp;{postfix}</Typography.Text>}
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
                                    <Row justify={isSmall ? 'center' : 'end'} gutter={SMALL_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <Row justify='end'>
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
                                                    <Typography.Paragraph style={TICKET_UPDATE_INFO_TEXT_STYLE} type='secondary'>
                                                        {TimeHasPassedMessage.replace('{time}', getTimeSinceCreation())}
                                                    </Typography.Paragraph>
                                                </Col>
                                            )
                                        }
                                    </Row>
                                </Col>
                            </Row>
                            <Row justify='space-between' align='middle' style={TAGS_ROW_STYLE} gutter={TAGS_ROW_GUTTER}>
                                <Col>
                                    <Space direction='horizontal'>
                                        {isEmergency && <TicketTag color={TICKET_TYPE_TAG_COLORS.emergency}>{EmergencyMessage.toLowerCase()}</TicketTag>}
                                        {isPaid && <TicketTag color={TICKET_TYPE_TAG_COLORS.paid}>{PaidMessage.toLowerCase()}</TicketTag>}
                                        {isWarranty && <TicketTag color={TICKET_TYPE_TAG_COLORS.warranty}>{WarrantyMessage.toLowerCase()}</TicketTag>}
                                        {
                                            statusReopenedCounter > 0 && (
                                                <TicketTag color={TICKET_TYPE_TAG_COLORS.returned}>
                                                    {ReturnedMessage.toLowerCase()} {statusReopenedCounter > 1 && `(${statusReopenedCounter})`}
                                                </TicketTag>
                                            )
                                        }
                                    </Space>
                                </Col>
                                <Col>
                                    <TicketResidentFeatures ticket={ticket} />
                                </Col>
                            </Row>
                        </Col>
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
                        ticketVisibilityType !== ASSIGNED_TICKET_VISIBILITY && (
                            <Col span={24}>
                                <TicketPropertyHintCard
                                    propertyId={ticketPropertyId}
                                    hintContentStyle={HINT_CARD_STYLE}
                                />
                            </Col>
                        )
                    }
                    <ActionBar>
                        <Link href={`/ticket/${ticket.id}/update`}>
                            <Button
                                disabled={disabledEditButton}
                                color='green'
                                type='sberDefaultGradient'
                                secondary
                                icon={<EditFilled />}
                                data-cy='ticket__update-link'
                            >
                                {UpdateMessage}
                            </Button>
                        </Link>
                        {
                            !isSmall && <>
                                <TicketBlanksExportToPdfButton />
                                {TicketBlanksExportToPdfModal}
                            </>
                        }
                        {
                            canShareTickets
                                ? <ShareTicketModal
                                    organization={organization}
                                    date={get(ticket, 'createdAt')}
                                    number={get(ticket, 'number')}
                                    details={get(ticket, 'details')}
                                    id={id}
                                    locale={get(organization, 'country')}
                                />
                                : null
                        }
                    </ActionBar>
                    <TicketChanges
                        loading={get(ticketChangesResult, 'loading')}
                        items={get(ticketChangesResult, 'objs')}
                        total={get(ticketChangesResult, 'count')}
                    />
                </Row>
            </Col>
            <Col lg={7} xs={24} offset={isSmall ? 0 : 1}>
                <Affix offsetTop={40}>
                    <Comments
                        ticketCommentsTime={ticketCommentsTime}
                        userTicketCommentReadTime={userTicketCommentReadTime}
                        createUserTicketCommentReadTime={createUserTicketCommentReadTime}
                        updateUserTicketCommentReadTime={updateUserTicketCommentReadTime}
                        loadingUserTicketCommentReadTime={loadingUserTicketCommentReadTime}
                        FileModel={TicketCommentFile}
                        fileModelRelationField='ticketComment'
                        ticket={ticket}
                        createAction={createCommentAction}
                        updateAction={updateComment}
                        refetchComments={refetchCommentsWithFiles}
                        comments={commentsWithFiles}
                        canCreateComments={canCreateComments}
                        actionsFor={actionsFor}
                    />
                </Affix>
            </Col>
        </Row>
    )
}

const TicketIdPage = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const { user, isLoading: userLoading } = useAuth()
    const { link, organization, selectLink, isLoading: currentOrganizationLoading } = useOrganization()

    const router = useRouter()

    // NOTE: cast `string | string[]` to `string`
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchTicket, loading: ticketLoading, obj: ticket, error } = Ticket.useObject({
        where: { id },
    }, {
        fetchPolicy: 'network-only',
    })

    const userId = get(user, 'id', null)
    const ticketOrganizationId = get(ticket, 'organization.id', null)

    const {
        obj: ticketOrganizationEmployee,
        loading: ticketOrganizationEmployeeLoading,
    } = OrganizationEmployee.useObject({
        where: {
            user: { id: userId },
            organization: { id: ticketOrganizationId },
        },
    })

    const { canEmployeeReadTicket, ticketFilterQueryLoading } = useTicketVisibility()
    const isEmployeeReadTicket = canEmployeeReadTicket(ticket)

    const loading = userLoading || currentOrganizationLoading || ticketLoading || ticketOrganizationEmployeeLoading || ticketFilterQueryLoading
    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [ticket])

    if (loading) {
        return (
            <LoadingOrErrorPage
                title={TicketTitleMessage}
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    const ticketOrganizationEmployeeOrganizationId = get(ticketOrganizationEmployee, 'organization.id')
    const currentEmployeeOrganization = get(organization, 'id')
    if (
        ticketOrganizationEmployeeOrganizationId &&
        ticketOrganizationEmployeeOrganizationId !== currentEmployeeOrganization
    ) {
        selectLink(ticketOrganizationEmployee)
    }

    if (!ticket || !ticketOrganizationEmployee || !isEmployeeReadTicket) {
        return (
            <AccessDeniedPage title={TicketTitleMessage} />
        )
    }

    return (
        <>
            <Head>
                <title>{TicketTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <TicketPageContent
                        ticket={ticket}
                        loading={loading}
                        refetchTicket={refetchTicket}
                        organization={organization}
                        employee={link}
                        TicketContent={TicketContent}
                    />
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketIdPage.requiredAccess = OrganizationRequired

export default TicketIdPage
