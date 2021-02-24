import { Button, Select, Row, Col, Typography, Statistic, Divider } from 'antd'
import get from 'lodash/get'
import React, { useMemo } from 'react'
import { format } from 'date-fns'

// TODO: move to packages later
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '../../../containers/BaseLayout'
import LoadingOrErrorPage from '../../../containers/LoadingOrErrorPage'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TicketStatuses, { convertGQLItemToFormSelectState } from '../../../utils/clientSchema/Ticket/Status'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Ticket from '../../../utils/clientSchema/Ticket'
import { runMutation } from '../../../utils/mutations.utils'
import Link from 'next/link'

function TicketStatus ({ ticket, updateTicketStatus }) {
    const { objs: statuses, loading } = TicketStatuses.useObjects()
    const options = useMemo(() => statuses.map(convertGQLItemToFormSelectState), [statuses])
    const handleChange = React.useCallback((value) => updateTicketStatus({ status: value }), [ticket])

    return (
        <Select
            options={options}
            loading={loading}
            onChange={handleChange}
            defaultValue={ticket.status.id}
        />
    )
}

const getTicketTitleMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const locales = {
        ru: RU,
        en: EN,
    }

    const formattedCreatedDate = format(
        new Date(ticket.createdAt),
        'dd MMMM (HH:mm)',
        { locale: locales[intl.locale] }
    )

    // TODO: rewrite to template string
    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })} № ${ticket.number} ${intl.formatMessage({ id: 'From' })} ${formattedCreatedDate}`
}

interface ITicketDescriptionFieldProps {
    title?: string
    value?: string
    extra?: string
}

const TicketDescriptionField:React.FunctionComponent<ITicketDescriptionFieldProps> = ({ title, value, extra }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    return (
        <>
            <Statistic title={title} value={value || NotDefinedMessage} valueStyle={{ fontSize: '20px' }}/>
            {extra && <Typography.Text type={'secondary'}>{extra}</Typography.Text>}
        </>

    )
}

const CustomizedDivider = () => <Divider style={{ border: 'none' }}/>

const TicketIdPage = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const TicketInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const UserInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.UserInfo' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const FlatNumberMessage = intl.formatMessage({ id: 'field.FlatNumber' })
    const FullNameMessage = intl.formatMessage({ id: 'field.FullName' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const TypeMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Type' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ExecutorExtraMessage = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleMessage = intl.formatMessage({ id: 'field.Responsible' })
    const ResponsibleExtraMessage = intl.formatMessage({ id: 'field.Responsible.description' })

    const router = useRouter()
    const { query: { id } } = router
    const { refetch, loading, obj: ticket, error } = Ticket.useObject({ where: { id } })
    const update = Ticket.useUpdate({}, () => refetch())
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const updateTicketStatus = React.useCallback((variables) => runMutation({
        action:() => update(variables, ticket),
        intl,
    }), [ticket])

    const TicketTitleMessage = getTicketTitleMessage(intl, ticket)

    if (error || loading) {
        return (
            <LoadingOrErrorPage title={TicketTitleMessage} loading={loading} error={ServerErrorMessage}/>
        )
    }

    return (
        <>
            <Head>
                <title>{TicketTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader
                    title={TicketTitleMessage}
                    extra={<TicketStatus ticket={ticket} updateTicketStatus={updateTicketStatus}/>}
                />
                <PageContent>
                    <Row gutter={[12, 12]}>
                        <Col span={8}>
                            <TicketDescriptionField title={TypeMessage} value={get(ticket, ['classifier', 'name'])}/>
                        </Col>
                        <Col span={8}>
                            <TicketDescriptionField
                                title={ExecutorMessage}
                                value={get(ticket, ['executor', 'name'])}
                                extra={ExecutorExtraMessage}
                            />
                        </Col>
                        <Col span={8}>
                            <TicketDescriptionField
                                title={ResponsibleMessage}
                                value={get(ticket, ['executor', 'name'])}
                                extra={ResponsibleExtraMessage}
                            />
                        </Col>
                    </Row>
                    <CustomizedDivider/>
                    <Typography.Title level={3}>{UserInfoMessage}</Typography.Title>
                    <CustomizedDivider/>
                    <Row gutter={[12,12]}>
                        <Col span={12}>
                            <TicketDescriptionField title={AddressMessage} value={get(ticket, ['property', 'address'])}/>
                        </Col>
                        <Col span={6}>
                            <TicketDescriptionField title={FlatNumberMessage} value={ticket.unitName}/>
                        </Col>
                    </Row>
                    <Row gutter={[12,12]}>
                        <Col span={12}>
                            <TicketDescriptionField title={FullNameMessage} value={ticket.clientName}/>
                        </Col>
                        <Col span={6}>
                            <TicketDescriptionField title={PhoneMessage} value={ticket.clientPhone}/>
                        </Col>
                        <Col span={6}>
                            <TicketDescriptionField title={EmailMessage} value={ticket.clientEmail}/>
                        </Col>
                    </Row>
                    <CustomizedDivider/>
                    <Typography.Title level={3}>{TicketInfoMessage}</Typography.Title>
                    <CustomizedDivider/>
                    <Row gutter={[12, 12]}>
                        <Col span={24}>
                            <TicketDescriptionField value={ticket.details}/>
                        </Col>
                    </Row>
                    <CustomizedDivider/>
                    <Link href={`/ticket/${ticket.id}/update`}>
                        <Button type='primary'>
                            {UpdateMessage}
                        </Button>
                    </Link>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TicketIdPage
