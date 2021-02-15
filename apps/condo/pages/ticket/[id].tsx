// @ts-nocheck
import { Descriptions, Form } from 'antd'
import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'

import LoadingOrErrorPage from '../../containers/LoadingOrErrorPage'
import { useObject, useUpdate } from '../../schema/Ticket.uistate'

function TicketDescriptionBlock ({ obj }) {
    const intl = useIntl()
    const NumberMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Number' })
    const SourceMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const PropertyMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Property' })
    const ClassifierMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Classifier' })

    // TODO(pahaz): move small to ANT CONFIG!
    return <Descriptions size="small" column={1}>
        <Descriptions.Item label={NumberMsg}>{obj.number}</Descriptions.Item>
        <Descriptions.Item label={SourceMsg}>{obj.source.name}</Descriptions.Item>
        <Descriptions.Item label={PropertyMsg}>{obj.property.name}</Descriptions.Item>
        <Descriptions.Item label={ClassifierMsg}>{obj.classifier.name}</Descriptions.Item>
    </Descriptions>
}

function TicketViewBlock ({ obj, update }) {
    return null
}

function ChangeTicketStatusBlock ({ obj, update }) {
    const [form] = Form.useForm()

    return <Form
        form={form}
        name="ChangeTicketStatusForm"
        onFinish={console.log}
        initialValues={{
            status: obj.status.id,
        }}
    >
        <Form.Item
            name="status"
            label="status"
        >
            {/*<SearchInput search={}/>*/}

        </Form.Item>
    </Form>
}

const TicketIdPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const router = useRouter()
    const { query: { id } } = router
    const { refetch, loading, obj, error } = useObject({ where: { id } })
    const update = useUpdate({}, () => refetch())

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={ServerErrorMsg}/>
    }

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={obj.details || PageTitleMsg}>
                <TicketDescriptionBlock obj={obj}/>
            </PageHeader>
            <PageContent>
                <TicketViewBlock obj={obj} update={update}/>
            </PageContent>
            <PageContent>
                <ChangeTicketStatusBlock obj={obj} update={update}/>
            </PageContent>
        </PageWrapper>
    </>
}

export default TicketIdPage
