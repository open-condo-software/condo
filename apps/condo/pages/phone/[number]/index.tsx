import { Card } from '@condo/domains/common/components/Card/Card'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import styled from '@emotion/styled'
import { Col, Row, Tabs, TabsProps, Typography } from 'antd'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useIntl } from '@condo/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useOrganization } from '@condo/next/organization'

const StyledTabs = styled(Tabs)`
    &.ant-tabs-top > .ant-tabs-nav::before {
      border-bottom: none;
    }
`

const ClientCardPage = () => {
    const intl = useIntl()
    const ShowAllPropertyTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.showAllPropertyTickets' })
    const ContactTicketsMessage = intl.formatMessage({ id: 'pages.clientCard.contactTickets' })
    const EditContactMessage = intl.formatMessage({ id: 'pages.clientCard.editContact' })

    const router = useRouter()
    const phoneNumber = get(router, ['query', 'number']) as string
    const ClientCardTitle = intl.formatMessage({ id: 'pages.clientCard.Title' }, {
        phone: phoneNumber,
    })

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)

    const { objs: contacts } = Contact.useObjects({
        where: {
            organization: { id: organizationId },
            phone: phoneNumber,
        },
    })

    const { objs: tickets } = Ticket.useObjects({
        where: {
            organization: { id: organizationId },
            clientPhone: phoneNumber,
            isResidentTicket: false,
        },
    })

    const renderTabBar: TabsProps['renderTabBar'] = (tabBarProps, DefaultTabBar) => (
        <DefaultTabBar {...tabBarProps}>
            {node => (
                <Card>
                    {node}
                </Card>
            )}
        </DefaultTabBar>
    )

    return (
        <>
            <Head>
                <title>{ClientCardTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row>
                        <Col span={24}>
                            <Typography.Title>{ClientCardTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <StyledTabs renderTabBar={renderTabBar}>
                                <Tabs.TabPane tab='Tab 2' key='item-1'>
                                    Content 1
                                </Tabs.TabPane>
                                <Tabs.TabPane tab='Tab 2' key='item-2'>
                                    Content 2
                                </Tabs.TabPane>
                            </StyledTabs>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default ClientCardPage