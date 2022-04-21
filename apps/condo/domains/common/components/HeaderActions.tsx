import React from 'react'
import { useIntl } from '@core/next/intl'
import Router from 'next/router'
import { Tabs } from 'antd'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'

interface ITabsActionsProps {
    currentActiveKey: string
}

const RemoveTabLineWrapper = styled.div`
  & .ant-tabs-nav::before {
    content: none;
  }
  & .ant-tabs {
    color: ${colors.textSecondary};
    font-weight: 600;
  }
`

export const TabsAuthAction: React.FC<ITabsActionsProps> = (props) => {
    const { currentActiveKey } = props
    const intl = useIntl()
    const registerTab = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const signInTab = intl.formatMessage({ id: 'pages.auth.SignInTitle' })

    return (
        <RemoveTabLineWrapper>
            <Tabs
                defaultActiveKey={currentActiveKey}
                onChange={(activeKey) => Router.push(activeKey)}
                centered
                animated={false}
            >
                <Tabs.TabPane key='/auth/register?step=inputPhone' tab={registerTab}/>
                <Tabs.TabPane key='/auth/signin' tab={signInTab}/>
            </Tabs>
        </RemoveTabLineWrapper>
    )
}
