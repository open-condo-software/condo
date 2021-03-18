import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import { TicketForm } from '../../containers/TicketForm'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { LinkWithIcon } from '../../components/LinkWithIcon'
import { colors } from '../../constants/style'

const CreateTicketPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.CreateTicketModalTitle' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <OrganizationRequired>
                        <Row gutter={[12, 40]}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <Col span={13}>
                                <TicketForm/>
                            </Col>
                        </Row>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateTicketPage.headerAction = (
    <LinkWithIcon
        icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
        locale={'menu.AllTickets'}
        path={'/ticket/'}
    />
)

export default CreateTicketPage
