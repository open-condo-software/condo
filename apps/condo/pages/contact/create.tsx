import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Typography, Row, Col } from 'antd'
import React from 'react'
import { CreateContactForm } from '@condo/domains/contact/components/CreateContactForm'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}

const CreateContactPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'contact.AddContact' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
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
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

CreateContactPage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id:'pages.condo.contact.PageTitle' }}
    path={'/contact'}/>

export default CreateContactPage