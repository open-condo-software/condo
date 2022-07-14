/** @jsx jsx */
import { EditFilled, FilePdfFilled } from '@ant-design/icons'

import {
    SortTicketChangesBy,
    SortTicketCommentFilesBy,
    SortTicketCommentsBy,
    TicketFile as TicketFileType,
    User,
} from '@app/condo/schema'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { Comments } from '@condo/domains/common/components/Comments'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { formatPhone, getAddressDetails } from '@condo/domains/common/utils/helpers'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'
import { TicketChanges } from '@condo/domains/ticket/components/TicketChanges'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { TicketStatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'
import { TicketTag } from '@condo/domains/ticket/components/TicketTag'
import { CLOSED_STATUS_TYPE, REVIEW_VALUES } from '@condo/domains/ticket/constants'

import { TICKET_TYPE_TAG_COLORS, TICKET_CARD_LINK_STYLE } from '@condo/domains/ticket/constants/style'
import {
    Ticket,
    TicketChange,
    TicketComment,
    TicketCommentFile,
    TicketCommentsTime,
    TicketFile,
    UserTicketCommentReadTime,
} from '@condo/domains/ticket/utils/clientSchema'
import { getReviewMessageByValue } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import {
    getDeadlineType,
    getHumanizeDeadlineDateDifference,
    getTicketCreateMessage,
    getTicketTitleMessage,
    TicketDeadlineType,
} from '@condo/domains/ticket/utils/helpers'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { RESIDENT } from '@condo/domains/user/constants/common'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { css, jsx } from '@emotion/react'
import { Affix, Breadcrumb, Col, notification, Row, Space, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { BaseType } from 'antd/lib/typography/Base'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import UploadList from 'antd/lib/upload/UploadList/index'
import dayjs from 'dayjs'
import { compact, get, isEmpty, map } from 'lodash'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'
import { FormattedMessage } from 'react-intl'
import { TicketAssigneeField } from '../../../domains/ticket/components/TicketId/TicketAssigneeField'
import { TicketClassifierField } from '../../../domains/ticket/components/TicketId/TicketClassifierField'
import { TicketClientField } from '../../../domains/ticket/components/TicketId/TicketClientField'
import { TicketDeadlineField } from '../../../domains/ticket/components/TicketId/TicketDeadlineField'
import { TicketDetailsField } from '../../../domains/ticket/components/TicketId/TicketDetailsField'
import { TicketExecutorField } from '../../../domains/ticket/components/TicketId/TicketExecutorField'
import { TicketFileList } from '../../../domains/ticket/components/TicketId/TicketFileList'
import { TicketFileListField } from '../../../domains/ticket/components/TicketId/TicketFileListField'
import { TicketPropertyField } from '../../../domains/ticket/components/TicketId/TicketPropertyField'
import { TicketReviewField } from '../../../domains/ticket/components/TicketId/TicketReviewField'
import { TicketUserInfoField } from '../../../domains/ticket/components/TicketId/TicketUserInfoField'

const COMMENT_RE_FETCH_INTERVAL = 5 * 1000

const TicketContent = ({ ticket }) => {
    return (
        <Col span={24}>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <TicketReviewField ticket={ticket} />
                        <TicketDeadlineField ticket={ticket} />
                        <TicketPropertyField ticket={ticket} />
                        <TicketClientField ticket={ticket} />
                        <TicketDetailsField ticket={ticket} />
                        <TicketFileListField ticket={ticket} />
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
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

export const TicketPageContent = ({ organization, employee, TicketContent }) => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const PrintMessage = intl.formatMessage({ id: 'Print' })
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

    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const user = get(auth, 'user')
    const { isSmall } = useLayoutContext()

    // NOTE: cast `string | string[]` to `string`
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchTicket, loading, obj: ticket, error } = Ticket.useObject({
        where: { id },
    }, {
        fetchPolicy: 'network-only',
    })
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

    const ticketStatusType = get(ticket, ['status', 'type'])
    const disabledEditButton = useMemo(() => ticketStatusType === CLOSED_STATUS_TYPE, [ticketStatusType])
    const statusUpdatedAt = get(ticket, 'statusUpdatedAt')
    const isResidentTicket = useMemo(() => get(ticket, ['createdBy', 'type']) === RESIDENT, [ticket])
    const canReadByResident = useMemo(() => get(ticket,  'canReadByResident'), [ticket])
    const canCreateComments = useMemo(() => get(auth, ['user', 'isAdmin']) || get(employee, ['role', 'canManageTicketComments']),
        [auth, employee])

    const getTimeSinceCreation = useCallback(() => {
        const diffInMinutes = dayjs().diff(dayjs(statusUpdatedAt), 'minutes')
        const daysHavePassed = dayjs.duration(diffInMinutes, 'minutes').format('D')
        const hoursHavePassed = dayjs.duration(diffInMinutes, 'minutes').format('H')
        const minutesHavePassed = dayjs.duration(diffInMinutes, 'minutes').format('m')

        const timeSinceCreation = compact([
            Number(daysHavePassed) > 0 && DaysShortMessage.replace('${days}', daysHavePassed),
            Number(hoursHavePassed) > 0 && HoursShortMessage.replace('${hours}', hoursHavePassed),
            Number(minutesHavePassed) > 0 && MinutesShortMessage.replace('${minutes}', minutesHavePassed),
        ])

        if (isEmpty(timeSinceCreation)) {
            return LessThanMinuteMessage
        }

        return timeSinceCreation.join(' ')
    }, [DaysShortMessage, HoursShortMessage, LessThanMinuteMessage, MinutesShortMessage, statusUpdatedAt])

    if (!ticket) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={error ? ServerErrorMessage : null}/>
        )
    }

    return (
        <>
            <Head>
                <title>{TicketTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]}>
                        <Col lg={16} xs={24}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Row gutter={[0, 40]}>
                                        <Col lg={18} xs={24}>
                                            <Row gutter={[0, 20]}>
                                                <Col span={24}>
                                                    <Typography.Title style={{ margin: 0 }} level={1}>{TicketTitleMessage}</Typography.Title>
                                                </Col>
                                                <Col span={24}>
                                                    <Row>
                                                        <Col span={24}>
                                                            <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                                <Typography.Text style={TICKET_CREATE_INFO_TEXT_STYLE} type='secondary'>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                                                                <UserNameField user={get(ticket, ['createdBy'])}>
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
                                                                {SourceMessage} — {get(ticket, ['source', 'name'], '').toLowerCase()}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col span={24}>
                                                            {
                                                                !isResidentTicket && !canReadByResident && (
                                                                    <Typography.Text type='secondary' style={TICKET_CREATE_INFO_TEXT_STYLE}>
                                                                        <FormattedMessage
                                                                            id={'pages.condo.ticket.title.CanReadByResident'}
                                                                            values={{
                                                                                canReadByResident: (
                                                                                    <Typography.Text type={'danger'}>
                                                                                        {ResidentCannotReadTicketMessage}
                                                                                    </Typography.Text>
                                                                                ),
                                                                            }}
                                                                        />
                                                                    </Typography.Text>
                                                                )
                                                            }
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col lg={6} xs={24}>
                                            <Row justify={isSmall ? 'center' : 'end'} gutter={[0, 20]}>
                                                <Col span={24}>
                                                    <TicketStatusSelect
                                                        organization={organization}
                                                        employee={employee}
                                                        ticket={ticket}
                                                        onUpdate={handleTicketStatusChanged}
                                                        loading={loading}
                                                        data-cy={'ticket__status-select'}
                                                    />
                                                </Col>
                                                {
                                                    statusUpdatedAt && (
                                                        <Col>
                                                            <Typography.Paragraph style={TICKET_UPDATE_INFO_TEXT_STYLE}>
                                                                {ChangedMessage}: {dayjs(statusUpdatedAt).format('DD.MM.YY, HH:mm')}
                                                            </Typography.Paragraph>
                                                            <Typography.Paragraph style={TICKET_UPDATE_INFO_TEXT_STYLE} type={'secondary'}>
                                                                {TimeHasPassedMessage.replace('${time}', getTimeSinceCreation())}
                                                            </Typography.Paragraph>
                                                        </Col>
                                                    )
                                                }
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Space direction={'horizontal'} style={{ marginTop: '1.6em ' }}>
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
                                <TicketContent ticket={ticket}/>
                                <ActionBar>
                                    <Link href={`/ticket/${ticket.id}/update`}>
                                        <Button
                                            disabled={disabledEditButton}
                                            color={'green'}
                                            type={'sberDefaultGradient'}
                                            secondary
                                            icon={<EditFilled />}
                                            data-cy={'ticket__update-link'}
                                        >
                                            {UpdateMessage}
                                        </Button>
                                    </Link>
                                    {
                                        !isSmall && (
                                            <Button
                                                type={'sberDefaultGradient'}
                                                icon={<FilePdfFilled />}
                                                href={`/ticket/${ticket.id}/pdf`}
                                                target={'_blank'}
                                                secondary
                                            >
                                                {PrintMessage}
                                            </Button>
                                        )
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
                                    fileModelRelationField={'ticketComment'}
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
                </PageContent>
            </PageWrapper>
        </>
    )
}

const TicketIdPage = () => {
    const { link, organization } = useOrganization()

    return <TicketPageContent organization={organization} employee={link} TicketContent={TicketContent} />
}

TicketIdPage.requiredAccess = OrganizationRequired

export default TicketIdPage
