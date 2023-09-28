import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { CreateContactForm } from '@condo/domains/contact/components/CreateContactForm'
import { ContactsReadAndManagePermissionRequired } from '@condo/domains/contact/components/PageAccess'


interface ICreateContactPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateContactPage: ICreateContactPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'contact.AddContact' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[12, 40]}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <CreateContactForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateContactPage.requiredAccess = ContactsReadAndManagePermissionRequired

export default CreateContactPage