import { Typography, Row, Col, RowProps } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PropertyForm } from '@condo/domains/property/components/PropertyForm'

interface IUpdatePropertyPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]

const UpdatePropertyPage: IUpdatePropertyPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.property.index.UpdatePropertyTitle' })
    const { query: { id } } = useRouter()
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={PAGE_ROW_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <PropertyForm id={id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdatePropertyPage.requiredAccess = OrganizationRequired

export default UpdatePropertyPage
