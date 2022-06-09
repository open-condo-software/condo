import { FilterFilled } from '@ant-design/icons'
import { jsx } from '@emotion/core'
import React, { useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Typography, Tabs, Col, Row } from 'antd'
import styled from '@emotion/styled'

import { useIntl } from '@core/next/intl'

import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { shadows, colors, fontSizes } from '@condo/domains/common/constants/style'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { SubscriptionPane } from '@condo/domains/subscription/components/SubscriptionPane'
import { StarIcon } from '@condo/domains/common/components/icons/Star'
import { SettingsContent as TicketHintSettings } from '@condo/domains/ticket/components/TicketHint/SettingsContent'
import { TablePageContent } from '../../domains/common/components/containers/BaseLayout/BaseLayout'

const ALWAYS_AVAILABLE_TABS = []

const SettingsTabs = styled(Tabs)`
  & > .ant-tabs-content-holder {
    border: none;
  }
  
  & > .ant-tabs-nav {
    margin-left: 72px;
    width: 280px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: ${shadows.main};
    
    & > .ant-tabs-nav-wrap > .ant-tabs-nav-list > .ant-tabs-tab {
      background-color: transparent;
      border: 1px solid ${colors.inputBorderGrey};
      border-radius: 8px;
      padding: 17px;
      font-size: ${fontSizes.label};

      &.ant-tabs-tab-active {
        border: 1px solid ${colors.black};
        background-color: ${colors.black};

        .ant-tabs-tab-btn {
          color: ${colors.white};
        }
      }
    }
  }
`

const SettingsTab = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StarIcon />
        {title}
    </div>
)

const SettingsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    const RolesAndAccessesTitle = intl.formatMessage({ id: 'RolesAndAccess' })
    const HintTitle = intl.formatMessage({ id: 'Hint' })
    const SubscriptionTitle = intl.formatMessage({ id: 'Subscription' })

    const hasSubscriptionFeature = hasFeature('subscription')

    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const availableTabs = useMemo(() => {
        const result = ALWAYS_AVAILABLE_TABS
        if (hasSubscriptionFeature) result.push('subscription')
        return result
    }, [hasSubscriptionFeature])

    const defaultTab = availableTabs.includes(tab) ? tab : undefined

    const handleTabChange = (newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute)
    }

    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                    <TablePageContent>
                        <SettingsTabs
                            tabPosition={'right'}
                            type={'card'}
                            defaultActiveKey={defaultTab}
                            activeKey={defaultTab}
                            tabBarGutter={8}
                            style={{ overflow: 'visible' }}
                            onChange={handleTabChange}
                        >
                            {
                                hasSubscriptionFeature && (
                                    <Tabs.TabPane
                                        key="subscription"
                                        tab={<SettingsTab title={SubscriptionTitle} />}
                                    >
                                        <SubscriptionPane/>
                                    </Tabs.TabPane>
                                )
                            }
                            <Tabs.TabPane
                                key="rolesAndAccess"
                                tab={<SettingsTab title={RolesAndAccessesTitle} />}
                            />
                            <Tabs.TabPane
                                key="help"
                                tab={<SettingsTab title={HintTitle} />}
                            >
                                <TicketHintSettings />
                            </Tabs.TabPane>
                        </SettingsTabs>
                    </TablePageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}


export default SettingsPage
