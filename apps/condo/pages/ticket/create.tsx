import { Typography, Row, Col } from 'antd'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { LinkWithIcon } from '@condo/domains/common/components/components/LinkWithIcon'
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

const HeaderAction = () => {
    const intl = useIntl()
    const AllTicketsMessage = intl.formatMessage({ id: 'menu.AllTickets' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/ticket/'}
        >
            {AllTicketsMessage}
        </LinkWithIcon>
    )
}

CreateTicketPage.headerAction = <HeaderAction/>

export default CreateTicketPage
