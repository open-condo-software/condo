/* eslint-disable @typescript-eslint/no-empty-function */
import { Col, Row, Space, Typography, Tag, Affix } from 'antd'
import UploadList from 'antd/lib/upload/UploadList/index'
import { get, isEmpty } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { EditFilled, FilePdfFilled } from '@ant-design/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
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
import { LETTERS_AND_NUMBERS } from '@condo/domains/common/constants/regexps'
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

// TODO(Dimitreee):move to global defs
interface IUser {
    name?: string
    id?: string
    phone?: string
}

interface ITicketDescriptionFieldProps {
    title?: string
    value?: React.ReactNode
    type?: 'secondary' | 'success' | 'warning' | 'danger'
}

const TicketDescriptionField: React.FC<ITicketDescriptionFieldProps> = ({ title, value, type }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    return (
        <Space
            direction={'vertical'}
            size={8}
            style={{ maxWidth: '100%' }}
        >
            <Typography.Text type={'secondary'}>{title}</Typography.Text>
            <Typography.Text {...{ type }} style={{ fontSize: '16px' }}>{value || NotDefinedMessage}</Typography.Text>
        </Space>
    )
}

interface ITicketFileListProps {
    files?: TicketFile.ITicketFileUIState[]
}

const TicketFileList: React.FC<ITicketFileListProps> = ({ files }) => {
    const intl = useIntl()
    const FilesFieldLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Files' })
    const uploadFiles = files.map(({ file }) => {
        const fileInList = {
            uid: file.id,
            name: file.originalFilename,
            status: 'done' as UploadFileStatus,
            url: file.publicUrl,
        }
        return fileInList
    })
    const FilesFieldValue = (
        <div className={'upload-control-wrapper'}>
            <UploadList locale={{}} showRemoveIcon={false} items={uploadFiles} />
        </div>
    )
    return (
        <Row style={{ paddingTop: '20px' }}>
            <Col span={24}>
                <TicketDescriptionField title={FilesFieldLabel} value={FilesFieldValue} />
            </Col>
        </Row>
    )
}

interface ITicketUserInfoFieldProps {
    title?: string
    user?: IUser
    hidePersonalData?: boolean
}

const TicketUserInfoField: React.FC<ITicketUserInfoFieldProps> = (props) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })
    const PhoneNotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefinedShort' })
    const PhoneShortMessage = intl.formatMessage({ id: 'errors.PhoneShort' })
    const ShowMessage = intl.formatMessage({ id: 'Show' })
    const HideMessage = intl.formatMessage({ id: 'Hide' })

    const [userInfo, setUserInfo] = useState({
        name: get(props, ['user', 'name']),
        phone: get(props, ['user', 'phone']),
    })
    const [hidden, setHidden] = useState(props.hidePersonalData)

    useEffect(() => {
        let nextUserName = get(props, ['user', 'name'], '')
        let nextUserPhone = get(props, ['user', 'phone'], '')

        if (hidden) {
            nextUserName = nextUserName ? nextUserName.replace(LETTERS_AND_NUMBERS, '*') : ''
            nextUserPhone = nextUserPhone ? nextUserPhone.replace(LETTERS_AND_NUMBERS, '*') : ''
        }

        setUserInfo({
            name: nextUserName,
            phone: nextUserPhone,
        })
    }, [hidden])

    const toggleUserInfoVisibility = () => setHidden(!hidden)
    const showPersonalInfoButtonControl = (userInfo.name || userInfo.phone) && props.hidePersonalData

    return (
        <Col style={{ paddingRight: '10px' }}>
            <Typography.Text type={'secondary'}>{props.title}</Typography.Text>
            <Col style={{ fontSize: '16px', margin: '0' }}>
                {userInfo.name
                    ? (
                        <UserNameField user={{ name: userInfo.name, id: props.user.id }}>
                            {({ name, postfix }) => (
                                <Typography.Paragraph ellipsis={true} title={name} style={{ margin: '5px 0' }}>
                                    {name}
                                    {postfix && <Typography.Text type='secondary'>&nbsp;{postfix}</Typography.Text>}
                                </Typography.Paragraph>
                            )}
                        </UserNameField>
                    )
                    : NotDefinedMessage
                }
                {userInfo.phone
                    ? (<Typography.Text>{PhoneShortMessage} <Typography.Text>{userInfo.phone}</Typography.Text></Typography.Text>)
                    : `${PhoneShortMessage} ${PhoneNotDefinedMessage}`
                }
                {showPersonalInfoButtonControl && (
                    <Typography.Paragraph>
                        (
                        <Button type={'inlineLink'} onClick={toggleUserInfoVisibility}>
                            {String(hidden ? ShowMessage : HideMessage).toLowerCase()}
                        </Button>
                        )
                    </Typography.Paragraph>
                )}
            </Col>
        </Col>
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
    const ClientInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const FullNameShortMessage = intl.formatMessage({ id: 'field.FullName.short' })
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
        user: auth.user.id,
    }, () => { refetchComments() })

    const { link } = useOrganization()

    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [ticket])
    const TicketCreationDate = useMemo(() => getTicketCreateMessage(intl, ticket), [ticket])

    if (!ticket) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={error ? ServerErrorMessage : null}/>
        )
    }

    const ticketAddress = get(ticket, ['property', 'address'])
        + (ticket.sectionName && ticket.floorName ? `, ${SectionName} ${ticket.sectionName}, ${FloorName} ${ticket.floorName}` : '')
        + (ticket.unitName ? `, ${ShortFlatNumber} ${ticket.unitName}` : '')
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
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[0, 40]}>
                            <Col span={16}>
                                <Row gutter={[0, 40]}>
                                    <Col span={24}>
                                        <Row>
                                            <Col span={12}>
                                                <Row align={'top'}>
                                                    <Space size={8} direction={'vertical'}>
                                                        <Space align={'center'}>
                                                            <Typography.Title level={1} style={{ margin: 0 }}>{TicketTitleMessage}</Typography.Title>
                                                            <Space direction={'vertical'}>
                                                                {isEmergency && <TicketTag color={'red'}>{EmergencyMessage.toLowerCase()}</TicketTag>}
                                                                {isPaid && <TicketTag color={'orange'}>{PaidMessage.toLowerCase()}</TicketTag>}
                                                            </Space>
                                                        </Space>
                                                        <Typography.Text>
                                                            <Typography.Text type='secondary'>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                                                            <UserNameField user={get(ticket, ['createdBy'])}>
                                                                {({ name, postfix }) => (
                                                                    <Typography.Text>
                                                                        <Typography.Text ellipsis>{name}</Typography.Text>
                                                                        {postfix && <Typography.Text type='secondary' ellipsis>&nbsp;{postfix}</Typography.Text>}
                                                                    </Typography.Text>
                                                                )}
                                                            </UserNameField>
                                                        </Typography.Text>
                                                    </Space>
                                                </Row>
                                            </Col>
                                            <Col span={12}>
                                                <Row justify={'end'}>
                                                    <TicketStatusSelect ticket={ticket} onUpdate={handleTicketStatusChanged} loading={loading}/>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Row>
                                            <Col span={6}>
                                                <TicketDescriptionField
                                                    title={SourceMessage}
                                                    value={get(ticket, ['source', 'name'])}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <TicketDescriptionField
                                                    title={ClassifierMessage}
                                                    value={get(ticket, ['classifier', 'name'])}
                                                />
                                            </Col>
                                            <Col span={6} >
                                                <TicketUserInfoField
                                                    title={ExecutorMessage}
                                                    user={get(ticket, ['executor'])}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <TicketUserInfoField
                                                    title={AssigneeMessage}
                                                    user={get(ticket, ['assignee'])}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                    <FocusContainer>
                                        <Col span={24}>
                                            <Row gutter={[0, 24]}>
                                                <Col span={24}>
                                                    <Typography.Title level={5}>{ClientInfoMessage}</Typography.Title>
                                                </Col>
                                                <Col span={24}>
                                                    <Row gutter={[12, 12]}>
                                                        <Col span={6}>
                                                            <TicketDescriptionField
                                                                title={AddressMessage}
                                                                value={ticketAddress}
                                                                type={'success'}
                                                            />
                                                        </Col>
                                                        <Col span={7}>
                                                            <TicketUserInfoField
                                                                hidePersonalData
                                                                title={FullNameShortMessage}
                                                                user={{
                                                                    name: ticket.clientName,
                                                                    phone: ticket.clientPhone,
                                                                }}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Row gutter={[0, 8]} style={{ maxWidth: '100%' }}>
                                                    <Col span={24}>
                                                        <Typography.Title level={5} style={{ margin: 0 }}>{TicketInfoMessage}</Typography.Title>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Typography.Text style={{ fontSize: '24px', wordWrap: 'break-word' }}>{ticket.details}</Typography.Text>
                                                        {
                                                            !isEmpty(files) && (
                                                                <TicketFileList files={files} />
                                                            )
                                                        }
                                                    </Col>
                                                </Row>
                                            </Row>
                                        </Col>
                                    </FocusContainer>
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
                                        loading={ticketChangesResult.loading}
                                        items={ticketChangesResult.objs}
                                        total={ticketChangesResult.count}
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
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

TicketIdPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllTickets' }} path={'/ticket/'}/>

export default TicketIdPage
