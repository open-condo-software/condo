import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import { MessageDescriptor } from '@formatjs/intl/src/types'
import Router, { useRouter } from 'next/router'
import get from 'lodash/get'
import { Space, Typography, Tabs } from 'antd'
import { Button } from './Button'
import styled from '@emotion/styled'

interface IReturnBackHeaderActionProps {
    descriptor: MessageDescriptor
    path: ((id: string) => string) | string
    useBrowserHistory?: boolean
}

interface ITitleHeaderActionProps {
    descriptor: MessageDescriptor
}

interface ITabsActionsProps {
    currentActiveKey: string
}

const IconContainer = styled.div`
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: ${colors.lightGrey[5]};
  border-radius: 8px;
`

const StyledButton = styled(Button)`
  border: none;
  padding: 0;
  height: 24px;
  box-sizing: border-box;
  font-size: 12px;

  &:hover {
    .icon {
      background-color: ${colors.lightGrey[6]};
    }
  }
`

export const ReturnBackHeaderAction: React.FC<IReturnBackHeaderActionProps> = ({
    descriptor,
    path,
    useBrowserHistory = true,
}) => {
    const intl = useIntl()
    const BackMessage = intl.formatMessage(descriptor)
    const [hasBrowserHistory, setHasBrowserHistory] = useState<boolean>(false)
    const { query, back, push } = useRouter()
    const url = typeof path === 'string' ? path : path(String(get(query, 'id')))

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHasBrowserHistory(window.history.length > 2)
        }
    }, [])

    const handleClick = useCallback(() => {
        if (hasBrowserHistory && useBrowserHistory) {
            back()
            return
        }
        push(url)
    }, [hasBrowserHistory, url])

    return (
        <StyledButton type='link' onClick={handleClick}>
            <Space size={16}>
                <IconContainer className='icon'>
                    <ArrowLeftOutlined style={{ color: colors.white }}/>
                </IconContainer>
                <Typography.Text className='text'>
                    {BackMessage}
                </Typography.Text>
            </Space>
        </StyledButton>
    )
}

export const TitleHeaderAction: React.FC<ITitleHeaderActionProps> = (props) => {
    const { descriptor } = props
    const intl = useIntl()
    const TitleMessage = intl.formatMessage(descriptor)

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {TitleMessage}
            </Typography.Text>
        </Space>
    )
}

export const TabsAuthAction: React.FC<ITabsActionsProps> = (props) => {
    const { currentActiveKey } = props
    const intl = useIntl()
    const registerTab = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const signInTab = intl.formatMessage({ id: 'SignIn' })

    return (
        <Tabs
            defaultActiveKey={currentActiveKey}
            onChange={(activeKey) => Router.push(activeKey)}
            centered
        >
            <Tabs.TabPane key='/auth/register' tab={registerTab}/>
            <Tabs.TabPane key='/auth/signin' tab={signInTab}/>
        </Tabs>
    )
}
