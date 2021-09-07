import { Typography, Row, Col } from 'antd'
import Error from 'next/error'
import Head from 'next/head'
import React from 'react'
import { DivisionForm } from '@condo/domains/division/components/DivisionForm'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'

interface ICreateDivisionPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateDivisionPage: ICreateDivisionPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.division.create.CreateDivisionTitle' })
    return (
        <FeatureFlagRequired name={'division'} fallback={<Error statusCode={404} />}>
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
                            <DivisionForm />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

CreateDivisionPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllDivisions' }} path={'/property/'} />
CreateDivisionPage.requiredAccess = OrganizationRequired

export default CreateDivisionPage
