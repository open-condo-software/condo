import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'
import { CreateEmployeeForm } from '@condo/domains/organization/components/CreateEmployeeForm'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}

const CreateEmployeePage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'employee.AddEmployee' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[12, 40]}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <Col span={10}>
                                <CreateEmployeeForm/>
                            </Col>
                        </Row>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.employee.PageTitle' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/employee/'}
        >
            {AllPropertiesMessage}
        </LinkWithIcon>
    )
}

CreateEmployeePage.headerAction = <HeaderAction/>

export default CreateEmployeePage
