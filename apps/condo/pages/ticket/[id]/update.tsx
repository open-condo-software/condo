import { Typography, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContent, PageWrapper } from '../../../containers/BaseLayout'
import { OrganizationRequired } from '../../../containers/OrganizationRequired'
import { TicketForm } from '../../../containers/TicketForm'
import { LinkWithIcon } from '../../../components/LinkWithIcon'
import { colors } from '../../../constants/style'

const TicketUpdatePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.EditTicketModalTitle' })

    const { query } = useRouter()

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
                                <TicketForm id={query.id as string}/>
                            </Col>
                        </Row>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const { query } = useRouter()
    const inl = useIntl()
    const BackMessage = inl.formatMessage({ id: 'Back' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={`/ticket/${query.id}`}
        >
            {BackMessage}
        </LinkWithIcon>
    )
}

TicketUpdatePage.headerAction = <HeaderAction/>

export default TicketUpdatePage
