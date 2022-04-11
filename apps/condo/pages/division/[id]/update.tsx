import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { DivisionForm } from '@condo/domains/division/components/DivisionForm'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useRouter } from 'next/router'

interface IUpdateDivisionPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const UpdateDivisionPage: IUpdateDivisionPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.division.update.UpdateDivisionTitle' })
    const { query: { id } } = useRouter()
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <DivisionForm id={id as string}/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateDivisionPage.requiredAccess = OrganizationRequired

export default UpdateDivisionPage
