import { Col, Row, Space, Typography, Tag, Affix, Breadcrumb } from 'antd'
import UploadList from 'antd/lib/upload/UploadList/index'
import { get, isEmpty, compact } from 'lodash'
import React, { useEffect, useMemo } from 'react'
import { EditFilled, FilePdfFilled } from '@ant-design/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Ticket, TicketChange, TicketFile, TicketComment } from '@condo/domains/ticket/utils/clientSchema'
import Link from 'next/link'
import { TicketStatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import {
    getTicketCreateMessage,
    getTicketTitleMessage,
} from '@condo/domains/ticket/utils/helpers'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { UploadFileStatus } from 'antd/lib/upload/interface'
import { TicketChanges } from '@condo/domains/ticket/components/TicketChanges'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Comments } from '@condo/domains/common/components/Comments'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { User } from '@app/condo/schema'

const COMMENT_RE_FETCH_INTERVAL = 5 * 1000

interface ITicketFileListProps {
    files?: TicketFile.ITicketFileUIState[]
}

const UploadListWrapperStyles = css`
  .ant-upload-list-text-container:first-child .ant-upload-list-item {
    margin-top: 0;
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
  font-size: ${fontSizes.content};
  line-height: 24px;
`

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

    const propertyWasDeleted = !!get(ticket, ['property', 'deletedAt'])

    const ticketUnit = ticket.unitName ? `, ${ShortFlatNumber} ${ticket.unitName}` : ''
    const ticketAddress = get(ticket, ['property', 'address']) + ticketUnit
    const ticketAddressExtra = ticket.sectionName && ticket.floorName
        ? `${SectionName.toLowerCase()} ${ticket.sectionName}, ${FloorName.toLowerCase()} ${ticket.floorName}`
        : ''

    const { objs: files } = TicketFile.useObjects({
        where: { ticket: { id: ticket ? ticket.id : null } },
    }, {
        fetchPolicy: 'network-only',
    })
    const { isSmall } = useLayoutContext()

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <PageFieldRow title={AddressMessage} highlight>
                    {propertyWasDeleted ?
                        <Typography.Text type={'secondary'}>{ ticketAddress } ({ DeletedMessage })</Typography.Text> :
                        <Link href={`/property/${get(ticket, ['property', 'id'])}`}>
                            <Typography.Link>
                                {ticketAddress}
                                {ticketAddressExtra && (
                                    <>
                                        <br/>
                                        <Typography.Text>
                                            {ticketAddressExtra}
                                        </Typography.Text>
                                    </>
                                )}
                            </Typography.Link>
                        </Link>
                    }
                </PageFieldRow>
                <PageFieldRow title={ClientMessage} highlight>
                    <Link href={`/contact/${get(ticket, ['contact', 'id'])}`}>
                        <Typography.Link>
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
            <FocusContainer style={{ marginTop: '1.6em' }} margin={isSmall ? '0' :  '0 -24px'}>
                <Row gutter={[0, 8]}>
                    <PageFieldRow title={ExecutorMessage}>
                        <TicketUserInfoField user={get(ticket, ['executor'])}/>
                    </PageFieldRow>
                    <PageFieldRow title={AssigneeMessage}>
                        <TicketUserInfoField user={get(ticket, ['assignee'])}/>
                    </PageFieldRow>
                    <PageFieldRow title={ClassifierMessage}>
                        <Breadcrumb separator="≫">
                            {
                                compact([
                                    get(ticket, ['placeClassifier', 'name']),
                                    get(ticket, ['categoryClassifier', 'name']),
                                    get(ticket, ['problemClassifier', 'name']),
                                ]).map(name => {
                                    return (
                                        <Breadcrumb.Item key={name}>{name}</Breadcrumb.Item>
                                    )
                                })
                            }
                        </Breadcrumb>
                    </PageFieldRow>
                </Row>
            </FocusContainer>
        </Col>
    )
}

export const TicketPageContent = ({ organization, employee, TicketContent }) => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const PrintMessage = intl.formatMessage({ id: 'Print' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const TicketAuthorMessage = intl.formatMessage({ id: 'Author' })
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' })

    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const { isSmall } = useLayoutContext()

    // NOTE: cast `string | string[]` to `string`
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchTicket, loading, obj: ticket, error } = Ticket.useObject({
        where: { id: id, property: { OR: [{ deletedAt: null }, { deletedAt_not: null }] }, deletedAt: null },
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

    if (!ticket) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={error ? ServerErrorMessage : null}/>
        )
    }

    const isEmergency = get(ticket, 'isEmergency')
    const isPaid = get(ticket, 'isPaid')

    const handleTicketStatusChanged = () => {
        refetchTicket()
        ticketChangesResult.refetch()
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
                                            <Space size={8} direction={'vertical'}>
                                                <Typography.Title level={1} style={{ margin: 0 }}>{TicketTitleMessage}</Typography.Title>
                                                <Typography.Text>
                                                    <Typography.Text type='secondary'>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                                                    <UserNameField user={get(ticket, ['createdBy'])}>
                                                        {({ name, postfix }) => (
                                                            <Typography.Text>
                                                                {name}
                                                                {postfix && <Typography.Text type='secondary' ellipsis>&nbsp;{postfix}</Typography.Text>}
                                                            </Typography.Text>
                                                        )}
                                                    </UserNameField>
                                                </Typography.Text>
                                                <Typography.Text type='secondary'>
                                                    {SourceMessage} — {get(ticket, ['source', 'name'])}
                                                </Typography.Text>
                                            </Space>
                                        </Col>
                                        <Col lg={6} xs={24}>
                                            <Row justify={isSmall ? 'center' : 'end'}>
                                                <TicketStatusSelect
                                                    organization={organization}
                                                    employee={employee}
                                                    ticket={ticket}
                                                    onUpdate={handleTicketStatusChanged}
                                                    loading={loading}
                                                />
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Space direction={'horizontal'} style={{ marginTop: '1.6em ' }}>
                                        {isEmergency && <TicketTag color={'red'}>{EmergencyMessage.toLowerCase()}</TicketTag>}
                                        {isPaid && <TicketTag color={'orange'}>{PaidMessage.toLowerCase()}</TicketTag>}
                                    </Space>
                                </Col>
                                <TicketContent ticket={ticket}/>
                                <ActionBar>
                                    <Link href={`/ticket/${ticket.id}/update`}>
                                        <Button
                                            color={'green'}
                                            type={'sberPrimary'}
                                            secondary
                                            icon={<EditFilled />}
                                        >
                                            {UpdateMessage}
                                        </Button>
                                    </Link>
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
                                    {
                                        !isSmall && (
                                            <Button
                                                type={'sberPrimary'}
                                                icon={<FilePdfFilled />}
                                                href={`/ticket/${ticket.id}/pdf`}
                                                target={'_blank'}
                                                secondary
                                            >
                                                {PrintMessage}
                                            </Button>
                                        )
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

TicketIdPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllTickets' }} path={'/ticket'}/>
TicketIdPage.requiredAccess = OrganizationRequired

export default TicketIdPage
