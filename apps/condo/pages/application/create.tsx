import { Form, Input } from 'antd'
import Head from 'next/head'
import { useOrganization } from '@core/next/organization'
import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { FormWithAction } from '../../containers/FormList'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import React from 'react'
import { t } from '../../utils/react'
import { useApplicationColumns } from './index'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useCreate } from '../../schema/Application.uistate'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

function CreateApplicationModalBlock () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const columns = useApplicationColumns()
    const action = useCreate({ organization: organization.id, status: OPEN_STATUS }, () => alert('yo'))

    return (
        <FormWithAction action={action}>
            {columns.filter(column => column.modal).filter(column => column.create).map(x => {
                return <Form.Item key={x.dataIndex} name={x.dataIndex} label={x.title} rules={x.rules} normalize={x.normalize}>
                    {(x.editableInput) ? x.editableInput() : <Input/>}
                </Form.Item>
            })}
        </FormWithAction>
    )
}

export default () => {
    const PageTitleMsg = t('pages.condo.application.index.CreateApplicationModalTitle')

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    <OrganizationRequired>
                        <CreateApplicationModalBlock/>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}