import { Col, Row, Typography, Space, notification } from 'antd'
import get from 'lodash/get'
import dynamic from 'next/dynamic'
import React, { useEffect, useRef } from 'react'
import { useIntl } from '@core/next/intl'
import { colors } from '../../../constants/style'
import { FocusContainer } from '../../../components/FocusContainer'

import {
    formatPhone,
    getTicketCreateMessage,
    getTicketLabel,
    getTicketPdfName,
    getTicketTitleMessage,
} from '../../../utils/ticket'
import { createPdf } from '../../../utils/pdf'
import { useRouter } from 'next/router'
import { Ticket } from '../../../utils/clientSchema/Ticket'
import LoadingOrErrorPage from '../../../containers/LoadingOrErrorPage'
import { PageContent } from '../../../containers/BaseLayout'

interface ITicketDescriptionFieldProps {
    title?: string
    value?: React.ReactNode
}

const TicketDescriptionField:React.FC<ITicketDescriptionFieldProps> = ({ title, value }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    return (
        <Space direction={'vertical'} size={8}>
            <Typography.Text type={'secondary'}>{title}</Typography.Text>
            <Typography.Text style={{ fontSize: '16px' }}>{value || NotDefinedMessage}</Typography.Text>
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

const TicketUserInfoField:React.FC<ITicketUserInfoFieldProps> = ({ title, user = {} }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })
    const PhoneNotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefinedShort' })
    const PhoneShortMessage = intl.formatMessage({ id: 'errors.PhoneShort' })

    const name = get(user, 'name')
    const phone = get(user, 'phone')

    return (
        <Space direction={'vertical'} size={8}>
            <Typography.Text type={'secondary'}>{title}</Typography.Text>
            <Space size={4} direction={'vertical'} style={{ fontSize: '16px' }}>
                {name
                    ? <Typography.Text >{name}</Typography.Text>
                    : NotDefinedMessage
                }
                {phone
                    ? (
                        <Typography.Text>
                            { PhoneShortMessage} <Typography.Text >{formatPhone(phone)}</Typography.Text>
                        </Typography.Text>
                    )
                    : `${PhoneShortMessage} ${PhoneNotDefinedMessage}`
                }
            </Space>
        </Space>
    )
}

const PdfView = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const TicketInfoMessage = intl.formatMessage({ id: 'Problem' })
    const TicketAuthorMessage = intl.formatMessage({ id: 'Author' })
    const ClientInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const FullNameMessage = intl.formatMessage({ id: 'field.FullName' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ClassifierMessage = intl.formatMessage({ id: 'Classifier' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const NotesMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.Notes' })
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })

    const containerRef = useRef(null)

    const router = useRouter()
    const { query: { id } } = router
    const { refetch, loading, obj: ticket, error } = Ticket.useObject({ where: { id } })

    useEffect(() => {
        if (ticket) {
            refetch()
            createPdf({ element: containerRef.current, fileName: getTicketPdfName(intl, ticket) }).catch((e) => {
                notification.error({
                    message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                    description: e.message,
                })
            })
        }
    },[ticket])

    const TicketTitleMessage = getTicketTitleMessage(intl, ticket)

    if (error || loading || !ticket) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={ServerErrorMessage}/>
        )
    }

    const TicketCreationDate = getTicketCreateMessage(intl, ticket)
    const ticketAddress = get(ticket, ['property', 'address']) + (ticket.unitName && (', ' + ticket.unitName))
    const isEmergency = get(ticket, 'isEmergency')

    return (
        <Row gutter={[12, 40]} style={{ filter: 'grayscale(1)', maxWidth: '800px', padding: '40px' }} ref={containerRef}>
            <Col span={24}>
                <Row align={'top'}>
                    <Col span={18}>
                        <Typography.Title level={1} style={{ margin: '0 0 16px', whiteSpace: 'pre-line' }} >
                            {`${TicketTitleMessage}
                                ${String(getTicketLabel(intl, ticket)).toLowerCase()}`}
                        </Typography.Title>
                        <Typography.Text>
                            <Typography.Text>{TicketCreationDate}, {TicketAuthorMessage} </Typography.Text>
                            <Typography.Text ellipsis>{get(ticket, ['createdBy', 'name'])}</Typography.Text>
                        </Typography.Text>
                    </Col>
                    <Col span={6}>
                        {isEmergency && (<Typography.Title level={2}>{EmergencyMessage.toLowerCase()}</Typography.Title>)}
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
            <FocusContainer color={colors.black}>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Typography.Title level={5}>{ClientInfoMessage}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[12,12]}>
                                <Col span={6}>
                                    <TicketDescriptionField
                                        title={AddressMessage}
                                        value={ticketAddress}
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
                <Typography.Title level={5}>
                    {NotesMessage}
                </Typography.Title>
            </Col>
        </Row>
    )
}

const DynamicPdfView = dynamic(() => Promise.resolve(PdfView), {
    ssr: false,
})

function TicketPdfPage () {
    return (
        <PageContent>
            <DynamicPdfView/>
        </PageContent>
    )
}

TicketPdfPage.container = ({ children }) => <div style={{ padding: '40px' }}>{children}</div>

export default TicketPdfPage
