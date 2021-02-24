import { Descriptions, Form, Select } from 'antd'
import React, { useMemo } from 'react'
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

function TicketStatus ({ ticket, updateTicketStatus }) {
    const [form] = Form.useForm()
    const { objs: statuses, loading } = TicketStatuses.useObjects()
    const options = useMemo(() => statuses.map(convertGQLItemToFormSelectState), [statuses])

    return (
        <Form
            form={form}
            name="ChangeTicketStatusForm"
            onValuesChange={updateTicketStatus}
            initialValues={{
                status: ticket.status.id,
            }}
        >
            <Form.Item
                name="status"
                label="status"
            >
                <Select options={options} loading={loading}/>
            </Form.Item>
        </Form>
    )
}

const TicketIdPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const NumberMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Number' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const PropertyMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Property' })
    const ClassifierMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Type' })

    const router = useRouter()
    const { query: { id } } = router
    const { refetch, loading, obj: ticket, error } = Ticket.useObject({ where: { id } })
    const update = Ticket.useUpdate({}, () => refetch())
    const changeTicketStatus = (value) => update(value, ticket)

    if (error || loading) {
        return (
            <LoadingOrErrorPage title={PageTitleMessage} loading={loading} error={ServerErrorMessage}/>
        )
    }

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={ticket.details || PageTitleMessage}>
                    <Descriptions size="small" column={1}>
                        <Descriptions.Item label={NumberMessage}>{ticket.number}</Descriptions.Item>
                        <Descriptions.Item label={SourceMessage}>{ticket.source.name}</Descriptions.Item>
                        <Descriptions.Item label={PropertyMessage}>{ticket.property.name}</Descriptions.Item>
                        <Descriptions.Item label={ClassifierMessage}>{ticket.classifier.name}</Descriptions.Item>
                    </Descriptions>
                </PageHeader>
                <PageContent>
                    <TicketStatus ticket={ticket} updateTicketStatus={changeTicketStatus}/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TicketIdPage
