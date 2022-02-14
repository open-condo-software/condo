import { EditFilled, FilePdfFilled } from '@ant-design/icons'
import { TICKET_TYPE_TAG_COLORS } from '@app/condo/domains/ticket/constants/style'
import { User } from '@app/condo/schema'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { Comments } from '@condo/domains/common/components/Comments'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { colors } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { fontSizes } from '@condo/domains/common/constants/style'
import { formatPhone, getAddressDetails } from '@condo/domains/common/utils/helpers'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'
import { TicketChanges } from '@condo/domains/ticket/components/TicketChanges'
import { TicketStatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'
import { CLOSED_STATUS_TYPE } from '@condo/domains/ticket/constants'
import { Ticket, TicketChange, TicketComment, TicketFile } from '@condo/domains/ticket/utils/clientSchema'
import {
    getDeadlineType, getHumanizeDeadlineDateDifference,
    getTicketCreateMessage,
    getTicketTitleMessage,
    TicketDeadlineType,
} from '@condo/domains/ticket/utils/helpers'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import styled from '@emotion/styled'
import { Affix, Breadcrumb, Col, Row, Space, Tag, Typography } from 'antd'
import { UploadFileStatus } from 'antd/lib/upload/interface'
import UploadList from 'antd/lib/upload/UploadList/index'
import { compact, get, isEmpty } from 'lodash'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { BaseType } from 'antd/lib/typography/Base'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

const COMMENT_RE_FETCH_INTERVAL = 5 * 1000

interface ITicketFileListProps {
    files?: TicketFile.ITicketFileUIState[]
}

const UploadListWrapperStyles = css`
  .ant-upload-list-text-container:first-child .ant-upload-list-item {
    margin-top: 0;
  }
  
  & .ant-upload-span a.ant-upload-list-item-name {
    color: ${colors.black};
    text-decoration: underline;
    text-decoration-color: ${colors.lightGrey[5]};
  }
  
  .ant-upload-span .ant-upload-text-icon {
    font-size: ${fontSizes.content};
    
    & .anticon-paper-clip.anticon {
      font-size: ${fontSizes.content};
      color: ${colors.green[5]};
    }
  }
`

export const TicketFileList: React.FC<ITicketFileListProps> = ({ files }) => {
    const uploadFiles = files.map(({ file }) => {
        const fileInList = {
            uid: file.id,
            name: file.originalFilename,
            status: 'done' as UploadFileStatus,
            url: file.publicUrl,
        }
        return fileInList
    })
    return (
        <div className={'upload-control-wrapper'} css={UploadListWrapperStyles}>
            <UploadList locale={{}} showRemoveIcon={false} items={uploadFiles} />
        </div>
    )
}

interface ITicketUserInfoFieldProps {
    user?: Partial<User>
}

export const TicketUserInfoField: React.FC<ITicketUserInfoFieldProps> = (props) => {
    const id = get(props, ['user', 'id'])
    const name = get(props, ['user', 'name'])
    const phone = get(props, ['user', 'phone'])
    const email = get(props, ['user', 'email'])

    const items = []

    if (name) {
        items.push(
            <UserNameField user={{ name, id }}>
                {({ name, postfix }) => (
                    <>
                        {name}
                        {postfix && (
                            <Typography.Text type='secondary'>&nbsp;{postfix}</Typography.Text>
                        )}
                    </>
                )}
            </UserNameField>
        )
    }

    if (phone) {
        items.push(formatPhone(phone))
    }

    if (email) {
        items.push(email)
    }

    return (
        <>
            {items.map((item, i) => (
                <div key={i}>
                    {item}
                    {i !== items.length - 1 && (
                        <br/>
                    )}
                </div>
            ))}
        </>
    )
}

const TicketTag = styled(Tag)`
  &.ant-tag {
    border-radius: 100px;
  }
  
  font-size: ${fontSizes.label};
  line-height: 24px;
`

const CLASSIFIER_VALUE_STYLE = { fontSize: '16px' }
const TICKET_CARD_LINK_STYLE = { color: colors.black, textDecoration: 'underline', textDecorationColor: colors.lightGrey[5] }

const TicketContent = ({ ticket }) => {
    const intl = useIntl()
    const TicketInfoMessage = intl.formatMessage({ id: 'Problem' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const ClientMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Client' })
    const FilesFieldLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Files' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ClassifierMessage = intl.formatMessage({ id: 'Classifier' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const SectionName = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorName = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const Deadline = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const ToCompleteMessage = intl.formatMessage({ id: 'ticket.deadline.ToComplete' })
    const LessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.LessThenDay' })
    const OverdueMessage = intl.formatMessage({ id: 'ticket.deadline.Overdue' })

    const propertyWasDeleted = !(ticket.property)
    const ticketDeadline = ticket.deadline ? dayjs(ticket.deadline) : null
    const ticketUnit = ticket.unitName ? `${ShortFlatNumber} ${ticket.unitName}` : ''
    const ticketSectionAndFloor = ticket.sectionName && ticket.floorName
        ? `(${SectionName.toLowerCase()} ${ticket.sectionName}, ${FloorName.toLowerCase()} ${ticket.floorName})`
        : ''

    const { objs: files } = TicketFile.useObjects({
        where: { ticket: { id: ticket ? ticket.id : null } },
    }, {
        fetchPolicy: 'network-only',
    })

    const ticketOrganizationId = get(ticket, ['organization', 'id'], null)
    const ticketExecutorUserId = get(ticket, ['executor', 'id'], null)
    const ticketAssigneeUserId = get(ticket, ['assignee', 'id'], null)

    const { obj: executor } = OrganizationEmployee.useObject({
        where: {
            organization: {
                id: ticketOrganizationId,
            },
            user: {
                id: ticketExecutorUserId,
            },
        },
    })

    const { obj: assignee } = OrganizationEmployee.useObject({
        where: {
            organization: {
                id: ticketOrganizationId,
            },
            user: {
                id: ticketAssigneeUserId,
            },
        },
    })

    const getTicketDeadlineMessage = useCallback(() => {
        const deadlineType = getDeadlineType(ticketDeadline)
        const { moreThanDayDiff, overdueDiff } = getHumanizeDeadlineDateDifference(ticketDeadline)

        switch (deadlineType) {
            case TicketDeadlineType.MORE_THAN_DAY: {
                return (
                    <Typography.Text type={'warning'} strong>
                        ({ToCompleteMessage.replace('{days}', moreThanDayDiff)})
                    </Typography.Text>
                )
            }
            case TicketDeadlineType.LESS_THAN_DAY: {
                return (
                    <Typography.Text type={'warning'} strong>
                        ({LessThenDayMessage})
                    </Typography.Text>
                )
            }
            case TicketDeadlineType.OVERDUE: {
                return (
                    <Typography.Text type={'danger'} strong>
                        ({OverdueMessage.replace('{days}', overdueDiff)})
                    </Typography.Text>
                )
            }
        }

    }, [LessThenDayMessage, OverdueMessage, ToCompleteMessage, ticketDeadline])

    const ticketClassifierNames = useMemo(() => compact([
        get(ticket, ['placeClassifier', 'name']),
        get(ticket, ['categoryClassifier', 'name']),
        get(ticket, ['problemClassifier', 'name']),
    ]), [ticket])

    const getClassifierTextType = useCallback(
        (index: number): BaseType => index !== ticketClassifierNames.length - 1 ? null : 'secondary',
        [ticketClassifierNames.length])

    const { streetPart, renderPostfix } = getAddressDetails({ address: ticket.propertyAddress, addressMeta: ticket.propertyAddressMeta })

    const TicketUnitMessage = useCallback(() => (
        <Typography.Paragraph style={{ margin: 0 }}>
            <Typography.Text strong>{ticketUnit}&nbsp;</Typography.Text>
            <Typography.Text>{ticketSectionAndFloor}</Typography.Text>
        </Typography.Paragraph>
    ), [ticketSectionAndFloor, ticketUnit])

    const DeletedPropertyAddressMessage = useCallback(() => (
        <>
            <Typography.Paragraph style={{ margin: 0 }} type={'secondary'}>
                {renderPostfix}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ margin: 0 }} type={'secondary'}>
                {streetPart}
            </Typography.Paragraph>
            {
                ticketUnit && (
                    <Typography.Text type={'secondary'}>
                        <TicketUnitMessage />
                    </Typography.Text>

                )
            }
            <Typography.Text type={'secondary'}>
                ({ DeletedMessage })
            </Typography.Text>
        </>
    ), [DeletedMessage, TicketUnitMessage, renderPostfix, streetPart, ticketUnit])

    const PropertyAddressMessage = useCallback(() => (
        <>
            <Typography.Paragraph style={{ margin: 0 }} type={'secondary'}>
                {renderPostfix}
            </Typography.Paragraph>
            <Link href={`/property/${get(ticket, ['property', 'id'])}`}>
                <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                    {streetPart}
                </Typography.Link>
            </Link>
            {ticketUnit && <TicketUnitMessage />}
        </>
    ), [TicketUnitMessage, renderPostfix, streetPart, ticket, ticketUnit])

    return (
        <Col span={24}>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        {
                            ticketDeadline ? (
                                <PageFieldRow title={Deadline}>
                                    <Typography.Text strong> {dayjs(ticketDeadline).format('DD MMMM YYYY')} </Typography.Text>
                                    {getTicketDeadlineMessage()}
                                </PageFieldRow>
                            ) : null
                        }
                        <PageFieldRow title={AddressMessage} highlight>
                            {
                                propertyWasDeleted ? (
                                    <DeletedPropertyAddressMessage />
                                ) : <PropertyAddressMessage />
                            }
                        </PageFieldRow>
                        <PageFieldRow title={ClientMessage} highlight>
                            <Link href={`/contact/${get(ticket, ['contact', 'id'])}`}>
                                <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                                    <TicketUserInfoField
                                        user={{
                                            name: get(ticket, 'clientName'),
                                            phone: get(ticket, 'clientPhone'),
                                        }}
                                    />
                                </Typography.Link>
                            </Link>
                        </PageFieldRow>
                        <PageFieldRow title={TicketInfoMessage}>
                            {ticket.details}
                        </PageFieldRow>
                        {!isEmpty(files) && (
                            <PageFieldRow title={FilesFieldLabel}>
                                <TicketFileList files={files} />
                            </PageFieldRow>
                        )}
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <PageFieldRow title={ClassifierMessage}>
                            <Breadcrumb separator="»">
                                {
                                    ticketClassifierNames.map((name, index) => {
                                        return (
                                            <Breadcrumb.Item key={name}>
                                                <Typography.Text
                                                    style={CLASSIFIER_VALUE_STYLE}
                                                    strong
                                                    type={getClassifierTextType(index)}
                                                >
                                                    {name}
                                                </Typography.Text>
                                            </Breadcrumb.Item>
                                        )
                                    })
                                }
                            </Breadcrumb>
                        </PageFieldRow>
                        <PageFieldRow title={ExecutorMessage}>
                            <Link href={`/employee/${get(executor, 'id')}`}>
                                <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                                    <Typography.Text strong>
                                        <TicketUserInfoField user={{
                                            name: get(executor, 'name'),
                                            phone: get(executor, 'phone'),
                                            email: get(executor, 'email'),
                                        }}/>
                                    </Typography.Text>
                                </Typography.Link>
                            </Link>
                        </PageFieldRow>
                        <PageFieldRow title={AssigneeMessage}>
                            <Link href={`/employee/${get(executor, 'id')}`}>
                                <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                                    <Typography.Text strong>
                                        <TicketUserInfoField user={{
                                            name: get(assignee, 'name'),
                                            phone: get(assignee, 'phone'),
                                            email: get(assignee, 'email'),
                                        }}/>
                                    </Typography.Text>
                                </Typography.Link>
                            </Link>
                        </PageFieldRow>
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
    const ChangedMessage = intl.formatMessage({ id: 'Changed' })
    const TimeHasPassedMessage = intl.formatMessage({ id: 'TimeHasPassed' })
    const DaysShortMessage = intl.formatMessage({ id: 'DaysShort' })
    const HoursShortMessage = intl.formatMessage({ id: 'HoursShort' })
    const MinutesShortMessage = intl.formatMessage({ id: 'MinutesShort' })
    const LessThanMinuteMessage = intl.formatMessage({ id: 'LessThanMinute' })

    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const { isSmall } = useLayoutContext()

    // NOTE: cast `string | string[]` to `string`
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchTicket, loading, obj: ticket, error } = Ticket.useObject({
        where: { id: id },
    }, {
        fetchPolicy: 'network-only',
    })
    // TODO(antonal): get rid of separate GraphQL query for TicketChanges
    const ticketChangesResult = TicketChange.useObjects({
        where: { ticket: { id } },
        // TODO(antonal): fix "Module not found: Can't resolve '@condo/schema'"
        // sortBy: [SortTicketChangesBy.CreatedAtDesc],
        // @ts-ignore
        sortBy: ['createdAt_DESC'],
    }, {
        fetchPolicy: 'network-only',
    })

    const { objs: comments, refetch: refetchComments } = TicketComment.useObjects({
        where: { ticket: { id } },
        // @ts-ignore
        sortBy: ['createdAt_DESC'],
    })
    const updateComment = TicketComment.useUpdate({})
    const deleteComment = TicketComment.useSoftDelete({}, () => {
        refetchComments()
    })

    const createCommentAction = TicketComment.useCreate({
        ticket: id,
        user: auth.user && auth.user.id,
    }, () => { refetchComments() })

    const canShareTickets = get(employee, 'role.canShareTickets')
    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [ticket])
    const TicketCreationDate = useMemo(() => getTicketCreateMessage(intl, ticket), [ticket])

    useEffect(() => {
        const handler = setInterval(refetchComments, COMMENT_RE_FETCH_INTERVAL)
        return () => {
            clearInterval(handler)
        }
    })

    const isEmergency = get(ticket, 'isEmergency')
    const isPaid = get(ticket, 'isPaid')
    const isWarranty = get(ticket, 'isWarranty')

    const handleTicketStatusChanged = () => {
        refetchTicket()
        ticketChangesResult.refetch()
    }

    const ticketStatusType = get(ticket, ['status', 'type'])
    const disabledEditButton = useMemo(() => ticketStatusType === CLOSED_STATUS_TYPE, [ticketStatusType])
    const statusUpdatedAt = get(ticket, 'statusUpdatedAt')

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
                                                                {SourceMessage} — {get(ticket, ['source', 'name'])}
                                                            </Typography.Text>
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
                                    </Space>
                                </Col>
                                <TicketContent ticket={ticket}/>
                                <ActionBar style={!isSmall && { left: '-24px' }}>
                                    <Link href={`/ticket/${ticket.id}/update`}>
                                        <Button
                                            disabled={disabledEditButton}
                                            color={'green'}
                                            type={'sberDefaultGradient'}
                                            secondary
                                            icon={<EditFilled />}
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
                                    // @ts-ignore
                                    createAction={createCommentAction}
                                    comments={comments}
                                    canCreateComments={get(auth, ['user', 'isAdmin']) || get(employee, ['role', 'canManageTicketComments'])}
                                    actionsFor={comment => {
                                        const isAuthor = comment.user.id === auth.user.id
                                        const isAdmin = get(auth, ['user', 'isAdmin'])
                                        return {
                                            updateAction: isAdmin || isAuthor ? updateComment : null,
                                            deleteAction: isAdmin || isAuthor ? deleteComment : null,
                                        }
                                    }}
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

TicketIdPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.ControlRoom' }} path={'/ticket'}/>
TicketIdPage.requiredAccess = OrganizationRequired

export default TicketIdPage
