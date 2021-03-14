import { Col, Row, Typography, Space } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useMemo, useRef } from 'react'
import { format, formatDuration, intervalToDuration } from 'date-fns'
import { ArrowLeftOutlined, EditFilled, FilePdfFilled } from '@ant-design/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { Button } from '../../../components/Button'
import { PageContent, PageWrapper } from '../../../containers/BaseLayout'
import { yellow } from '@ant-design/colors'
import LoadingOrErrorPage from '../../../containers/LoadingOrErrorPage'
import { Ticket } from '../../../utils/clientSchema/Ticket'
import Link from 'next/link'
import { LinkWithIcon } from '../../../components/LinkWithIcon'
import { TicketStatusSelect } from '../../../components/TicketStatusSelect'
import { colors } from '../../../constants/style'
import { FocusContainer } from '../../../components/FocusContainer'

// TODO:(Dimitreee) move to packages later
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'
import { PdfGenerator } from '../../../components/PdfGenerator'

const LOCALES = {
    ru: RU,
    en: EN,
}

const getTicketCreateMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const formattedCreatedDate = format(
        new Date(ticket.createdAt),
        'dd MMMM HH:mm',
        { locale: LOCALES[intl.locale] }
    )

    return `${intl.formatMessage({ id: 'CreatedDate' })} ${formattedCreatedDate}`
}

const getTicketTitleMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }

    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })} № ${ticket.number}`
}

const getTicketFormattedLastStatusUpdate = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const { createdAt, statusUpdatedAt } = ticket
    const ticketLastUpdateDate = statusUpdatedAt || createdAt

    const formattedDate = ticketLastUpdateDate
        ? formatDuration(
            intervalToDuration({
                start: new Date(ticketLastUpdateDate),
                end: new Date(),
            }),
            { locale: LOCALES[intl.locale], format: ['months', 'days', 'hours', 'minutes'] }
        )
        : ''

    if (ticketLastUpdateDate && !formattedDate) {
        return intl.formatMessage({ id: 'LessThanMinute' })
    }

    return formattedDate
}

const formatPhone = (phone) => phone.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/,'$1 ($2) $3-$4-$5')

interface ITicketDescriptionFieldProps {
    title?: string
    value?: React.ReactNode
    type?: 'secondary' | 'success' | 'warning' | 'danger'
}

const TicketDescriptionField:React.FunctionComponent<ITicketDescriptionFieldProps> = ({ title, value, type }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    return (
        <Space direction={'vertical'} size={8}>
            <Typography.Text type={'secondary'}>{title}</Typography.Text>
            <Typography.Text {...{ type }} style={{ fontSize: '16px' }}>{value || NotDefinedMessage}</Typography.Text>
        </Space>
    )
}

interface ITicketUserInfoFieldProps {
    title?: string
    user?: {
        name: string
        phone?: string
    }
}

const TicketUserInfoField:React.FunctionComponent<ITicketUserInfoFieldProps> = ({ title, user = {} }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })
    const PhoneNotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefinedShort' })
    const PhoneShortMessage = intl.formatMessage({ id: 'errors.PhoneShort' })

    const { name, phone } = user

    return (
        <Space direction={'vertical'} size={8}>
            <Typography.Text type={'secondary'}>{title}</Typography.Text>
            <Space size={4} direction={'vertical'} style={{ fontSize: '16px' }}>
                {name
                    ? <Typography.Text type={'success'}>{name}</Typography.Text>
                    : NotDefinedMessage
                }
                {phone
                    ? (
                        <Typography.Text>
                            { PhoneShortMessage} <Typography.Text type={'success'}>{formatPhone(phone)}</Typography.Text>
                        </Typography.Text>
                    )
                    : `${PhoneShortMessage} ${PhoneNotDefinedMessage}`
                }
            </Space>
        </Space>
    )
}

const TicketIdPage = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const PrintMessage = intl.formatMessage({ id: 'Print' })
    const TicketInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const UserInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.UserInfo' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const FullNameMessage = intl.formatMessage({ id: 'field.FullName' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ClassifierMessage = intl.formatMessage({ id: 'Classifier' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const TicketAuthorMessage = intl.formatMessage({ id: 'Author' })

    const router = useRouter()
    const { query: { id } } = router
    const { refetch, loading, obj: ticket, error } = Ticket.useObject({ where: { id } })
    const ticketElementRef = useRef(null)

    const TicketTitleMessage = useMemo(() => getTicketTitleMessage(intl, ticket), [ticket])
    const TicketCreationDate = useMemo(() => getTicketCreateMessage(intl, ticket), [ticket])
    const formattedStatusUpdate = useMemo(() => getTicketFormattedLastStatusUpdate(intl, ticket), [ticket])

    useEffect(() => {
        refetch()
    },[])

    if (error || loading || !ticket) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={ServerErrorMessage}/>
        )
    }

    const ticketAddress = get(ticket, ['property', 'address']) + (ticket.unitName && (', ' + ticket.unitName))

    return (
        <>
            <Head>
                <title>{TicketTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[12, 40]} ref={ticketElementRef}>
                        <Col span={24}>
                            <Row>
                                <Col span={12}>
                                    <Space size={8} direction={'vertical'}>
                                        <Typography.Title level={1} style={{ margin: 0 }}>{TicketTitleMessage}</Typography.Title>
                                        <Typography.Text>
                                            <Typography.Text type='secondary'>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                                            <Typography.Text type='success' ellipsis>{get(ticket, ['createdBy', 'name'])}</Typography.Text>
                                        </Typography.Text>
                                    </Space>
                                </Col>
                                <Col span={12}>
                                    <Row justify={'end'}>
                                        <Space size={8} direction={'vertical'} align={'end'}>
                                            <TicketStatusSelect ticket={ticket} onUpdate={refetch} loading={loading}/>
                                            <Typography.Text type="warning" style={{ color: yellow[9] }}>{formattedStatusUpdate}</Typography.Text>
                                        </Space>
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
                                <Col span={6}>
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
                                        <Typography.Title level={5}>{UserInfoMessage}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Row gutter={[12,12]}>
                                            <Col span={6}>
                                                <TicketDescriptionField
                                                    title={AddressMessage}
                                                    value={ticketAddress}
                                                    type={'success'}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <TicketUserInfoField
                                                    title={FullNameMessage}
                                                    user={{
                                                        name: ticket.clientName,
                                                        phone: ticket.clientPhone,
                                                    }}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <TicketDescriptionField title={EmailMessage} value={ticket.clientEmail}/>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Typography.Title level={5}>{TicketInfoMessage}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Typography.Text style={{ fontSize: '24px' }}>{ticket.details}</Typography.Text>
                                    </Col>
                                </Row>
                            </Col>
                        </FocusContainer>
                        <Col span={24}>
                            <Space size={40}>
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
                                <PdfGenerator elementRef={ticketElementRef} fileName={'Заявка.pdf'}>
                                    {({ generatePdf, loading }) => (
                                        <Button
                                            type={'sberPrimary'}
                                            icon={<FilePdfFilled />}
                                            onClick={generatePdf}
                                            loading={loading}
                                            disabled={loading}
                                            secondary
                                        >
                                            {PrintMessage}
                                        </Button>
                                    )}
                                </PdfGenerator>
                            </Space>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketIdPage.headerAction = (
    <LinkWithIcon
        icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
        locale={'menu.AllTickets'}
        path={'/ticket/'}
    />
)

export default TicketIdPage
