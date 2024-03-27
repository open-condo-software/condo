import { Typography, Row, Col, RowProps } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tour } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PropertyForm } from '@condo/domains/property/components/PropertyForm'

const PROPERTY_CREATE_PAGE_GUTTER: RowProps['gutter'] = [0, 40]
const PROPERTY_CREATE_PAGE_TITLE_STYLE: React.CSSProperties = { margin: 0 }

export default function CreatePropertyPage () {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyTitle' })
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={PROPERTY_CREATE_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1} style={PROPERTY_CREATE_PAGE_TITLE_STYLE}>
                                {PageTitleMsg}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Tour.Provider>
                                <PropertyForm />
                            </Tour.Provider>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreatePropertyPage.requiredAccess = OrganizationRequired

