import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { PropertyForm } from '@condo/domains/property/components/PropertyForm'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

export default function CreatePropertyPage() {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyTitle' })
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>
                                {PageTitleMsg}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <PropertyForm />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreatePropertyPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllProperties' }} path={'/property/'} />
CreatePropertyPage.requiredAccess = OrganizationRequired
