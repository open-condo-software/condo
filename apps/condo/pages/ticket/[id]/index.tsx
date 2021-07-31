/* eslint-disable @typescript-eslint/no-empty-function */
import { Col, Row, Space, Typography, Tag, Affix, Breadcrumb } from 'antd'
import UploadList from 'antd/lib/upload/UploadList/index'
import { get, isEmpty, compact } from 'lodash'
import React, { useMemo } from 'react'
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
// @ts-ignore
import { TicketChanges } from '@condo/domains/ticket/components/TicketChanges'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Comments } from '@condo/domains/common/components/Comments'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { ShareTicketModal } from '@condo/domains/ticket/components/ShareTicketModal'

// TODO(Dimitreee):move to global defs
interface IUser {
    name?: string
    id?: string
    phone?: string
}

interface ITicketFileListProps {
    files?: TicketFile.ITicketFileUIState[]
}

const UploadListWrapperStyles = css`
    .ant-upload-list-text-container:first-child .ant-upload-list-item {
        margin-top: 0;
    }
`

const TicketFileList: React.FC<ITicketFileListProps> = ({ files }) => {
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
    user?: IUser
}

const TicketUserInfoField: React.FC<ITicketUserInfoFieldProps> = (props) => {
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

interface ITicketFieldRowProps {
    title: string
    style?: React.CSSProperties
    highlight?: boolean
    children: React.ReactNode
}

const TicketFieldRow: React.FC<ITicketFieldRowProps> = ({ title, children, highlight, style }) => {
    return (
        <>
            <Col span={8} style={{ fontSize: '16px' }}>
                {title}
            </Col>
            <Col span={16} style={{ fontSize: '16px' }}>
                <Typography.Text
                    type={highlight ? 'success' : null}
                    style={{ wordWrap: 'break-word' }}
                >
                    {children}
                </Typography.Text>
            </Col>
        </>
    )
}

const TicketTag = styled(Tag)`
  font-size: 16px;
  line-height: 24px;
`

const TicketIdPage = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const PrintMessage = intl.formatMessage({ id: 'Print' })
    const TicketInfoMessage = intl.formatMessage({ id: 'Problem' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const ClientMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Client' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ClassifierMessage = intl.formatMessage({ id: 'Classifier' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const TicketAuthorMessage = intl.formatMessage({ id: 'Author' })
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const SectionName = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorName = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' })
    const FilesFieldLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Files' })

    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }

    // NOTE: cast `string | string[]` to `string`
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { refetch: refetchTicket, loading, obj: ticket, error } = Ticket.useObject({
        where: { id },
    }, {
        fetchPolicy: 'network-only',
    })
    const { objs: files } = TicketFile.useObjects({
        where: { ticket: { id: id } },
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
        sortBy: ['createdAt_ASC'],
    })
    const updateComment = TicketComment.useUpdate({}, () => {})
    const deleteComment = TicketComment.useSoftDelete({}, () => {})

    const createCommentAction = TicketComment.useCreate({
        ticket: id,
        user: auth.user && auth.user.id,
    }, () => { refetchComments() })

    const { link, organization } = useOrganization()
    console.log(get(link, 'role'))
    const canShareTickets = get(link, 'role.canShareTickets')
    console.log(canShareTickets)
    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [ticket])
    const TicketCreationDate = useMemo(() => getTicketCreateMessage(intl, ticket), [ticket])

    if (!ticket) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={error ? ServerErrorMessage : null}/>
        )
    }

    const ticketUnit = ticket.unitName ? `, ${ShortFlatNumber} ${ticket.unitName}` : ''
    const ticketAddress = get(ticket, ['property', 'address']) + ticketUnit
    const ticketAddressExtra = ticket.sectionName && ticket.floorName
        ? `${SectionName.toLowerCase()} ${ticket.sectionName}, ${FloorName.toLowerCase()} ${ticket.floorName}`
        : ''

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
                        <Col span={16}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Row>
                                        <Col span={18}>
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
                                        <Col span={6}>
                                            <Row justify={'end'}>
                                                <TicketStatusSelect ticket={ticket} onUpdate={handleTicketStatusChanged} loading={loading}/>
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Space direction={'horizontal'} style={{ marginTop: '1.6em ' }}>
                                        {isEmergency && <TicketTag color={'red'}>{EmergencyMessage.toLowerCase()}</TicketTag>}
                                        {isPaid && <TicketTag color={'orange'}>{PaidMessage.toLowerCase()}</TicketTag>}
                                    </Space>
                                </Col>
                                <Col span={24}>
                                    <Row style={{ rowGap: '1.6em' }}>
                                        <TicketFieldRow title={AddressMessage} highlight>
                                            {ticketAddress}
                                            {ticketAddressExtra && (
                                                <>
                                                    <br/>
                                                    <Typography.Text>
                                                        {ticketAddressExtra}
                                                    </Typography.Text>
                                                </>
                                            )}
                                        </TicketFieldRow>
                                        <TicketFieldRow title={ClientMessage} highlight>
                                            <TicketUserInfoField
                                                user={{
                                                    name: get(ticket, 'clientName'),
                                                    phone: get(ticket, 'clientPhone'),
                                                }}
                                            />
                                        </TicketFieldRow>
                                        <TicketFieldRow title={TicketInfoMessage}>
                                            {ticket.details}
                                        </TicketFieldRow>
                                        {!isEmpty(files) && (
                                            <TicketFieldRow title={FilesFieldLabel}>
                                                <TicketFileList files={files} />
                                            </TicketFieldRow>
                                        )}
                                    </Row>
                                    <FocusContainer style={{ marginTop: '1.6em' }}>
                                        <Row style={{ rowGap: '1.6em' }}>
                                            <TicketFieldRow title={ExecutorMessage} highlight>
                                                <TicketUserInfoField
                                                    user={get(ticket, ['executor'])}
                                                />
                                            </TicketFieldRow>
                                            <TicketFieldRow title={AssigneeMessage} highlight>
                                                <TicketUserInfoField
                                                    user={get(ticket, ['assignee'])}
                                                />
                                            </TicketFieldRow>
                                            <TicketFieldRow title={ClassifierMessage}>
                                                <Breadcrumb separator="≫">
                                                    {
                                                        compact([
                                                            // TODO(zuch): remove classifier after migrations
                                                            get(ticket, ['classifier', 'name']),
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
                                            </TicketFieldRow>
                                        </Row>
                                    </FocusContainer>
                                </Col>
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
                                    {canShareTickets ? <ShareTicketModal
                                        date={get(ticket, 'createdAt')}
                                        number={get(ticket, 'number')}
                                        details={get(ticket, 'details')}
                                        id={id}
                                        locale={get(organization, 'country')}
                                    /> : null}
                                    <Button
                                        type={'sberPrimary'}
                                        icon={<FilePdfFilled />}
                                        href={`/ticket/${ticket.id}/pdf`}
                                        target={'_blank'}
                                        secondary
                                    >
                                        {PrintMessage}
                                    </Button>
                                </ActionBar>
                                <TicketChanges
                                    loading={get(ticketChangesResult, 'loading')}
                                    items={get(ticketChangesResult, 'objs')}
                                    total={get(ticketChangesResult, 'count')}
                                />
                            </Row>
                        </Col>
                        <Col span={1}>
                        </Col>
                        <Col span={7}>
                            <Affix offsetTop={40}>
                                <Comments
                                    // @ts-ignore
                                    createAction={createCommentAction}
                                    comments={comments}
                                    canCreateComments={get(auth, ['user', 'isAdmin']) || get(link, ['role', 'canManageTicketComments'])}
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

TicketIdPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllTickets' }} path={'/ticket/'}/>
TicketIdPage.requiredAccess = OrganizationRequired

export default TicketIdPage
