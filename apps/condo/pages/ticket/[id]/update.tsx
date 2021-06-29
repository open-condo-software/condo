import { Typography, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'

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
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[0, 40]} style={{ height: '100%' }}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <TicketForm id={query.id as string}/>
                        </Row>
                    </PageContent>
                </OrganizationRequired>
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
