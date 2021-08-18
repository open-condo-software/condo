import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { CreateDivisionForm } from '../../domains/division/components/DivisionForm/CreateDivisionForm'

interface ICreateDivisionPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateDivisionPage: ICreateDivisionPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.division.create.CreateDivisionTitle' })
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
                            <CreateDivisionForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateDivisionPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllDivisions' }} path={'/division/'}/>
CreateDivisionPage.requiredAccess = OrganizationRequired

export default CreateDivisionPage
