import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { PropertyForm } from '@condo/domains/property/components/PropertyForm'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}

const CreatePropertyPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.property.index.CreatePropertyTitle' })
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <PropertyForm/>
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
    const AllPropertiesMessage = intl.formatMessage({ id: 'menu.AllProperties' })
    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/property/'}
        >
            {AllPropertiesMessage}
        </LinkWithIcon>
    )
}

CreatePropertyPage.headerAction = <HeaderAction/>

export default CreatePropertyPage
